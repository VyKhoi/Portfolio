using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Portfolio.API.Services;

public class EmailBackgroundWorker : BackgroundService
{
    private readonly ContactChannel _channel;
    private readonly EmailService _emailService;
    private readonly ILogger<EmailBackgroundWorker> _logger;

    public EmailBackgroundWorker(ContactChannel channel, EmailService emailService, ILogger<EmailBackgroundWorker> logger)
    {
        _channel = channel;
        _emailService = emailService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailBackgroundWorker is active and listening to ContactChannel.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var contact = await _channel.Reader.ReadAsync(stoppingToken);
                _logger.LogInformation("Received contact message from queue: {Id} - {Email}", contact.Id, contact.Email);
                await _emailService.SendContactNotificationAsync(contact);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing contact message from channel.");
                await Task.Delay(1000, stoppingToken);
            }
        }

        _logger.LogInformation("EmailBackgroundWorker stopped.");
    }
}
