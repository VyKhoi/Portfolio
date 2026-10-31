using System;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Portfolio.API.Data;
using Portfolio.API.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 1. Serilog Setup
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/portfolio-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
    .CreateLogger();

builder.Host.UseSerilog();

// 2. Database Context (no hardcoded fallback: a missing connection string must fail loudly)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
}

builder.Services.AddDbContext<PortfolioDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 3. In-Memory Caching & Rate Limiting
builder.Services.AddMemoryCache();

// 4. JWT Authentication & Authorization
var jwtSecret = JwtService.GetValidatedSecret(builder.Configuration);
var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        // Tokens carry a stamp of the password hash: changing the password revokes every older token.
        // Tokens issued before this check existed carry no stamp and stay valid until they expire.
        OnTokenValidated = async context =>
        {
            var stamp = context.Principal?.FindFirst(JwtService.PasswordStampClaim)?.Value;
            if (stamp == null) return;

            var userId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var cache = context.HttpContext.RequestServices.GetRequiredService<IMemoryCache>();
            var currentStamp = await cache.GetOrCreateAsync($"pwd_stamp_{userId}", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
                var db = context.HttpContext.RequestServices.GetRequiredService<PortfolioDbContext>();
                var user = Guid.TryParse(userId, out var id) ? await db.Users.FindAsync(id) : null;
                return user == null ? null : JwtService.PasswordStamp(user.PasswordHash);
            });

            if (currentStamp != stamp)
            {
                context.Fail("Token revoked.");
            }
        }
    };
});

builder.Services.AddAuthorization();

// 5. In-Memory Channel & Background Workers
builder.Services.AddSingleton<ContactChannel>();
builder.Services.AddTransient<EmailService>();
builder.Services.AddHostedService<EmailBackgroundWorker>();
builder.Services.AddHostedService<ChatRetentionWorker>();

// 6. External Clients (Local Ollama & Telegram)
builder.Services.AddHttpClient<TelegramNotifier>();
builder.Services.AddHttpClient<OllamaClient>();
builder.Services.AddSingleton<AiConcurrencyGate>();
builder.Services.AddSingleton<JwtService>();

// 7. CORS: the SPA calls /api on its own origin, so only list the real site (+ Vite dev server)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "https://dangvykhoi.com", "https://www.dangvykhoi.com" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 8. Real client IP: requests arrive through the gateway nginx and the frontend nginx (both on Docker
// networks). Only trust X-Forwarded-For from private ranges; the backend port is not published.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
    options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
    options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("172.16.0.0"), 12));
    options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("192.168.0.0"), 16));
    options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Loopback, 8));
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseCors("CorsPolicy");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Auto-migrate & seed database
using (var scope = app.Services.CreateScope())
{
    try
    {
        await SeedData.InitializeAsync(scope.ServiceProvider);
        Log.Information("Database migration and seeding successfully executed.");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to apply database migrations / seed data.");
    }
}

app.Run();
