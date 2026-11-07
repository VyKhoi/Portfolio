using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace Portfolio.API.Features.Chat;

public record LlmMessage(string Role, string Content);

public class LlmUnavailableException : Exception
{
    public LlmUnavailableException(string message, Exception? inner = null) : base(message, inner) { }
}

public interface ILlmClient
{
    /// <summary>Streams the reply. Throws <see cref="LlmUnavailableException"/> when the model cannot answer.</summary>
    IAsyncEnumerable<string> StreamAsync(IReadOnlyList<LlmMessage> messages, CancellationToken cancellationToken);

    /// <summary>Loads the model and fills its prompt cache so the first visitor does not pay for it.</summary>
    Task WarmUpAsync(string systemPrompt, CancellationToken cancellationToken);
}

public class OllamaClient : ILlmClient
{
    private static readonly JsonSerializerOptions IgnoreNulls = new() { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    private readonly HttpClient _http;
    private readonly OllamaOptions _options;

    public OllamaClient(HttpClient http, IOptions<OllamaOptions> options)
    {
        _options = options.Value;
        _http = http;
        _http.BaseAddress = new Uri(_options.BaseUrl);
        _http.Timeout = TimeSpan.FromSeconds(_options.FirstByteTimeoutSeconds);
    }

    public async IAsyncEnumerable<string> StreamAsync(
        IReadOnlyList<LlmMessage> messages,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        using var response = await SendAsync(messages, _options.NumPredict, cancellationToken);
        using var reader = new StreamReader(await response.Content.ReadAsStreamAsync(cancellationToken));

        while (await ReadLineAsync(reader, cancellationToken) is { } line)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var chunk = JsonSerializer.Deserialize<ChatChunk>(line)
                ?? throw new LlmUnavailableException("Ollama sent an empty chunk.");
            if (!string.IsNullOrEmpty(chunk.Error)) throw new LlmUnavailableException(chunk.Error);
            if (!string.IsNullOrEmpty(chunk.Message?.Content)) yield return chunk.Message.Content;
        }
    }

    public async Task WarmUpAsync(string systemPrompt, CancellationToken cancellationToken)
    {
        using var response = await SendAsync(
            new[] { new LlmMessage("system", systemPrompt), new LlmMessage("user", "hello") },
            numPredict: 1,
            cancellationToken);
        await response.Content.ReadAsStringAsync(cancellationToken);
    }

    private async Task<HttpResponseMessage> SendAsync(IReadOnlyList<LlmMessage> messages, int numPredict, CancellationToken cancellationToken)
    {
        var body = new
        {
            model = _options.Model,
            stream = true,
            // Qwen3.5 reasons before answering by default, too slow for a chat widget on this server
            think = false,
            keep_alive = _options.KeepAlive,
            messages = messages.Select(m => new { role = m.Role, content = m.Content }),
            options = new
            {
                temperature = _options.Temperature,
                top_p = _options.TopP,
                top_k = _options.TopK,
                repeat_penalty = _options.RepeatPenalty,
                num_predict = numPredict,
                num_ctx = _options.NumCtx,
                num_thread = _options.NumThread,
                num_gpu = _options.NumGpu,
            },
        };
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/chat") { Content = JsonContent.Create(body, options: IgnoreNulls) };

        try
        {
            var response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (response.IsSuccessStatusCode) return response;

            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            var status = (int)response.StatusCode;
            response.Dispose();
            throw new LlmUnavailableException($"Ollama returned {status}: {error}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !cancellationToken.IsCancellationRequested)
        {
            throw new LlmUnavailableException("Could not reach Ollama.", ex);
        }
    }

    private static async Task<string?> ReadLineAsync(StreamReader reader, CancellationToken cancellationToken)
    {
        try
        {
            return await reader.ReadLineAsync(cancellationToken);
        }
        catch (IOException ex)
        {
            throw new LlmUnavailableException("Ollama closed the stream.", ex);
        }
    }

    private sealed record ChatChunk(
        [property: JsonPropertyName("message")] ChunkMessage? Message,
        [property: JsonPropertyName("error")] string? Error);

    private sealed record ChunkMessage([property: JsonPropertyName("content")] string? Content);
}
