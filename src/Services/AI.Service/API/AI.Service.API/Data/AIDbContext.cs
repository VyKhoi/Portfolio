using Microsoft.EntityFrameworkCore;
using AI.Service.API.Entities;

namespace AI.Service.API.Data
{
    public class AIDbContext : DbContext
    {
        public AIDbContext(DbContextOptions<AIDbContext> options) : base(options)
        {
        }

        public DbSet<ChatSession> ChatSessions { get; set; } = null!;
        public DbSet<ChatMessage> ChatMessages { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ChatSession>(entity =>
            {
                entity.HasKey(e => e.SessionId);
                
                entity.HasMany(e => e.Messages)
                      .WithOne(e => e.Session)
                      .HasForeignKey(e => e.SessionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
            });
        }
    }

    public class AIDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<AIDbContext>
    {
        public AIDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AIDbContext>();
            optionsBuilder.UseNpgsql("Host=localhost;Database=Dummy;Username=postgres;Password=dummy");

            return new AIDbContext(optionsBuilder.Options);
        }
    }
}
