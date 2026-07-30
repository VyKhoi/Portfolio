using System;

namespace Content.Service.API.Domain.Entities;

public class Project
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string DescriptionMdx { get; set; } = string.Empty;
    public string CoverImageKey { get; set; } = string.Empty;
    public string TechStack { get; set; } = "[]"; // JSON
    public string? DemoUrl { get; set; }
    public string? GithubUrl { get; set; }
    public int Order { get; set; }
    public bool IsFeatured { get; set; }
    public string Status { get; set; } = "Published";
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
