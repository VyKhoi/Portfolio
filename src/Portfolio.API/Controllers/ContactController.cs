using System;
using System.Linq;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Portfolio.API.Data;
using Portfolio.API.Entities;
using Portfolio.API.Services;

namespace Portfolio.API.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private const int MaxContactsPerWindow = 3;
    private static readonly TimeSpan ContactWindow = TimeSpan.FromHours(1);
    private static readonly string[] AllowedStatuses = { "Pending", "Read", "Replied" };

    private readonly PortfolioDbContext _db;
    private readonly ContactChannel _channel;
    private readonly IMemoryCache _cache;

    public ContactController(PortfolioDbContext db, ContactChannel channel, IMemoryCache cache)
    {
        _db = db;
        _channel = channel;
        _cache = cache;
    }

    private static bool IsValidEmail(string email)
    {
        return MailAddress.TryCreate(email, out var parsed)
            && parsed.Address == email
            && parsed.Host.Contains('.');
    }

    public class ContactRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        // Honeypot trap: hidden input autofilled by bots, left empty by real humans
        public string? CompanyTrap { get; set; }
    }

    [HttpPost("messages")]
    public async Task<IActionResult> SubmitMessage([FromBody] ContactRequestDto request)
    {
        // 1. Honeypot check: if filled, silently discard without notifying Telegram or saving to DB
        if (!string.IsNullOrEmpty(request.CompanyTrap))
        {
            return Ok(new { success = true, messageId = Guid.NewGuid() });
        }

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Name, Email, and Message are required." });
        }

        if (request.Name.Length > 100 || request.Email.Length > 100 || request.Message.Length > 1000)
        {
            return BadRequest(new { error = "Dữ liệu nhập vượt quá giới hạn độ dài cho phép." });
        }

        if (!IsValidEmail(request.Email.Trim()))
        {
            return BadRequest(new { error = "Email không hợp lệ." });
        }

        // Per-IP cap so one sender cannot flood the inbox (the gateway rate limit is per minute only)
        var quotaKey = $"contact_quota_{HttpContext.Connection.RemoteIpAddress}";
        var sent = _cache.GetOrCreate(quotaKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ContactWindow;
            return 0;
        });
        if (sent >= MaxContactsPerWindow)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { error = "Bạn đã gửi khá nhiều tin nhắn, vui lòng thử lại sau." });
        }
        _cache.Set(quotaKey, sent + 1, ContactWindow);

        var contact = new ContactMessage
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Subject = "New Contact from Portfolio",
            Message = request.Message.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.ContactMessages.Add(contact);
        await _db.SaveChangesAsync();

        // Publish to in-memory Channel (non-blocking, handled by EmailBackgroundWorker)
        await _channel.PublishAsync(contact);

        return Ok(new { success = true, messageId = contact.Id });
    }

    [HttpGet("messages")]
    [Authorize]
    public async Task<IActionResult> GetMessages()
    {
        var messages = await _db.ContactMessages
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
        return Ok(messages);
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    [HttpPatch("messages/{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto request)
    {
        if (!AllowedStatuses.Contains(request.Status))
        {
            return BadRequest(new { error = "Invalid status." });
        }

        var message = await _db.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();

        message.Status = request.Status;
        await _db.SaveChangesAsync();

        return Ok(new { success = true, status = message.Status });
    }

    [HttpDelete("messages/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteMessage(Guid id)
    {
        var message = await _db.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();

        _db.ContactMessages.Remove(message);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
