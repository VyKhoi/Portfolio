using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Content.Service.API.Domain.Entities;
using Content.Service.API.Infrastructure.Data;
using Content.Service.API.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Content.Service.API.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController : ControllerBase
{
    private readonly ContentDbContext _dbContext;
    private readonly RedisCacheService _cache;

    public ContentController(ContentDbContext dbContext, RedisCacheService cache)
    {
        _dbContext = dbContext;
        _cache = cache;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var cacheKey = "content:profile";
        var profile = await _cache.GetAsync<Profile>(cacheKey);
        
        if (profile == null)
        {
            profile = await _dbContext.Profiles.FirstOrDefaultAsync();
            if (profile != null)
            {
                await _cache.SetAsync(cacheKey, profile);
            }
        }

        if (profile == null) return NotFound();
        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] Profile updatedProfile)
    {
        var profile = await _dbContext.Profiles.FirstOrDefaultAsync();
        if (profile == null)
        {
            // If no profile exists, create it
            updatedProfile.Id = Guid.NewGuid();
            _dbContext.Profiles.Add(updatedProfile);
            profile = updatedProfile;
        }
        else
        {
            // Update existing profile
            profile.FullName = updatedProfile.FullName;
            profile.Title = updatedProfile.Title;
            profile.Bio = updatedProfile.Bio;
            profile.AvatarKey = updatedProfile.AvatarKey;
            profile.CvPdfKey = updatedProfile.CvPdfKey;
            profile.GithubLink = updatedProfile.GithubLink;
            profile.LinkedinLink = updatedProfile.LinkedinLink;
        }

        await _dbContext.SaveChangesAsync();
        
        // Invalidate cache
        await _cache.RemoveAsync("content:profile");
        // Update cache with new data
        await _cache.SetAsync("content:profile", profile);

        return Ok(profile);
    }

    [HttpGet("experience")]
    public async Task<IActionResult> GetExperiences()
    {
        var cacheKey = "content:experiences";
        var experiences = await _cache.GetAsync<List<Experience>>(cacheKey);

        if (experiences == null)
        {
            experiences = await _dbContext.Experiences
                .OrderBy(e => e.Order)
                .ToListAsync();
                
            if (experiences.Any())
            {
                await _cache.SetAsync(cacheKey, experiences);
            }
        }

        return Ok(experiences);
    }

    [HttpGet("skills")]
    public async Task<IActionResult> GetSkills()
    {
        var cacheKey = "content:skills";
        var skills = await _cache.GetAsync<List<Skill>>(cacheKey);

        if (skills == null)
        {
            skills = await _dbContext.Skills
                .OrderBy(s => s.Order)
                .ToListAsync();
                
            if (skills.Any())
            {
                await _cache.SetAsync(cacheKey, skills);
            }
        }

        return Ok(skills);
    }

    [HttpPost("skills")]
    public async Task<IActionResult> AddSkill([FromBody] Skill skill)
    {
        if (skill.Id == Guid.Empty) skill.Id = Guid.NewGuid();
        _dbContext.Skills.Add(skill);
        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:skills");
        return Ok(skill);
    }

    [HttpPut("skills/{id}")]
    public async Task<IActionResult> UpdateSkill(Guid id, [FromBody] Skill updatedSkill)
    {
        var skill = await _dbContext.Skills.FindAsync(id);
        if (skill == null) return NotFound();

        skill.Name = updatedSkill.Name;
        skill.Category = updatedSkill.Category;
        skill.IconSvgKey = updatedSkill.IconSvgKey;
        skill.ProficiencyLevel = updatedSkill.ProficiencyLevel;
        skill.Order = updatedSkill.Order;

        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:skills");
        return Ok(skill);
    }

    [HttpDelete("skills/{id}")]
    public async Task<IActionResult> DeleteSkill(Guid id)
    {
        var skill = await _dbContext.Skills.FindAsync(id);
        if (skill == null) return NotFound();

        _dbContext.Skills.Remove(skill);
        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:skills");
        return Ok(new { success = true });
    }

    [HttpPost("experience")]
    public async Task<IActionResult> AddExperience([FromBody] Experience exp)
    {
        if (exp.Id == Guid.Empty) exp.Id = Guid.NewGuid();
        _dbContext.Experiences.Add(exp);
        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:experiences");
        return Ok(exp);
    }

    [HttpPut("experience/{id}")]
    public async Task<IActionResult> UpdateExperience(Guid id, [FromBody] Experience updatedExp)
    {
        var exp = await _dbContext.Experiences.FindAsync(id);
        if (exp == null) return NotFound();

        exp.Role = updatedExp.Role;
        exp.Company = updatedExp.Company;
        exp.Period = updatedExp.Period;
        exp.ProjectName = updatedExp.ProjectName;
        exp.Highlights = updatedExp.Highlights;
        exp.TechStack = updatedExp.TechStack;
        exp.Order = updatedExp.Order;

        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:experiences");
        return Ok(exp);
    }

    [HttpDelete("experience/{id}")]
    public async Task<IActionResult> DeleteExperience(Guid id)
    {
        var exp = await _dbContext.Experiences.FindAsync(id);
        if (exp == null) return NotFound();

        _dbContext.Experiences.Remove(exp);
        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:experiences");
        return Ok(new { success = true });
    }

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects()
    {
        var cacheKey = "content:projects";
        var projects = await _cache.GetAsync<List<Project>>(cacheKey);

        if (projects == null)
        {
            projects = await _dbContext.Projects
                .OrderBy(p => p.Order)
                .ToListAsync();
                
            if (projects.Any())
            {
                await _cache.SetAsync(cacheKey, projects);
            }
        }

        return Ok(projects);
    }

    [HttpPost("projects")]
    public async Task<IActionResult> AddProject([FromBody] Project project)
    {
        if (project.Id == Guid.Empty) project.Id = Guid.NewGuid();
        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:projects");
        return Ok(project);
    }

    [HttpPut("projects/{id}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] Project updatedProject)
    {
        var proj = await _dbContext.Projects.FindAsync(id);
        if (proj == null) return NotFound();

        proj.Title = updatedProject.Title;
        proj.Slug = updatedProject.Slug;
        proj.Summary = updatedProject.Summary;
        proj.DescriptionMdx = updatedProject.DescriptionMdx;
        proj.CoverImageKey = updatedProject.CoverImageKey;
        proj.TechStack = updatedProject.TechStack;
        proj.DemoUrl = updatedProject.DemoUrl;
        proj.GithubUrl = updatedProject.GithubUrl;
        proj.Order = updatedProject.Order;
        proj.IsFeatured = updatedProject.IsFeatured;
        proj.Status = updatedProject.Status;
        
        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:projects");
        return Ok(proj);
    }

    [HttpDelete("projects/{id}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var proj = await _dbContext.Projects.FindAsync(id);
        if (proj == null) return NotFound();

        _dbContext.Projects.Remove(proj);
        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync("content:projects");
        return Ok(new { success = true });
    }
}
