using System;

namespace Content.Service.API.Domain.Entities;

public class Profile
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string AvatarKey { get; set; } = string.Empty;
    public string CvPdfKey { get; set; } = string.Empty;
    public string GithubLink { get; set; } = string.Empty;
    public string LinkedinLink { get; set; } = string.Empty;
}
