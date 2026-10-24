using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Portfolio.API.Data;
using Portfolio.API.Entities;

namespace Portfolio.API.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController : ControllerBase
{
    private readonly PortfolioDbContext _db;
    private readonly IMemoryCache _cache;

    private const string ProfileCacheKey = "content:profile";
    private const string SkillsCacheKey = "content:skills";
    private const string ExperiencesCacheKey = "content:experiences";
    private const string ProjectsCacheKey = "content:projects";

    public ContentController(PortfolioDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    // ─── PROFILE ─────────────────────────────────────────────
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        if (!_cache.TryGetValue(ProfileCacheKey, out Profile? profile))
        {
            profile = await _db.Profiles.FirstOrDefaultAsync();
            if (profile != null)
            {
                _cache.Set(ProfileCacheKey, profile, TimeSpan.FromMinutes(30));
            }
        }

        if (profile == null) return NotFound(new { error = "Profile not found." });
        return Ok(profile);
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] Profile updatedProfile)
    {
        var profile = await _db.Profiles.FirstOrDefaultAsync();
        if (profile == null)
        {
            updatedProfile.Id = Guid.NewGuid();
            _db.Profiles.Add(updatedProfile);
            profile = updatedProfile;
        }
        else
        {
            profile.FullName = updatedProfile.FullName;
            profile.Title = updatedProfile.Title;
            profile.Bio = updatedProfile.Bio;
            profile.AvatarKey = updatedProfile.AvatarKey;
            profile.CvPdfKey = updatedProfile.CvPdfKey;
            profile.GithubLink = updatedProfile.GithubLink;
            profile.LinkedinLink = updatedProfile.LinkedinLink;
        }

        await _db.SaveChangesAsync();
        _cache.Remove(ProfileCacheKey);
        _cache.Set(ProfileCacheKey, profile, TimeSpan.FromMinutes(30));

        return Ok(profile);
    }

    // ─── SKILLS ──────────────────────────────────────────────
    [HttpGet("skills")]
    public async Task<IActionResult> GetSkills()
    {
        if (!_cache.TryGetValue(SkillsCacheKey, out List<Skill>? skills))
        {
            skills = await _db.Skills.OrderBy(s => s.Order).ToListAsync();
            _cache.Set(SkillsCacheKey, skills, TimeSpan.FromMinutes(30));
        }

        return Ok(skills ?? new List<Skill>());
    }

    [HttpPost("skills")]
    [Authorize]
    public async Task<IActionResult> AddSkill([FromBody] Skill skill)
    {
        if (skill.Id == Guid.Empty) skill.Id = Guid.NewGuid();
        _db.Skills.Add(skill);
        await _db.SaveChangesAsync();
        _cache.Remove(SkillsCacheKey);
        return Ok(skill);
    }

    [HttpPut("skills/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateSkill(Guid id, [FromBody] Skill updatedSkill)
    {
        var skill = await _db.Skills.FindAsync(id);
        if (skill == null) return NotFound();

        skill.Name = updatedSkill.Name;
        skill.Category = updatedSkill.Category;
        skill.IconSvgKey = updatedSkill.IconSvgKey;
        skill.ProficiencyLevel = updatedSkill.ProficiencyLevel;
        skill.Order = updatedSkill.Order;

        await _db.SaveChangesAsync();
        _cache.Remove(SkillsCacheKey);
        return Ok(skill);
    }

    [HttpDelete("skills/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteSkill(Guid id)
    {
        var skill = await _db.Skills.FindAsync(id);
        if (skill == null) return NotFound();

        _db.Skills.Remove(skill);
        await _db.SaveChangesAsync();
        _cache.Remove(SkillsCacheKey);
        return Ok(new { success = true });
    }

    // ─── EXPERIENCES ─────────────────────────────────────────
    [HttpGet("experience")]
    public async Task<IActionResult> GetExperiences()
    {
        if (!_cache.TryGetValue(ExperiencesCacheKey, out List<Experience>? experiences))
        {
            experiences = await _db.Experiences.OrderBy(e => e.Order).ToListAsync();
            _cache.Set(ExperiencesCacheKey, experiences, TimeSpan.FromMinutes(30));
        }

        return Ok(experiences ?? new List<Experience>());
    }

    [HttpPost("experience")]
    [Authorize]
    public async Task<IActionResult> AddExperience([FromBody] Experience exp)
    {
        if (exp.Id == Guid.Empty) exp.Id = Guid.NewGuid();
        _db.Experiences.Add(exp);
        await _db.SaveChangesAsync();
        _cache.Remove(ExperiencesCacheKey);
        return Ok(exp);
    }

    [HttpPut("experience/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateExperience(Guid id, [FromBody] Experience updatedExp)
    {
        var exp = await _db.Experiences.FindAsync(id);
        if (exp == null) return NotFound();

        exp.Role = updatedExp.Role;
        exp.Company = updatedExp.Company;
        exp.Period = updatedExp.Period;
        exp.ProjectName = updatedExp.ProjectName;
        exp.Highlights = updatedExp.Highlights;
        exp.TechStack = updatedExp.TechStack;
        exp.Order = updatedExp.Order;

        await _db.SaveChangesAsync();
        _cache.Remove(ExperiencesCacheKey);
        return Ok(exp);
    }

    [HttpDelete("experience/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteExperience(Guid id)
    {
        var exp = await _db.Experiences.FindAsync(id);
        if (exp == null) return NotFound();

        _db.Experiences.Remove(exp);
        await _db.SaveChangesAsync();
        _cache.Remove(ExperiencesCacheKey);
        return Ok(new { success = true });
    }

    // ─── PROJECTS ────────────────────────────────────────────
    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects()
    {
        if (!_cache.TryGetValue(ProjectsCacheKey, out List<Project>? projects))
        {
            projects = await _db.Projects.OrderBy(p => p.Order).ToListAsync();
            _cache.Set(ProjectsCacheKey, projects, TimeSpan.FromMinutes(30));
        }

        return Ok(projects ?? new List<Project>());
    }

    [HttpPost("projects")]
    [Authorize]
    public async Task<IActionResult> AddProject([FromBody] Project project)
    {
        if (project.Id == Guid.Empty) project.Id = Guid.NewGuid();
        if (string.IsNullOrWhiteSpace(project.Slug))
        {
            project.Slug = project.Title.ToLower().Replace(" ", "-") + "-" + Guid.NewGuid().ToString().Substring(0, 4);
        }

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        _cache.Remove(ProjectsCacheKey);
        return Ok(project);
    }

    [HttpPut("projects/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] Project updatedProject)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project == null) return NotFound();

        project.Title = updatedProject.Title;
        project.Slug = updatedProject.Slug;
        project.Summary = updatedProject.Summary;
        project.DescriptionMdx = updatedProject.DescriptionMdx;
        project.CoverImageKey = updatedProject.CoverImageKey;
        project.TechStack = updatedProject.TechStack;
        project.DemoUrl = updatedProject.DemoUrl;
        project.GithubUrl = updatedProject.GithubUrl;
        project.Order = updatedProject.Order;
        project.IsFeatured = updatedProject.IsFeatured;
        project.Status = updatedProject.Status;

        await _db.SaveChangesAsync();
        _cache.Remove(ProjectsCacheKey);
        return Ok(project);
    }

    [HttpDelete("projects/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project == null) return NotFound();

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();
        _cache.Remove(ProjectsCacheKey);
        return Ok(new { success = true });
    }
}
