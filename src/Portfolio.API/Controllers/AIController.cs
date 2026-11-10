using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Portfolio.API.Data;
using Portfolio.API.Entities;
using Portfolio.API.Features.Chat;

namespace Portfolio.API.Controllers;

[ApiController]
[Route("api/ai")]
public class AIController : ControllerBase
{
    private readonly PortfolioDbContext _db;
    private readonly ChatService _chat;

    public AIController(PortfolioDbContext db, ChatService chat)
    {
        _db = db;
        _chat = chat;
    }

    public record ChatRequest(string? SessionId, string? Message, string? Lang, string? WebsiteTrap);

    public record FactRequest(string Key, string Label, string ValueVi, string ValueEn, int Order, bool Enabled);

    /// <summary>Server-Sent Events: <c>{"token": "..."}</c> for the answer, <c>{"notice": "..."}</c> for system messages.</summary>
    [HttpPost("chat/stream")]
    public async Task ChatStream([FromBody] ChatRequest request, CancellationToken cancellationToken)
    {
        Response.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers.CacheControl = "no-cache";

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        // The admin console's "Hỏi thử" sends its token and this header; anyone else is a normal visitor
        var isTest = User.Identity?.IsAuthenticated == true && Request.Headers["X-Admin-Test"] == "1";
        var turn = new ChatTurn(request.SessionId, request.Message, request.Lang, request.WebsiteTrap, clientIp, isTest);
        await _chat.HandleAsync(turn, new SseChatOutput(Response), cancellationToken);

        if (!cancellationToken.IsCancellationRequested)
        {
            await SseChatOutput.WriteAsync(Response, "[DONE]", cancellationToken);
        }
    }

    [HttpGet("history/{sessionId}")]
    public async Task<IActionResult> GetVisitorHistory(string sessionId)
    {
        if (!ChatSessionId.IsValid(sessionId)) return Ok(Array.Empty<object>());

        var messages = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.Id)
            .Select(m => new { role = m.Role, content = m.Content })
            .ToListAsync();
        return Ok(messages);
    }

    [HttpGet("sessions")]
    [Authorize]
    public async Task<IActionResult> GetSessions()
        => Ok(await _db.ChatSessions.AsNoTracking().OrderByDescending(s => s.LastMessageAt).ToListAsync());

    [HttpGet("sessions/{id}/messages")]
    [Authorize]
    public async Task<IActionResult> GetSessionMessages(string id)
        => Ok(await _db.ChatMessages.AsNoTracking().Where(m => m.SessionId == id).OrderBy(m => m.Id).ToListAsync());

    /// <summary>Deletes one visitor's conversation, for a deletion request under the data protection law.</summary>
    [HttpDelete("sessions/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteSession(string id)
    {
        var messages = await _db.ChatMessages.Where(m => m.SessionId == id).ToListAsync();
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == id);
        if (session == null && messages.Count == 0) return NotFound();

        _db.ChatMessages.RemoveRange(messages);
        if (session != null) _db.ChatSessions.Remove(session);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, deletedMessages = messages.Count });
    }

    [HttpGet("stats")]
    [Authorize]
    public async Task<IActionResult> GetStats()
    {
        var since = DateTime.UtcNow.AddDays(-7);
        var stats = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.Role == "assistant" && m.Source != null && m.CreatedAt >= since)
            .Where(m => _db.ChatSessions.Any(c => c.SessionId == m.SessionId && !c.IsTest))
            .GroupBy(m => m.Source)
            .Select(g => new
            {
                source = g.Key,
                replies = g.Count(),
                averageFirstTokenMs = g.Average(m => m.FirstTokenMs),
                averageTotalMs = g.Average(m => m.TotalMs),
            })
            .ToListAsync();
        return Ok(stats);
    }

    [HttpGet("facts")]
    [Authorize]
    public async Task<IActionResult> GetFacts()
        => Ok(await _db.AssistantFacts.AsNoTracking().OrderBy(f => f.Order).ToListAsync());

    [HttpPost("facts")]
    [Authorize]
    public async Task<IActionResult> CreateFact([FromBody] FactRequest request)
    {
        var fact = new AssistantFact();
        Apply(fact, request);
        _db.AssistantFacts.Add(fact);
        return await SaveFactAsync(fact);
    }

    [HttpPut("facts/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateFact(Guid id, [FromBody] FactRequest request)
    {
        var fact = await _db.AssistantFacts.FindAsync(id);
        if (fact == null) return NotFound();

        Apply(fact, request);
        return await SaveFactAsync(fact);
    }

    [HttpDelete("facts/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteFact(Guid id)
    {
        var fact = await _db.AssistantFacts.FindAsync(id);
        if (fact == null) return NotFound();

        _db.AssistantFacts.Remove(fact);
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private static void Apply(AssistantFact fact, FactRequest request)
    {
        fact.Key = request.Key.Trim();
        fact.Label = request.Label.Trim();
        fact.ValueVi = request.ValueVi.Trim();
        fact.ValueEn = request.ValueEn.Trim();
        fact.Order = request.Order;
        fact.Enabled = request.Enabled;
    }

    private async Task<IActionResult> SaveFactAsync(AssistantFact fact)
    {
        if (fact.Key.Length == 0 || fact.Label.Length == 0)
        {
            return BadRequest(new { error = "Key and label are required." });
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { error = "This key already exists." });
        }
        return Ok(fact);
    }

    private sealed class SseChatOutput : IChatOutput
    {
        private readonly HttpResponse _response;

        public SseChatOutput(HttpResponse response) => _response = response;

        public Task TokenAsync(string text, CancellationToken cancellationToken)
            => WriteAsync(_response, JsonSerializer.Serialize(new { token = text }), cancellationToken);

        public Task NoticeAsync(string text, CancellationToken cancellationToken)
            => WriteAsync(_response, JsonSerializer.Serialize(new { notice = text }), cancellationToken);

        public static async Task WriteAsync(HttpResponse response, string data, CancellationToken cancellationToken)
        {
            await response.Body.WriteAsync(Encoding.UTF8.GetBytes($"data: {data}\n\n"), cancellationToken);
            await response.Body.FlushAsync(cancellationToken);
        }
    }
}
