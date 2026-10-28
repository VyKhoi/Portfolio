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

        // 2. Seed Profile
        if (!await context.Profiles.AnyAsync())
        {
            context.Profiles.Add(new Profile
            {
                Id = Guid.NewGuid(),
                FullName = "DANG VY KHOI",
                Title = "Software Engineer | .NET Core",
                Bio = "Kỹ sư phần mềm với hơn 2 năm kinh nghiệm xây dựng các hệ thống SaaS, tập trung vào quy trình nghiệp vụ (business workflows) và tính ổn định của hệ thống.",
                AvatarKey = "/profile.jpg",
                CvPdfKey = "/cv.pdf",
                GithubLink = "https://github.com/vykhoi",
                LinkedinLink = "https://linkedin.com/in/vykhoi"
            });
        }

        // 3. Seed Experiences
        if (!await context.Experiences.AnyAsync())
        {
            context.Experiences.AddRange(new List<Experience>
            {
                new Experience
                {
                    Id = Guid.NewGuid(),
                    Role = "Software Engineer (.NET)",
                    Company = "SaaS Product Development (Independent Team)",
                    Period = "2024 - Present",
                    ProjectName = "Enterprise SaaS CRM/POS Ecosystem",
                    Highlights = new List<string>
                    {
                        "Built a multi-tenant POS/Web/Mobile core, enabling scalable hybrid deployment from shared infrastructure.",
                        "Developed high-performance .NET 8 APIs handling complex business logic, reporting, and high-volume transactions using Parallelism, Caching, EF Core, LINQ, and Dapper.",
                        "Secured 100+ branches using RLS and JWT auth in a multi-tenant architecture.",
                        "Integrated CardPointe; automated Payroll, SMS, and Commission workflows using Hangfire.",
                        "Enabled real-time synchronization across dashboards, kiosks, and mobile apps using SignalR."
                    },
                    TechStack = new List<string> { ".NET 8", "C#", "EF Core", "Dapper", "SignalR", "Hangfire", "MAUI" },
                    Order = 1
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
                        "Contributed to backend development for CRM, e-learning, and booking systems using ASP.NET Core and SQL Server.",
                        "Worked with both monolithic and microservices-based systems, supporting API development and service integration.",
                        "Assisted in refactoring legacy server-side logic and optimizing SQL queries to improve system response time."
                    },
                    TechStack = new List<string> { "ASP.NET Core", "SQL Server", "Microservices" },
                    Order = 2
                },
                new Experience
                {
                    Id = Guid.NewGuid(),
                    Role = "Full-stack Developer",
                    Company = "Personal Lab",
                    Period = "2022 - 2023",
                    ProjectName = "Family-SaaS: Billing & Task Orchestrator",
                    Highlights = new List<string>
                    {
                        "Built a decoupled ecosystem (.NET 8, MAUI, React) with Repository Pattern and Unit Testing.",
                        "Ran a 24/7 Ubuntu server on repurposed hardware with Docker and background jobs.",
                        "Secured external access via Cloudflare (DNS/SSL) and NAT Port Forwarding."
                    },
                    TechStack = new List<string> { ".NET 8", "React", "Docker", "Linux", "CI/CD" },
                    Order = 3
                }
            });
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

        // 5. Seed Projects (Bento grid showcase)
        if (!await context.Projects.AnyAsync())
        {
            context.Projects.AddRange(new List<Project>
            {
                new Project
                {
                    Id = Guid.NewGuid(),
                    Title = "Enterprise SaaS CRM/POS Ecosystem",
                    Slug = "enterprise-saas-crm-pos",
                    Summary = "Hệ sinh thái SaaS CRM/POS Multi-tenant xử lý giao dịch cao cho chuỗi cửa hàng.",
                    DescriptionMdx = "Hệ thống quản lý chuỗi salon với kiến trúc Multi-tenant (RLS), xử lý thanh toán realtime và automation workflow.",
                    CoverImageKey = "/images/project-pos.png",
                    TechStack = "[\".NET 8\", \"C#\", \"PostgreSQL\", \"SignalR\", \"Hangfire\", \"React\"]",
                    DemoUrl = "https://khoi.dev",
                    GithubUrl = "https://github.com/vykhoi",
                    Order = 1,
                    IsFeatured = true,
                    Status = "Published"
                },
                new Project
                {
                    Id = Guid.NewGuid(),
                    Title = "Personal Portfolio & Local AI Lab",
                    Slug = "personal-portfolio-lab",
                    Summary = "Hệ thống Portfolio tinh gọn tích hợp trợ lý AI cục bộ (Ollama) và Dark Cyber UI.",
                    DescriptionMdx = "Refactor từ Microservices sang Modular Monolith hiệu suất cao, tự host AI model phục vụ tuyển dụng.",
                    CoverImageKey = "/images/project-portfolio.png",
                    TechStack = "[\".NET 9\", \"React 19\", \"Ollama\", \"PostgreSQL\", \"Docker\"]",
                    DemoUrl = "https://khoi.dev",
                    GithubUrl = "https://github.com/vykhoi/Portfolio",
                    Order = 2,
                    IsFeatured = true,
                    Status = "Published"
                }
            });
        }

        await context.SaveChangesAsync();
    }
}
