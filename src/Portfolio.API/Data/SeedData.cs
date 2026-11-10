using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.API.Entities;

namespace Portfolio.API.Data;

public static class SeedData
{
    private const string Bio = "Tôi là lập trình viên với 3 năm kinh nghiệm, chủ yếu làm việc với .NET. Ngoài công việc chính, tôi thích tự làm những sản phẩm nhỏ của riêng mình. Cảm ơn bạn đã ghé qua!";

    private static List<Experience> BuildExperiences() => new()
    {
        new Experience
        {
            Id = Guid.NewGuid(),
            Role = "Software Engineer (.NET)",
            Company = "Masan Group",
            Period = "05/2026 - Hiện tại",
            ProjectName = "",
            Order = 1
        },
        new Experience
        {
            Id = Guid.NewGuid(),
            Role = "Software Engineer (.NET)",
            Company = "Independent Team",
            Period = "2024 - 2026",
            ProjectName = "CRM/POS for Salon Chains",
            Highlights = new List<string>
            {
                "Built the multi-tenant core shared by the POS, web and mobile apps.",
                "Wrote .NET 8 APIs for booking, billing, payroll and reporting with EF Core and Dapper.",
                "Kept tenant data separate across 100+ branches with row-level security and JWT auth.",
                "Integrated CardPointe payments; automated payroll, SMS and commission jobs with Hangfire.",
                "Synced dashboards, kiosks and mobile apps in real time with SignalR."
            },
            TechStack = new List<string> { ".NET 8", "C#", "EF Core", "Dapper", "SignalR", "Hangfire", "MAUI" },
            Order = 3
        },
        new Experience
        {
            Id = Guid.NewGuid(),
            Role = "Backend Developer",
            Company = "AEGONA Co., Ltd",
            Period = "2023 - 2024",
            ProjectName = "Outsourcing Projects (CRM, e-learning)",
            Highlights = new List<string>
            {
                "Worked on the backend of CRM, e-learning and booking systems with ASP.NET Core and SQL Server.",
                "Supported API development and service integration on monolith and microservices systems.",
                "Helped refactor legacy server code and speed up SQL queries."
            },
            TechStack = new List<string> { "ASP.NET Core", "SQL Server", "Microservices" },
            Order = 4
        },
        new Experience
        {
            Id = Guid.NewGuid(),
            Role = "Full-stack Developer",
            Company = "Personal Project",
            Period = "2026 - Hiện tại",
            ProjectName = "ChickenNote",
            Highlights = new List<string>
            {
                "Online notes with no account: open a name, type, and it syncs between phone and PC right away.",
                "Keeps working offline and merges the changes when the connection is back.",
                "Go backend and plain JavaScript frontend, running on my home server."
            },
            TechStack = new List<string> { "Go", "JavaScript", "SSE", "Docker", "Linux" },
            Order = 2
        }
    };

    private static List<AssistantFact> BuildAssistantFacts() => new()
    {
        new() { Key = "name", Label = "Full name", ValueVi = "Đặng Vỹ Khôi", ValueEn = "Đặng Vỹ Khôi (Dang Vy Khoi)", Order = 1 },
        new() { Key = "summary", Label = "Career", ValueVi = "Software Engineer, 3 năm kinh nghiệm, chủ yếu .NET", ValueEn = "Software Engineer, 3 years of experience, mostly .NET", Order = 2 },
        new() { Key = "born", Label = "Born", ValueVi = "2002", ValueEn = "2002", Order = 3 },
        new() { Key = "location", Label = "Current location", ValueVi = "Gò Vấp, TP.HCM", ValueEn = "Gò Vấp, TP.HCM (Go Vap, Ho Chi Minh City)", Order = 4 },
        new() { Key = "education", Label = "Education", ValueVi = "Cử nhân CNTT, Đại học Mở TP.HCM (2020-2024), tốt nghiệp loại Giỏi, 3 học bổng khuyến khích học tập", ValueEn = "Bachelor of IT, Ho Chi Minh City Open University (Đại học Mở TP.HCM), 2020-2024, graduated with Distinction (loại Giỏi), 3 academic scholarships", Order = 5 },
        new() { Key = "email", Label = "Email", ValueVi = "dangvykhoi@gmail.com", ValueEn = "dangvykhoi@gmail.com", Order = 6 },
        new() { Key = "phone", Label = "Phone and Zalo", ValueVi = "0931 314 792", ValueEn = "0931 314 792", Order = 7 },
        new() { Key = "website", Label = "Website", ValueVi = "dangvykhoi.com", ValueEn = "dangvykhoi.com", Order = 8 },
        new() { Key = "sideProjects", Label = "Side projects", ValueVi = "ChickenNote (note.dangvykhoi.com, app ghi chú online) và website này, tự host trên server ở nhà", ValueEn = "ChickenNote (note.dangvykhoi.com, an online note app) and this website, self-hosted on his home server", Order = 9 },
    };

    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        await context.Database.MigrateAsync();

