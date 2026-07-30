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
                                await _emailService.SendEmailAsync("admin@portfolio.local", "New Contact Message", cr.Message.Value);
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
