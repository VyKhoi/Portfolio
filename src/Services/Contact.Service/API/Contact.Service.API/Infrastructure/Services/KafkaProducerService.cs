using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Threading.Tasks;
using System;

namespace Contact.Service.API.Infrastructure.Services;

public class KafkaProducerService : IDisposable
{
    private readonly IProducer<string, string> _producer;

    public KafkaProducerService(IConfiguration configuration)
    {
        var config = new ProducerConfig { BootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092" };
        _producer = new ProducerBuilder<string, string>(config).Build();
    }

    public async Task PublishAsync<T>(string topic, string key, T message)
    {
        var json = JsonSerializer.Serialize(message);
        var msg = new Message<string, string> { Key = key, Value = json };

        await _producer.ProduceAsync(topic, msg);
        _producer.Flush(TimeSpan.FromSeconds(5));
    }

    public void Dispose()
    {
        _producer?.Dispose();
    }
}
