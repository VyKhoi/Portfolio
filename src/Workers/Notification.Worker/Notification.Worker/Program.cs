using Serilog;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using Notification.Worker.Hubs;
using Notification.Worker.Services;
using Notification.Worker.Workers;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Hangfire;
using Hangfire.PostgreSql;
using Npgsql;
var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("Notification.Worker"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri("http://otel_collector:4317")))
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri("http://otel_collector:4317")));

builder.Services.AddSignalR();
builder.Services.AddSingleton<EmailService>();
builder.Services.AddHostedService<KafkaConsumerWorker>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        b => b
            .SetIsOriginAllowed((host) => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var hfConnection = builder.Configuration.GetConnectionString("HangfireConnection") 
    ?? "Host=localhost;Database=hangfire_db;Username=postgres;Password=P@ssw0rd123!";

try
{
    var builderCb = new NpgsqlConnectionStringBuilder(hfConnection);
    var dbName = builderCb.Database;
    builderCb.Database = "postgres"; // Connect to default DB to create the new one
    using (var conn = new NpgsqlConnection(builderCb.ConnectionString))
    {
        conn.Open();
        using (var checkCmd = new NpgsqlCommand($"SELECT 1 FROM pg_database WHERE datname = '{dbName}'", conn))
        {
            if (checkCmd.ExecuteScalar() == null)
            {
                using (var createCmd = new NpgsqlCommand($"CREATE DATABASE \"{dbName}\"", conn))
                {
                    createCmd.ExecuteNonQuery();
                }
            }
        }
    }
}
catch (System.Exception ex)
{
    System.Console.WriteLine($"Error creating Hangfire DB: {ex.Message}");
}

builder.Services.AddHangfire(config => config.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(hfConnection)));
builder.Services.AddHangfireServer();

var app = builder.Build();

app.UseCors("CorsPolicy");
app.MapHub<NotificationHub>("/hubs/notification");

app.UseHangfireDashboard();
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    recurringJobManager.AddOrUpdate("cleanup-job", () => System.Console.WriteLine("Cleaning up old messages..."), Cron.Daily);
}

app.Run();
