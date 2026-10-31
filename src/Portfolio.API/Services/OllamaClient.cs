using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Portfolio.API.Services;

/// <summary>
/// Lightweight HTTP client communicating with local Ollama container.
/// All model knowledge, persona, and parameters are encapsulated inside the custom 'meo-code' model
/// defined in the dedicated 'src/Portfolio.AI' project.
/// </summary>
public class OllamaClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<OllamaClient> _logger;

    public OllamaClient(HttpClient httpClient, IConfiguration config, ILogger<OllamaClient> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;

        var baseUrl = _config["Ollama:BaseUrl"] ?? "http://localhost:11434";
        _httpClient.BaseAddress = new Uri(baseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(60);
    }

    public async Task<string> GenerateReplyAsync(List<OllamaChatMessage> conversationHistory, string userMessage)
    {
        var model = _config["Ollama:Model"] ?? "sigma-cat";

        var messages = new List<OllamaChatMessage>();

        // Include recent conversation context (last 6 messages) for multi-turn coherence
        var recentHistory = conversationHistory.Count > 6 
            ? conversationHistory.GetRange(conversationHistory.Count - 6, 6) 
            : conversationHistory;

        messages.AddRange(recentHistory);
        messages.Add(new() { Role = "user", Content = userMessage });

        var requestBody = new OllamaChatRequest
        {
            Model = model,
            Messages = messages,
            Stream = false
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/chat", requestBody);
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<OllamaChatResponse>();
                if (!string.IsNullOrWhiteSpace(result?.Message?.Content))
                {
                    return result.Message.Content.Trim();
                }
            }

            _logger.LogWarning("Ollama returned non-success code: {StatusCode}", response.StatusCode);
            return "Meow... Sigma Cat đang suy nghĩ một chút, bạn đợi tí nha! 😼";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to communicate with Ollama service at {BaseUrl}", _httpClient.BaseAddress);
            return "Meow... Hiện tại Sigma Cat không kết nối được tới não bộ AI local. Bạn thử lại sau nhé! 😼";
        }
    }

    public async IAsyncEnumerable<string> StreamReplyAsync(
        List<OllamaChatMessage> conversationHistory, 
        string userMessage, 
        [System.Runtime.CompilerServices.EnumeratorCancellation] System.Threading.CancellationToken cancellationToken = default)
    {
        var model = _config["Ollama:Model"] ?? "sigma-cat";

        var messages = new List<OllamaChatMessage>();
        var recentHistory = conversationHistory.Count > 6 
            ? conversationHistory.GetRange(conversationHistory.Count - 6, 6) 
            : conversationHistory;

        messages.AddRange(recentHistory);
        messages.Add(new() { Role = "user", Content = userMessage });

        var requestBody = new OllamaChatRequest
        {
            Model = model,
            Messages = messages,
            Stream = true
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/chat")
        {
            Content = JsonContent.Create(requestBody)
        };

        HttpResponseMessage? response = null;
        string? initError = null;
        try
        {
            response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initiate stream with Ollama at {BaseUrl}", _httpClient.BaseAddress);
            initError = "Meow... Hiện tại Sigma Cat đang bận một chút, bạn đợi xíu nha! 😼";
        }

        if (initError != null || response == null)
        {
            yield return initError ?? "Meow... Hiện tại Sigma Cat không kết nối được tới não bộ AI local. Bạn thử lại sau nhé! 😼";
            yield break;
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new System.IO.StreamReader(stream);

        while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(line)) continue;

            OllamaChatResponse? chunk = null;
            try
            {
                chunk = JsonSerializer.Deserialize<OllamaChatResponse>(line);
            }
            catch { }

            if (!string.IsNullOrEmpty(chunk?.Message?.Content))
            {
                yield return chunk.Message.Content;
            }
        }
    }
}

public class OllamaChatRequest
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = "sigma-cat";

    [JsonPropertyName("messages")]
    public List<OllamaChatMessage> Messages { get; set; } = new();

    [JsonPropertyName("stream")]
    public bool Stream { get; set; } = false;
}

public class OllamaChatMessage
{
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}

public class OllamaChatResponse
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public OllamaChatMessage? Message { get; set; }
}
