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
        // Bounded so a flood of submissions cannot grow memory without limit; when full the oldest
        // pending email is dropped (the message itself is already saved in the database).
        _channel = Channel.CreateBounded<ContactMessage>(new BoundedChannelOptions(100)
        {
            SingleReader = true,
            SingleWriter = false,
            FullMode = BoundedChannelFullMode.DropOldest
        });
    }

    public async ValueTask PublishAsync(ContactMessage message, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(message, cancellationToken);
    }

    public ChannelReader<ContactMessage> Reader => _channel.Reader;
}
