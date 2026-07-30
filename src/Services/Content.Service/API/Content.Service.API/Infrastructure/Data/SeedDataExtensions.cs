using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Content.Service.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Content.Service.API.Infrastructure.Data;

public static class SeedDataExtensions
{
    public static async Task SeedDataAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ContentDbContext>();

        // Ensure database is created and migrations are applied
        await context.Database.MigrateAsync();

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

        if (!await context.Experiences.AnyAsync())
        {
            var experiences = new List<Experience>
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
            };
            context.Experiences.AddRange(experiences);
        }

        if (!await context.Skills.AnyAsync())
        {
            var skills = new List<Skill>
            {
                new Skill { Id = Guid.NewGuid(), Name = ".NET 8", Category = "Backend & Core", ProficiencyLevel = 90, Order = 1 },
                new Skill { Id = Guid.NewGuid(), Name = "C#", Category = "Backend & Core", ProficiencyLevel = 90, Order = 2 },
                new Skill { Id = Guid.NewGuid(), Name = "Concurrency", Category = "Backend & Core", ProficiencyLevel = 80, Order = 3 },
                new Skill { Id = Guid.NewGuid(), Name = "REST APIs", Category = "Backend & Core", ProficiencyLevel = 90, Order = 4 },
                new Skill { Id = Guid.NewGuid(), Name = "SignalR", Category = "Backend & Core", ProficiencyLevel = 85, Order = 5 },
                new Skill { Id = Guid.NewGuid(), Name = "Hangfire", Category = "Backend & Core", ProficiencyLevel = 85, Order = 6 },
                
                new Skill { Id = Guid.NewGuid(), Name = "Multi-tenant", Category = "Architecture & Sec", ProficiencyLevel = 80, Order = 7 },
                new Skill { Id = Guid.NewGuid(), Name = "RLS", Category = "Architecture & Sec", ProficiencyLevel = 75, Order = 8 },
                new Skill { Id = Guid.NewGuid(), Name = "Rate Limiting", Category = "Architecture & Sec", ProficiencyLevel = 70, Order = 9 },
                new Skill { Id = Guid.NewGuid(), Name = "Clean Arch", Category = "Architecture & Sec", ProficiencyLevel = 85, Order = 10 },
                new Skill { Id = Guid.NewGuid(), Name = "DI", Category = "Architecture & Sec", ProficiencyLevel = 90, Order = 11 },
                
                new Skill { Id = Guid.NewGuid(), Name = "SQL Server", Category = "Databases", ProficiencyLevel = 85, Order = 12 },
                new Skill { Id = Guid.NewGuid(), Name = "PostgreSQL", Category = "Databases", ProficiencyLevel = 80, Order = 13 },
                new Skill { Id = Guid.NewGuid(), Name = "EF Core", Category = "Databases", ProficiencyLevel = 90, Order = 14 },
                new Skill { Id = Guid.NewGuid(), Name = "LINQ", Category = "Databases", ProficiencyLevel = 90, Order = 15 },
                new Skill { Id = Guid.NewGuid(), Name = "Dapper", Category = "Databases", ProficiencyLevel = 85, Order = 16 },
                
                new Skill { Id = Guid.NewGuid(), Name = "MAUI", Category = "Frontend & Ops", ProficiencyLevel = 75, Order = 17 },
                new Skill { Id = Guid.NewGuid(), Name = "React", Category = "Frontend & Ops", ProficiencyLevel = 70, Order = 18 },
                new Skill { Id = Guid.NewGuid(), Name = "Docker", Category = "Frontend & Ops", ProficiencyLevel = 80, Order = 19 },
                new Skill { Id = Guid.NewGuid(), Name = "Linux", Category = "Frontend & Ops", ProficiencyLevel = 75, Order = 20 },
                new Skill { Id = Guid.NewGuid(), Name = "CI/CD", Category = "Frontend & Ops", ProficiencyLevel = 70, Order = 21 },
                new Skill { Id = Guid.NewGuid(), Name = "Cloudflare", Category = "Frontend & Ops", ProficiencyLevel = 75, Order = 22 }
            };
            context.Skills.AddRange(skills);
        }

        await context.SaveChangesAsync();
    }
}
