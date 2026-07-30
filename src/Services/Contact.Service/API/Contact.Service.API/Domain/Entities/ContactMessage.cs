using System;

namespace Contact.Service.API.Domain.Entities;

public class ContactMessage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Processed, Spam
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
