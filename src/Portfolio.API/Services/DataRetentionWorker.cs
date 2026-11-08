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

/// <summary>
/// Deletes visitor data once it is past the retention period promised on the privacy page (/privacy):
/// chat logs after 90 days, contact messages after 12 months. Change both places together.
/// </summary>
public class DataRetentionWorker : BackgroundService
{
    public static readonly TimeSpan ChatRetention = TimeSpan.FromDays(90);
    public static readonly TimeSpan ContactRetention = TimeSpan.FromDays(365);
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    private readonly IServiceProvider _services;
    private readonly ILogger<DataRetentionWorker> _logger;

    public DataRetentionWorker(IServiceProvider services, ILogger<DataRetentionWorker> logger)
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
                var removed = await PurgeAsync(db, DateTime.UtcNow, stoppingToken);
                if (removed.Total > 0)
                {
                    _logger.LogInformation("Retention removed {Messages} chat messages, {Sessions} chat sessions and {Contacts} contact messages.",
                        removed.ChatMessages, removed.ChatSessions, removed.Contacts);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Data retention cleanup failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    public record Removed(int ChatMessages, int ChatSessions, int Contacts)
    {
        public int Total => ChatMessages + ChatSessions + Contacts;
    }

    public static async Task<Removed> PurgeAsync(PortfolioDbContext db, DateTime now, CancellationToken cancellationToken)
    {
        var chatCutoff = now - ChatRetention;
        var contactCutoff = now - ContactRetention;

        var messages = await db.ChatMessages.Where(m => m.CreatedAt < chatCutoff).ExecuteDeleteAsync(cancellationToken);
        var sessions = await db.ChatSessions.Where(s => s.LastMessageAt < chatCutoff).ExecuteDeleteAsync(cancellationToken);
        var contacts = await db.ContactMessages.Where(c => c.CreatedAt < contactCutoff).ExecuteDeleteAsync(cancellationToken);
        return new Removed(messages, sessions, contacts);
    }
}
