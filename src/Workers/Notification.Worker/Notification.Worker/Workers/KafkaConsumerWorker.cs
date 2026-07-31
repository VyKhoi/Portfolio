using Confluent.Kafka;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Threading;
using System.Threading.Tasks;
using Notification.Worker.Services;
using Microsoft.AspNetCore.SignalR;
using Notification.Worker.Hubs;
using System;
using System.Text.Json;

namespace Notification.Worker.Workers;

public class KafkaConsumerWorker : BackgroundService
{
    private readonly ILogger<KafkaConsumerWorker> _logger;
    private readonly IConfiguration _config;
    private readonly EmailService _emailService;
    private readonly IHubContext<NotificationHub> _hubContext;

    public KafkaConsumerWorker(ILogger<KafkaConsumerWorker> logger, IConfiguration config, EmailService emailService, IHubContext<NotificationHub> hubContext)
    {
        _logger = logger;
        _config = config;
        _emailService = emailService;
        _hubContext = hubContext;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                var conf = new ConsumerConfig
                {
                    GroupId = "notification-group",
                    BootstrapServers = _config["Kafka:BootstrapServers"] ?? "localhost:9092",
                    AutoOffsetReset = AutoOffsetReset.Earliest
                };

                using var c = new ConsumerBuilder<string, string>(conf)
                    .SetLogHandler((_, logMessage) => _logger.LogInformation("Kafka Log: {Message}", logMessage.Message))
                    .SetErrorHandler((_, error) => _logger.LogError("Kafka Error: {Reason}", error.Reason))
                    .Build();
                    
                c.Subscribe("contact-events");

                _logger.LogInformation("Kafka Consumer started and subscribed to contact-events.");

                try
                {
                    while (!stoppingToken.IsCancellationRequested)
                    {
                        try
                        {
                            var cr = c.Consume(stoppingToken);
                            _logger.LogInformation("Consumed message '{Message}' at: '{TopicPartitionOffset}'.", cr.Message.Value, cr.TopicPartitionOffset);

                            try
                            {
                                await _hubContext.Clients.All.SendAsync("ContactReceived", cr.Message.Value, cancellationToken: stoppingToken);
                                var toEmail = _config["Mail:ToEmail"] ?? "admin@portfolio.local";
                                
                                var contact = JsonSerializer.Deserialize<ContactEvent>(cr.Message.Value, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                                var htmlTemplate = $@"
                                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                                    <div style='background-color: #4F46E5; color: white; padding: 20px; text-align: center;'>
                                        <h2 style='margin: 0;'>New Contact Request</h2>
                                        <p style='margin: 5px 0 0 0; opacity: 0.9;'>You have a new message from your Portfolio!</p>
                                    </div>
                                    <div style='padding: 20px; background-color: #f9fafb;'>
                                        <table style='width: 100%; border-collapse: collapse; text-align: left;'>
                                            <tr>
                                                <td style='padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 100px; color: #374151;'>Name:</td>
                                                <td style='padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;'>{contact?.Name}</td>
                                            </tr>
                                            <tr>
                                                <td style='padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;'>Email:</td>
                                                <td style='padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;'><a href='mailto:{contact?.Email}' style='color: #4F46E5; text-decoration: none;'>{contact?.Email}</a></td>
                                            </tr>
                                            <tr>
                                                <td style='padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;'>Subject:</td>
                                                <td style='padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827;'>{contact?.Subject}</td>
                                            </tr>
                                            <tr>
                                                <td style='padding: 10px; font-weight: bold; vertical-align: top; color: #374151;'>Message:</td>
                                                <td style='padding: 10px; color: #111827; white-space: pre-wrap; background-color: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 5px;'>{contact?.Message}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div style='background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;'>
                                        <p style='margin: 0;'>Received at: {contact?.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC</p>
                                        <p style='margin: 5px 0 0 0;'>This is an automated message from your Portfolio System.</p>
                                    </div>
                                </div>";

                                await _emailService.SendEmailAsync(toEmail, $"🎉 [{contact?.Subject}] Có người liên hệ: {contact?.Name}", htmlTemplate);
                            }
                            catch (Exception processEx)
                            {
                                _logger.LogError(processEx, "Error processing message");
                            }
                        }
                        catch (ConsumeException e)
                        {
                            _logger.LogError(e, "Consume error: {Reason}", e.Error.Reason);
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    c.Close();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error in KafkaConsumerWorker");
            }
        }, stoppingToken);

        return Task.CompletedTask;
    }
}

public class ContactEvent
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Subject { get; set; }
    public string Message { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