        // 1. Seed or Sync Admin User
        var envAdminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == "admin");

        if (adminUser == null)
        {
            var initialPassword = !string.IsNullOrWhiteSpace(envAdminPassword)
                ? envAdminPassword
                : "Khoi@" + Guid.NewGuid().ToString("N")[..8] + "!";

            context.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(initialPassword),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
        else if (!string.IsNullOrWhiteSpace(envAdminPassword) && !BCrypt.Net.BCrypt.Verify(envAdminPassword, adminUser.PasswordHash))
        {
            // Sync password if user configured a new ADMIN_PASSWORD in environment / secrets
            adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(envAdminPassword);
            await context.SaveChangesAsync();
        }

        // 2. Seed or Upgrade Profile
        var existingProfile = await context.Profiles.FirstOrDefaultAsync();
        if (existingProfile == null)
        {
            context.Profiles.Add(new Profile
            {
                Id = Guid.NewGuid(),
                FullName = "ĐẶNG VỸ KHÔI",
                Title = "Software Engineer | .NET Backend",
                Bio = Bio,
                AvatarKey = "/profile.jpg",
                CvPdfKey = "/cv.pdf",
                GithubLink = "https://github.com/vykhoi",
                LinkedinLink = "https://linkedin.com/in/vykhoi"
            });
        }
        else if (existingProfile.FullName == "DANG VY KHOI")
        {
            existingProfile.FullName = "ĐẶNG VỸ KHÔI";
            existingProfile.Title = "Software Engineer | .NET Backend";
            existingProfile.Bio = Bio;
        }

        // 3. Seed Experiences
        if (!await context.Experiences.AnyAsync())
        {
            context.Experiences.AddRange(BuildExperiences());
        }

        // 4. Seed Skills
        if (!await context.Skills.AnyAsync())
        {
            context.Skills.AddRange(new List<Skill>
            {
                new Skill { Id = Guid.NewGuid(), Name = ".NET 8 / 9", Category = "Backend & Core", ProficiencyLevel = 90, Order = 1 },
                new Skill { Id = Guid.NewGuid(), Name = "C#", Category = "Backend & Core", ProficiencyLevel = 90, Order = 2 },
                new Skill { Id = Guid.NewGuid(), Name = "Concurrency", Category = "Backend & Core", ProficiencyLevel = 80, Order = 3 },
                new Skill { Id = Guid.NewGuid(), Name = "REST APIs", Category = "Backend & Core", ProficiencyLevel = 90, Order = 4 },
                new Skill { Id = Guid.NewGuid(), Name = "SignalR", Category = "Backend & Core", ProficiencyLevel = 85, Order = 5 },
                new Skill { Id = Guid.NewGuid(), Name = "Multi-tenant & RLS", Category = "Architecture & Sec", ProficiencyLevel = 80, Order = 6 },
                new Skill { Id = Guid.NewGuid(), Name = "Clean Architecture", Category = "Architecture & Sec", ProficiencyLevel = 85, Order = 7 },
                new Skill { Id = Guid.NewGuid(), Name = "SQL Server & PostgreSQL", Category = "Databases", ProficiencyLevel = 85, Order = 8 },
                new Skill { Id = Guid.NewGuid(), Name = "EF Core & Dapper", Category = "Databases", ProficiencyLevel = 90, Order = 9 },
                new Skill { Id = Guid.NewGuid(), Name = "React & TypeScript", Category = "Frontend", ProficiencyLevel = 75, Order = 10 },
                new Skill { Id = Guid.NewGuid(), Name = "Docker & Linux", Category = "DevOps & Cloud", ProficiencyLevel = 80, Order = 11 }
            });
        }

        // 5. Seed Sigma Cat facts (the admin console owns them afterwards)
        if (!await context.AssistantFacts.AnyAsync())
        {
            context.AssistantFacts.AddRange(BuildAssistantFacts());
        }

        // 6. Projects and the Now section: first fill from the files the site shipped with, then the admin console owns them
        if (!await context.Projects.AnyAsync())
        {
            context.Projects.AddRange(SeedContent.Projects());
        }
        if (!await context.NowItems.AnyAsync())
        {
            context.NowItems.AddRange(SeedContent.NowItems());
        }

        await context.SaveChangesAsync();
    }
}
