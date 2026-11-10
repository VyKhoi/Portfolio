using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Portfolio.API.Controllers;
using Portfolio.API.Data;
using Portfolio.API.Entities;
using Xunit;

namespace Portfolio.API.Tests;

public class ContentControllerTests
{
    private static (ContentController Controller, PortfolioDbContext Db) Create()
    {
        var db = new PortfolioDbContext(new DbContextOptionsBuilder<PortfolioDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        return (new ContentController(db, new MemoryCache(new MemoryCacheOptions())), db);
    }

    private static string? Error(IActionResult result)
        => result is BadRequestObjectResult bad ? JsonSerializer.Serialize(bad.Value) : null;

    [Fact]
    public async Task Profile_rejects_links_that_are_not_https()
    {
        var (controller, db) = Create();

        var result = await controller.UpdateProfile(new ProfileRequest("Khôi", "Dev", null, "Bio", null, "javascript:alert(1)", null));

        Assert.Contains("https", Error(result));
        Assert.Empty(db.Profiles);
    }

    [Fact]
    public async Task Profile_keeps_photo_and_cv_as_repo_files()
    {
        var (controller, db) = Create();

        await controller.UpdateProfile(new ProfileRequest(" Khôi ", "Dev", "Dev", "Bio", "Bio", "https://github.com/vykhoi", ""));

        var profile = Assert.Single(db.Profiles);
        Assert.Equal("Khôi", profile.FullName);
        Assert.Equal("/cv.pdf", profile.CvPdfKey);
        Assert.Equal("/profile.jpg", profile.AvatarKey);
    }

    [Fact]
    public async Task Skills_only_go_into_groups_the_site_can_title()
    {
        var (controller, db) = Create();

        Assert.NotNull(Error(await controller.AddSkill(new SkillRequest("Go", "Random group"))));
        Assert.Null(Error(await controller.AddSkill(new SkillRequest("Go", "Backend & Core"))));
        Assert.Null(Error(await controller.AddSkill(new SkillRequest("Rust", "Backend & Core"))));

        Assert.Equal(new[] { 1, 2 }, db.Skills.OrderBy(s => s.Order).Select(s => s.Order));
    }

    [Fact]
    public async Task Reordering_needs_exactly_the_existing_items()
    {
        var (controller, db) = Create();
        var a = new Experience { Role = "A", Company = "A", Period = "1", Order = 1 };
        var b = new Experience { Role = "B", Company = "B", Period = "2", Order = 2 };
        db.Experiences.AddRange(a, b);
        await db.SaveChangesAsync();

        Assert.NotNull(Error(await controller.OrderExperiences(new OrderRequest([a.Id]))));
        Assert.NotNull(Error(await controller.OrderExperiences(new OrderRequest([a.Id, a.Id]))));
        Assert.Null(Error(await controller.OrderExperiences(new OrderRequest([b.Id, a.Id]))));

        Assert.Equal(new[] { "B", "A" }, db.Experiences.OrderBy(e => e.Order).Select(e => e.Role));
    }

    [Fact]
    public async Task New_experience_goes_to_the_top_and_drops_empty_lines()
    {
        var (controller, db) = Create();
        db.Experiences.Add(new Experience { Role = "Old", Company = "X", Period = "1", Order = 1 });
        await db.SaveChangesAsync();

        await controller.AddExperience(new ExperienceRequest("New", null, "Y", null, "2026", null, null, null, ["one", "  ", "two"], null, null));

        var ordered = db.Experiences.OrderBy(e => e.Order).ToList();
        Assert.Equal("New", ordered[0].Role);
        Assert.Equal(new[] { "one", "two" }, ordered[0].Highlights);
    }

    [Fact]
    public async Task Seeded_projects_round_trip_through_the_api_unchanged()
    {
        var (controller, db) = Create();
        db.Projects.AddRange(SeedContent.Projects());
        await db.SaveChangesAsync();

        var json = Assert.IsType<ContentResult>(await controller.GetProjects()).Content!;
        var projects = JsonSerializer.Deserialize<List<JsonElement>>(json)!;
        Assert.Equal(new[] { "chickennote", "dangvykhoi-com" }, projects.Select(p => p.GetProperty("slug").GetString()));

        // Saving what the API returned is accepted as is
        var first = projects[0];
        var request = first.Deserialize<ProjectRequest>(ContentRules.Json)!;
        Assert.Null(request.Validate());
        Assert.Null(Error(await controller.UpdateProject("chickennote", request)));
        Assert.Equal("ChickenNote", JsonDocument.Parse(db.Projects.Single(p => p.Slug == "chickennote").Content)
            .RootElement.GetProperty("copy").GetProperty("en").GetProperty("name").GetString());
    }

    [Fact]
    public async Task Projects_refuse_outside_images_and_empty_sections()
    {
        var (controller, db) = Create();
        db.Projects.AddRange(SeedContent.Projects());
        await db.SaveChangesAsync();
        var json = Assert.IsType<ContentResult>(await controller.GetProjects()).Content!;
        var request = JsonSerializer.Deserialize<List<JsonElement>>(json)![0].Deserialize<ProjectRequest>(ContentRules.Json)!;

        var badImage = request with { Image = new LangPair("https://evil.example/x.webp", request.Image.Vi) };
        Assert.Contains("/projects/", Error(await controller.UpdateProject("chickennote", badImage)));

        var vi = request.Copy["vi"];
        var emptySection = request with
        {
            Copy = new Dictionary<string, ProjectCopy> { ["en"] = request.Copy["en"], ["vi"] = vi with { Sections = [new ProjectSection("Trống", " ", [])] } },
        };
        Assert.NotNull(Error(await controller.UpdateProject("chickennote", emptySection)));

        Assert.IsType<NotFoundObjectResult>(await controller.UpdateProject("nope", request));
    }

    [Fact]
    public async Task Now_is_replaced_whole_and_dated_today()
    {
        var (controller, db) = Create();
        db.NowItems.AddRange(SeedContent.NowItems());
        await db.SaveChangesAsync();
        Assert.Equal(4, db.NowItems.Count());

        Assert.NotNull(Error(await controller.UpdateNow(new NowRequest([]))));
        Assert.Null(Error(await controller.UpdateNow(new NowRequest([new NowItemRequest("Việc", "Work", "Làm .NET", "Doing .NET")]))));

        var item = Assert.Single(db.NowItems);
        Assert.Equal("Work", item.LabelEn);
        Assert.Equal(DateTime.UtcNow.Date, item.UpdatedAt.Date);
    }
}
