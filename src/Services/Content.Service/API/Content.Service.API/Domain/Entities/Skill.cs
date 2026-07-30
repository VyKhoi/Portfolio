using System;

namespace Content.Service.API.Domain.Entities;

public class Skill
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string IconSvgKey { get; set; } = string.Empty;
    public int ProficiencyLevel { get; set; }
    public int Order { get; set; }
}
