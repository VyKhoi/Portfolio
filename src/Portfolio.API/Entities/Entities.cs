using System;
using System.Collections.Generic;

namespace Portfolio.API.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Profile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string BioEn { get; set; } = string.Empty;
    public string AvatarKey { get; set; } = string.Empty;
    public string CvPdfKey { get; set; } = string.Empty;
    public string GithubLink { get; set; } = string.Empty;
    public string LinkedinLink { get; set; } = string.Empty;
}

public class Skill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string IconSvgKey { get; set; } = string.Empty;
    public int ProficiencyLevel { get; set; }
    public int Order { get; set; }
}

public class Experience
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Role { get; set; } = string.Empty;
    public string RoleEn { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string CompanyEn { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string PeriodEn { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectNameEn { get; set; } = string.Empty;
    public List<string> Highlights { get; set; } = new();
    public List<string> HighlightsEn { get; set; } = new();
    public List<string> TechStack { get; set; } = new();
    public int Order { get; set; }
}

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string DescriptionMdx { get; set; } = string.Empty;
    public string CoverImageKey { get; set; } = string.Empty;
    public string TechStack { get; set; } = "[]"; // JSON string
    public string? DemoUrl { get; set; }
    public string? GithubUrl { get; set; }
    public int Order { get; set; }
    public bool IsFeatured { get; set; }
    public string Status { get; set; } = "Published";
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ContactMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = "New Contact from Portfolio";
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Read, Replied
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ChatSession
{
    public int Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
}

public class ChatMessage
{
    public int Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // user | assistant
    public string Content { get; set; } = string.Empty;
    public string? Source { get; set; } // quick | model, assistant messages only
    public int? FirstTokenMs { get; set; }
    public int? TotalMs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>What Sigma Cat knows that the public site does not hold, editable in the admin console.</summary>
public class AssistantFact
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string ValueVi { get; set; } = string.Empty;
    public string ValueEn { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Enabled { get; set; } = true;
}
