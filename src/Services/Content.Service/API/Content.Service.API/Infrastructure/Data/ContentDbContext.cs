using Content.Service.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Content.Service.API.Infrastructure.Data;

public class ContentDbContext : DbContext
{
    public ContentDbContext(DbContextOptions<ContentDbContext> options) : base(options) { }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Experience> Experiences => Set<Experience>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Profile> Profiles => Set<Profile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>().HasIndex(p => p.Slug).IsUnique();
        base.OnModelCreating(modelBuilder);
    }
}
