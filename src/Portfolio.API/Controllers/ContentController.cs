using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Portfolio.API.Data;
using Portfolio.API.Entities;

namespace Portfolio.API.Controllers;

/// <summary>
/// Everything the public site shows. The site is built from these endpoints (scripts/export-content.py),
/// so the database is the only place content lives; the JSON files in the repo are a development fallback.
/// GETs are public, writes need the admin token and pass <see cref="ContentRules"/>.
/// </summary>
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
    private const string NowCacheKey = "content:now";
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(30);

    public ContentController(PortfolioDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    private static BadRequestObjectResult Invalid(string error) => new(new { error });

    private async Task<T> CachedAsync<T>(string key, Func<Task<T>> load)
    {
        if (_cache.TryGetValue(key, out T? value) && value != null) return value;
        value = await load();
        _cache.Set(key, value, CacheFor);
        return value;
    }

    // ─── PROFILE ─────────────────────────────────────────────
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await CachedAsync(ProfileCacheKey, () => _db.Profiles.AsNoTracking().FirstOrDefaultAsync());
        return profile == null ? NotFound(new { error = "Profile not found." }) : Ok(profile);
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] ProfileRequest request)
    {
        if (request.Validate() is { } error) return Invalid(error);

        var profile = await _db.Profiles.FirstOrDefaultAsync();
        if (profile == null)
        {
            // Photo and CV are files in the repo (public/profile.jpg, public/cv.pdf), not editable here
            profile = new Profile { AvatarKey = "/profile.jpg", CvPdfKey = "/cv.pdf" };
            _db.Profiles.Add(profile);
        }

        profile.FullName = request.FullName.Trim();
        profile.Title = request.Title.Trim();
        profile.TitleEn = request.TitleEn?.Trim() ?? "";
        profile.Bio = request.Bio.Trim();
        profile.BioEn = request.BioEn?.Trim() ?? "";
        profile.GithubLink = request.GithubLink?.Trim() ?? "";
        profile.LinkedinLink = request.LinkedinLink?.Trim() ?? "";

        await _db.SaveChangesAsync();
        _cache.Remove(ProfileCacheKey);
        return Ok(profile);
    }

    // ─── SKILLS ──────────────────────────────────────────────
    [HttpGet("skills")]
    public async Task<IActionResult> GetSkills()
        => Ok(await CachedAsync(SkillsCacheKey, () => _db.Skills.AsNoTracking().OrderBy(s => s.Order).ToListAsync()));

    [HttpPost("skills")]
    [Authorize]
    public async Task<IActionResult> AddSkill([FromBody] SkillRequest request)
    {
        if (request.Validate() is { } error) return Invalid(error);

        var last = await _db.Skills.Select(s => (int?)s.Order).MaxAsync() ?? 0;
        var skill = new Skill { Name = request.Name.Trim(), Category = request.Category, Order = last + 1 };
        _db.Skills.Add(skill);
        await _db.SaveChangesAsync();
        _cache.Remove(SkillsCacheKey);
        return Ok(skill);
    }

    [HttpPut("skills/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateSkill(Guid id, [FromBody] SkillRequest request)
    {
        if (request.Validate() is { } error) return Invalid(error);
        var skill = await _db.Skills.FindAsync(id);
        if (skill == null) return NotFound();

        skill.Name = request.Name.Trim();
        skill.Category = request.Category;
        await _db.SaveChangesAsync();
        _cache.Remove(SkillsCacheKey);
        return Ok(skill);
    }

    [HttpDelete("skills/{id:guid}")]
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

    [HttpPut("skills/order")]
    [Authorize]
    public async Task<IActionResult> OrderSkills([FromBody] OrderRequest request)
    {
        var skills = await _db.Skills.ToListAsync();
        if (!SameIds(request.Ids, skills.Select(s => s.Id))) return Invalid("Danh sách không khớp, tải lại trang rồi thử lại.");
        foreach (var skill in skills) skill.Order = request.Ids.IndexOf(skill.Id) + 1;
        await _db.SaveChangesAsync();
        _cache.Remove(SkillsCacheKey);
        return Ok(new { success = true });
    }

    // ─── EXPERIENCES ─────────────────────────────────────────
    [HttpGet("experience")]
    [HttpGet("experiences")]
    public async Task<IActionResult> GetExperiences()
        => Ok(await CachedAsync(ExperiencesCacheKey, () => _db.Experiences.AsNoTracking().OrderBy(e => e.Order).ToListAsync()));

    [HttpPost("experiences")]
    [Authorize]
    public async Task<IActionResult> AddExperience([FromBody] ExperienceRequest request)
    {
        if (request.Validate() is { } error) return Invalid(error);

        // New jobs go to the top of the timeline
        foreach (var other in await _db.Experiences.ToListAsync()) other.Order++;
        var exp = new Experience { Order = 1 };
        Apply(exp, request);
        _db.Experiences.Add(exp);
        await _db.SaveChangesAsync();
        _cache.Remove(ExperiencesCacheKey);
        return Ok(exp);
    }

    [HttpPut("experiences/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateExperience(Guid id, [FromBody] ExperienceRequest request)
    {
        if (request.Validate() is { } error) return Invalid(error);
        var exp = await _db.Experiences.FindAsync(id);
        if (exp == null) return NotFound();

        Apply(exp, request);
        await _db.SaveChangesAsync();
        _cache.Remove(ExperiencesCacheKey);
        return Ok(exp);
    }

    [HttpDelete("experiences/{id:guid}")]
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

    [HttpPut("experiences/order")]
    [Authorize]
    public async Task<IActionResult> OrderExperiences([FromBody] OrderRequest request)
    {
        var experiences = await _db.Experiences.ToListAsync();
        if (!SameIds(request.Ids, experiences.Select(e => e.Id))) return Invalid("Danh sách không khớp, tải lại trang rồi thử lại.");
        foreach (var exp in experiences) exp.Order = request.Ids.IndexOf(exp.Id) + 1;
        await _db.SaveChangesAsync();
        _cache.Remove(ExperiencesCacheKey);
        return Ok(new { success = true });
    }

    private static void Apply(Experience exp, ExperienceRequest request)
    {
        exp.Role = request.Role.Trim();
        exp.RoleEn = request.RoleEn?.Trim() ?? "";
        exp.Company = request.Company.Trim();
        exp.CompanyEn = request.CompanyEn?.Trim() ?? "";
        exp.Period = request.Period.Trim();
        exp.PeriodEn = request.PeriodEn?.Trim() ?? "";
        exp.ProjectName = request.ProjectName?.Trim() ?? "";
        exp.ProjectNameEn = request.ProjectNameEn?.Trim() ?? "";
        exp.Highlights = ContentRules.Clean(request.Highlights);
        exp.HighlightsEn = ContentRules.Clean(request.HighlightsEn);
        exp.TechStack = ContentRules.Clean(request.TechStack);
    }

    private static bool SameIds(List<Guid>? ids, IEnumerable<Guid> existing)
        => ids != null && ids.Count == ids.Distinct().Count() && ids.ToHashSet().SetEquals(existing);

    // ─── PROJECTS ────────────────────────────────────────────
    /// <summary>Same shape as content/projects.json: <c>[{ slug, year, url, image, ... copy: { en, vi } }]</c>.</summary>
    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects()
    {
        var json = await CachedAsync(ProjectsCacheKey, async () =>
        {
            var rows = await _db.Projects.AsNoTracking().OrderBy(p => p.Order).ToListAsync();
            var list = new JsonArray();
            foreach (var row in rows)
            {
                var item = new JsonObject { ["slug"] = row.Slug };
                foreach (var (key, value) in JsonNode.Parse(row.Content)!.AsObject()) item[key] = value?.DeepClone();
                list.Add(item);
            }
            return list.ToJsonString();
        });
        return Content(json, "application/json; charset=utf-8");
    }

    /// <summary>Edits the words, links and images of an existing project. New projects and slugs go through the repo (nginx needs them).</summary>
    [HttpPut("projects/{slug}")]
    [Authorize]
    public async Task<IActionResult> UpdateProject(string slug, [FromBody] ProjectRequest request)
    {
        if (request.Validate() is { } error) return Invalid(error);
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Slug == slug);
        if (project == null) return NotFound(new { error = "Không có dự án này." });

        project.Content = JsonSerializer.Serialize(request.Cleaned(), ContentRules.Json);
        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        _cache.Remove(ProjectsCacheKey);
        return Ok(new { success = true });
    }

    // ─── NOW ─────────────────────────────────────────────────
    /// <summary><c>{ updated: "yyyy-MM-dd", items: [{ label, labelEn, text, textEn }] }</c>, same as portfolio.json "now".</summary>
    [HttpGet("now")]
    public async Task<IActionResult> GetNow()
        => Ok(await CachedAsync(NowCacheKey, async () =>
        {
            var items = await _db.NowItems.AsNoTracking().OrderBy(n => n.Order).ToListAsync();
            var updated = items.Count == 0 ? DateTime.UtcNow : items.Max(n => n.UpdatedAt);
            return new
            {
                // Vietnam date: an edit at 06:00 on the 11th is "the 11th", not the UTC 10th
                updated = updated.AddHours(7).ToString("yyyy-MM-dd"),
                items = items.Select(n => new { label = n.Label, labelEn = n.LabelEn, text = n.Text, textEn = n.TextEn }),
            } as object;
        }));

    [HttpPut("now")]
    [Authorize]
    public async Task<IActionResult> UpdateNow([FromBody] NowRequest request)
    {
        if (request.Validate() is { } error) return Invalid(error);

        _db.NowItems.RemoveRange(await _db.NowItems.ToListAsync());
        var now = DateTime.UtcNow;
        _db.NowItems.AddRange(request.Items.Select((i, index) => new NowItem
        {
            Label = i.Label.Trim(),
            LabelEn = i.LabelEn?.Trim() ?? "",
            Text = i.Text.Trim(),
            TextEn = i.TextEn?.Trim() ?? "",
            Order = index + 1,
            UpdatedAt = now,
        }));
        await _db.SaveChangesAsync();
        _cache.Remove(NowCacheKey);
        return Ok(new { success = true });
    }
}
