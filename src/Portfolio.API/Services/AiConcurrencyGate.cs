using System;
using System.Threading;
using System.Threading.Tasks;

namespace Portfolio.API.Services;

/// <summary>
/// Caps how many requests hit Ollama at once. Ollama runs one generation at a time on CPU, so a burst of
/// chat requests would otherwise queue up for minutes and pin the whole server; extra callers get a
/// friendly "busy" reply instead.
/// </summary>
public class AiConcurrencyGate
{
    private readonly SemaphoreSlim _semaphore = new(2, 2);
    private static readonly TimeSpan MaxWait = TimeSpan.FromSeconds(15);

    public Task<bool> TryEnterAsync(CancellationToken cancellationToken = default)
        => _semaphore.WaitAsync(MaxWait, cancellationToken);

    public void Exit() => _semaphore.Release();
}
