using System.Threading.Channels;
using Portfolio.API.Services;

namespace Portfolio.API.Features.Chat;

/// <summary>Only says that a turn happened. The visitor's words stay in the database: Telegram's servers are abroad.</summary>
public record ChatNotification(string SessionId, string Source);

public class ChatNotificationChannel
{
    private readonly Channel<ChatNotification> _channel = Channel.CreateBounded<ChatNotification>(
        new BoundedChannelOptions(100) { FullMode = BoundedChannelFullMode.DropOldest, SingleReader = true });

    public void Publish(ChatNotification notification) => _channel.Writer.TryWrite(notification);

    public ChannelReader<ChatNotification> Reader => _channel.Reader;
}

/// <summary>Sends one Telegram message per finished conversation turn, outside the request.</summary>
public class ChatNotificationWorker : BackgroundService
{
    private readonly ChatNotificationChannel _channel;
    private readonly IServiceProvider _services;

    public ChatNotificationWorker(ChatNotificationChannel channel, IServiceProvider services)
    {
        _channel = channel;
        _services = services;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var turn in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            using var scope = _services.CreateScope();
            var telegram = scope.ServiceProvider.GetRequiredService<TelegramNotifier>();
            var session = turn.SessionId.Length > 8 ? turn.SessionId[..8] : turn.SessionId;
            await telegram.SendMessageAsync(
                $"😼 <b>Sigma Cat</b> ({TelegramNotifier.Escape(turn.Source)}): phiên <code>{TelegramNotifier.Escape(session)}</code> có tin mới, đọc trong /dashboard/ai-logs");
        }
    }
}

/// <summary>Loads the model after boot. Ollama may start later than the API, so keep trying for a few minutes.</summary>
public class LlmWarmupService : BackgroundService
{
    private const int MaxAttempts = 20;
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(15);

    private readonly IServiceProvider _services;
    private readonly ILogger<LlmWarmupService> _logger;

    public LlmWarmupService(IServiceProvider services, ILogger<LlmWarmupService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        for (var attempt = 1; attempt <= MaxAttempts && !stoppingToken.IsCancellationRequested; attempt++)
        {
            try
            {
                using var scope = _services.CreateScope();
                var prompt = await scope.ServiceProvider.GetRequiredService<ChatPromptBuilder>().BuildAsync(stoppingToken);
                await scope.ServiceProvider.GetRequiredService<ILlmClient>().WarmUpAsync(prompt, stoppingToken);
                _logger.LogInformation("Sigma Cat model is loaded.");
                return;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogInformation("Sigma Cat warm-up attempt {Attempt} failed: {Reason}", attempt, ex.Message);
                await Task.Delay(RetryDelay, stoppingToken);
            }
        }
    }
}
