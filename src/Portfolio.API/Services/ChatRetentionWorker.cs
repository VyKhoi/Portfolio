using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Portfolio.API.Data;

namespace Portfolio.API.Services;

/// <summary>Deletes visitor chat logs older than 90 days once a day so spam cannot grow the database forever.</summary>
public class ChatRetentionWorker : BackgroundService
{
    private static readonly TimeSpan Retention = TimeSpan.FromDays(90);
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    private readonly IServiceProvider _services;
    private readonly ILogger<ChatRetentionWorker> _logger;

    public ChatRetentionWorker(IServiceProvider services, ILogger<ChatRetentionWorker> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Let startup migrations finish first.
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
                var cutoff = DateTime.UtcNow - Retention;

                var messages = await db.ChatMessages.Where(m => m.CreatedAt < cutoff).ExecuteDeleteAsync(stoppingToken);
                var sessions = await db.ChatSessions.Where(s => s.LastMessageAt < cutoff).ExecuteDeleteAsync(stoppingToken);

                if (messages > 0 || sessions > 0)
                {
                    _logger.LogInformation("Chat retention removed {Messages} messages and {Sessions} sessions older than {Days} days.",
                        messages, sessions, Retention.TotalDays);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Chat retention cleanup failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}
