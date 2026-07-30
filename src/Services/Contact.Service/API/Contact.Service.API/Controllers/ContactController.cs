using System;
using System.Linq;
using System.Threading.Tasks;
using Contact.Service.API.Domain.Entities;
using Contact.Service.API.Infrastructure.Data;
using Contact.Service.API.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Contact.Service.API.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly ContactDbContext _dbContext;
    private readonly KafkaProducerService _kafkaProducer;

    public ContactController(ContactDbContext dbContext, KafkaProducerService kafkaProducer)
    {
        _dbContext = dbContext;
        _kafkaProducer = kafkaProducer;
    }

    public class ContactRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    [HttpPost("messages")]
    public async Task<IActionResult> SubmitMessage([FromBody] ContactRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Name, Email, and Message are required.");
        }

        var contactMessage = new ContactMessage
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Subject = "New Contact from Portfolio", // Default subject
            Message = request.Message,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ContactMessages.Add(contactMessage);
        await _dbContext.SaveChangesAsync();

        // Publish to Kafka
        await _kafkaProducer.PublishAsync(
            topic: "contact-events",
            key: contactMessage.Id.ToString(),
            message: contactMessage
        );

        return Ok(new { success = true, messageId = contactMessage.Id });
    }

    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages()
    {
        var messages = await _dbContext.ContactMessages
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
        return Ok(messages);
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    [HttpPatch("messages/{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto request)
    {
        var message = await _dbContext.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();

        message.Status = request.Status;
        await _dbContext.SaveChangesAsync();

        return Ok(new { success = true, status = message.Status });
    }

    [HttpDelete("messages/{id}")]
    public async Task<IActionResult> DeleteMessage(Guid id)
    {
        var message = await _dbContext.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();

        _dbContext.ContactMessages.Remove(message);
        await _dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
