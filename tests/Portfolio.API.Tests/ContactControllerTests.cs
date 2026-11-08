using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Portfolio.API.Controllers;
using Portfolio.API.Data;
using Portfolio.API.Services;
using Xunit;

namespace Portfolio.API.Tests;

public class ContactControllerTests
{
    private static (ContactController Controller, PortfolioDbContext Db, ContactChannel Channel) Create()
    {
        var db = new PortfolioDbContext(new DbContextOptionsBuilder<PortfolioDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        var channel = new ContactChannel();
        var http = new DefaultHttpContext();
        http.Connection.RemoteIpAddress = IPAddress.Parse("1.1.1.1");
        var controller = new ContactController(db, channel, new MemoryCache(new MemoryCacheOptions()))
        {
            ControllerContext = new ControllerContext { HttpContext = http },
        };
        return (controller, db, channel);
    }

    private static ContactController.ContactRequestDto Request(bool consent) => new()
    {
        Name = "Lan",
        Email = "lan@example.com",
        Message = "Hello",
        Consent = consent,
    };

    [Fact]
    public async Task Message_without_consent_is_rejected_and_not_saved()
    {
        var (controller, db, channel) = Create();

        var result = await controller.SubmitMessage(Request(consent: false));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(db.ContactMessages);
        Assert.False(channel.Reader.TryRead(out _));
    }

    [Fact]
    public async Task Message_with_consent_is_saved_with_consent_time()
    {
        var (controller, db, channel) = Create();

        var result = await controller.SubmitMessage(Request(consent: true));

        Assert.IsType<OkObjectResult>(result);
        var saved = Assert.Single(db.ContactMessages);
        Assert.NotNull(saved.ConsentedAt);
        Assert.True(channel.Reader.TryRead(out _));
    }
}
