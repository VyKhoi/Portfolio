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

/// <summary>
/// One of Khoi's own products, shown on the home page and at /projects/&lt;slug&gt;. <see cref="Content"/> holds the
/// whole page as JSON in the shape of src/Web/frontend/src/content/projects.json (year, links, images, vi/en copy).
/// The slug is part of the URL (nginx + Google), so the admin console cannot change it.
/// </summary>
public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public int Order { get; set; }
    public string Content { get; set; } = "{}";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>One line of the "Now" section on the home page.</summary>
public class NowItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Label { get; set; } = string.Empty;
    public string LabelEn { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string TextEn { get; set; } = string.Empty;
    public int Order { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
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
    /// <summary>When the visitor ticked the privacy consent box (Personal Data Protection Law 91/2025). Null for messages sent before the box existed.</summary>
    public DateTime? ConsentedAt { get; set; }
}

public class ChatSession
{
    public int Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    /// <summary>Started from "Ask a test question" in the admin console: no quota, left out of the stats.</summary>
    public bool IsTest { get; set; }
}

public class ChatMessage
{
    public int Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // user | assistant
    public string Content { get; set; } = string.Empty;
    public string? Source { get; set; } // model, assistant messages only
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
