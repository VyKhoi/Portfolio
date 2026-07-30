using Contact.Service.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Contact.Service.API.Infrastructure.Data;

public class ContactDbContext : DbContext
{
    public ContactDbContext(DbContextOptions<ContactDbContext> options) : base(options) { }

    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
}
