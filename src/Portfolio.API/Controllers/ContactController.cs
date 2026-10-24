using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Portfolio.API.Data;
using Portfolio.API.Entities;
using Portfolio.API.Services;

namespace Portfolio.API.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly PortfolioDbContext _db;
    private readonly ContactChannel _channel;

    public ContactController(PortfolioDbContext db, ContactChannel channel)
    {
        _db = db;
        _channel = channel;
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
