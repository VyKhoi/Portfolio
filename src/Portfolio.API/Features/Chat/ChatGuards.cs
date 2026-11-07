using System.Globalization;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Portfolio.API.Features.Chat;

/// <summary>
/// Caps how many requests reach Ollama at once. A burst would otherwise queue for minutes and pin the
/// server's CPU, so extra callers get the "busy" reply instead.
/// </summary>
public class GenerationGate
{
    private readonly SemaphoreSlim _semaphore;
    private readonly TimeSpan _maxWait;

    public GenerationGate(IOptions<ChatOptions> options)
    {
        var limit = options.Value.MaxConcurrentGenerations;
        _semaphore = new SemaphoreSlim(limit, limit);
        _maxWait = TimeSpan.FromSeconds(options.Value.GenerationWaitSeconds);
    }

    public Task<bool> TryEnterAsync(CancellationToken cancellationToken = default)
        => _semaphore.WaitAsync(_maxWait, cancellationToken);

    public void Exit() => _semaphore.Release();
}

/// <summary>Fixed-window limit per client IP, kept in memory because the API runs as one process.</summary>
public class ChatQuota
{
    private sealed class Counter
    {
        public int Count;
    }

    private readonly IMemoryCache _cache;
    private readonly ChatOptions _options;

    public ChatQuota(IMemoryCache cache, IOptions<ChatOptions> options)
    {
        _cache = cache;
        _options = options.Value;
    }

    public bool TryConsume(string clientIp)
    {
        var counter = _cache.GetOrCreate($"chat-quota:{clientIp}", entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_options.QuotaWindowMinutes);
            return new Counter();
        })!;
        return Interlocked.Increment(ref counter.Count) <= _options.QuotaMessages;
    }
}

public static class ChatSessionId
{
    /// <summary>Session ids come from the browser; anything odd gets a fresh id so junk stays out of the database.</summary>
    public static string Normalize(string? raw) => IsValid(raw) ? raw! : Guid.NewGuid().ToString();

    public static bool IsValid(string? value)
        => !string.IsNullOrEmpty(value)
           && value.Length is >= 8 and <= 64
           && value.All(c => char.IsAsciiLetterOrDigit(c) || c == '-');
}

public static class ChatLanguage
{
    public const string English = "en";
    public const string Vietnamese = "vi";

    public static string Normalize(string? language) => language == Vietnamese ? Vietnamese : English;

    /// <summary>
    /// Language the reply must use. Vietnamese marks settle it; a plain-letter message follows the page,
    /// because people also type Vietnamese without marks. The small model cannot be trusted to pick by itself.
    /// </summary>
    public static string ForReply(string message, string pageLanguage)
    {
        var hasVietnameseMarks = message.Contains('đ', StringComparison.OrdinalIgnoreCase)
            || message.Normalize(NormalizationForm.FormD).Any(c => CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark);
        return hasVietnameseMarks ? Vietnamese : pageLanguage;
    }
}
