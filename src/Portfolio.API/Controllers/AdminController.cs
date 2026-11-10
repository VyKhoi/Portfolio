using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Portfolio.API.Data;
using Portfolio.API.Features.Chat;

namespace Portfolio.API.Controllers;

/// <summary>Real numbers and health for the admin overview. Nothing here is written by hand.</summary>
[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly PortfolioDbContext _db;
    private readonly ChatQuota _quota;
    private readonly OllamaOptions _ollama;
    private readonly IHttpClientFactory _http;

    public AdminController(PortfolioDbContext db, ChatQuota quota, IOptions<OllamaOptions> ollama, IHttpClientFactory http)
    {
        _db = db;
        _quota = quota;
        _ollama = ollama.Value;
        _http = http;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var since = now.AddDays(-7);

        var visitorSessions = _db.ChatSessions.AsNoTracking().Where(s => !s.IsTest);
        var replies = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.Role == "assistant" && m.TotalMs != null && m.CreatedAt >= since)
            .Where(m => visitorSessions.Any(s => s.SessionId == m.SessionId))
            .Select(m => new { m.CreatedAt, m.TotalMs, m.FirstTokenMs })
            .ToListAsync(cancellationToken);

        // Days in Vietnam time, oldest first, so the chart reads left to right
        var vn = TimeSpan.FromHours(7);
        var today = (now + vn).Date;
        var days = Enumerable.Range(0, 7).Select(i => today.AddDays(i - 6)).Select(day =>
        {
            var inDay = replies.Where(r => (r.CreatedAt + vn).Date == day).ToList();
            return new { date = day.ToString("yyyy-MM-dd"), replies = inDay.Count, medianMs = Median(inDay.Select(r => r.TotalMs!.Value)) };
        });

        return Ok(new
        {
            inbox = new
            {
                unread = await _db.ContactMessages.CountAsync(m => m.Status == "Pending", cancellationToken),
                total = await _db.ContactMessages.CountAsync(cancellationToken),
            },
            chat = new
            {
                sessions7d = await visitorSessions.CountAsync(s => s.LastMessageAt >= since, cancellationToken),
                replies7d = replies.Count,
                medianReplyMs = Median(replies.Select(r => r.TotalMs!.Value)),
                medianFirstTokenMs = Median(replies.Where(r => r.FirstTokenMs != null).Select(r => r.FirstTokenMs!.Value)),
                refused7d = _quota.RefusedSince(since),
                days,
            },
            ollama = await OllamaAsync(cancellationToken),
            build = new
            {
                commit = Environment.GetEnvironmentVariable("BUILD_COMMIT") ?? "",
                time = Environment.GetEnvironmentVariable("BUILD_TIME") ?? "",
            },
            serverTime = now,
        });
    }

    private static int? Median(IEnumerable<int> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        return sorted.Count == 0 ? null : sorted[sorted.Count / 2];
    }

    /// <summary>Is the model reachable, loaded, and how much of it sits on the GPU (Ollama /api/ps).</summary>
    private async Task<object> OllamaAsync(CancellationToken cancellationToken)
    {
        try
        {
            var client = _http.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);
            using var doc = JsonDocument.Parse(await client.GetStringAsync($"{_ollama.BaseUrl.TrimEnd('/')}/api/ps", cancellationToken));
            var model = doc.RootElement.GetProperty("models").EnumerateArray()
                .FirstOrDefault(m => m.GetProperty("name").GetString() == _ollama.Model);
            if (model.ValueKind == JsonValueKind.Undefined)
            {
                return new { online = true, model = _ollama.Model, loaded = false, gpuPercent = (int?)null };
            }
            var size = model.GetProperty("size").GetInt64();
            var vram = model.TryGetProperty("size_vram", out var v) ? v.GetInt64() : 0;
            return new { online = true, model = _ollama.Model, loaded = true, gpuPercent = (int?)(size > 0 ? (int)(vram * 100 / size) : 0) };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException or KeyNotFoundException or InvalidOperationException)
        {
            return new { online = false, model = _ollama.Model, loaded = false, gpuPercent = (int?)null };
        }
    }
}
