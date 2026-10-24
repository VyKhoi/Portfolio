using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Portfolio.API.Entities;

namespace Portfolio.API.Services;

public class ContactChannel
{
    private readonly Channel<ContactMessage> _channel;

    public ContactChannel()
    {
        // Unbounded channel for high-throughput, non-blocking in-memory queue
        _channel = Channel.CreateUnbounded<ContactMessage>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
    }

    public async ValueTask PublishAsync(ContactMessage message, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(message, cancellationToken);
    }

    public ChannelReader<ContactMessage> Reader => _channel.Reader;
}
