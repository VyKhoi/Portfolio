using System;
using System.Collections.Generic;

namespace Content.Service.API.Domain.Entities;

public class Experience
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    
    public List<string> Highlights { get; set; } = new();
    
    public List<string> TechStack { get; set; } = new();
    
    public int Order { get; set; }
}
