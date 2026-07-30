using Contact.Service.API.Infrastructure.Data;
using Contact.Service.API.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=contact_db;Username=postgres;Password=P@ssw0rd123!";
builder.Services.AddDbContext<ContactDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddSingleton<KafkaProducerService>();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
builder.Services.AddControllers();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ContactDbContext>();
    dbContext.Database.Migrate();
}

app.Run();
