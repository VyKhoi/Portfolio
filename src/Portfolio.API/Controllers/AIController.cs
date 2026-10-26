using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Portfolio.API.Data;
using Portfolio.API.Entities;
using Portfolio.API.Services;

namespace Portfolio.API.Controllers;

[ApiController]
[Route("api/ai")]
public class AIController : ControllerBase
{
    private readonly PortfolioDbContext _db;
    private readonly OllamaClient _ollama;
    private readonly TelegramNotifier _telegram;
    private readonly IMemoryCache _memCache;

    public AIController(
        PortfolioDbContext db, 
        OllamaClient ollama, 
        TelegramNotifier telegram,
        IMemoryCache memCache)
    {
        _db = db;
        _ollama = ollama;
        _telegram = telegram;
        _memCache = memCache;
    }

    public class ChatRequestDto
    {
        public string SessionId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public List<ChatHistoryItemDto> History { get; set; } = new();
        // Honeypot field: invisible to real users, filled by automated scrapers/bots
        public string? WebsiteTrap { get; set; }
    }

    public class ChatHistoryItemDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    /// <summary>
    /// Standard Non-streaming chat endpoint (fallback)
    /// </summary>
    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
    {
        // 1. Honeypot check: silently drop bot spam without calling AI or saving DB
        if (!string.IsNullOrEmpty(request.WebsiteTrap))
        {
            return Ok(new { response = "Meow~ Cảm ơn bạn đã ghé thăm portfolio! 😼", sessionId = request.SessionId });
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Message cannot be empty." });
        }

        if (request.Message.Length > 350)
        {
            return BadRequest(new { error = "Tin nhắn tối đa 350 ký tự để tránh quá tải nha bạn 😼!" });
        }

        var sessionId = string.IsNullOrWhiteSpace(request.SessionId) 
            ? Guid.NewGuid().ToString() 
            : request.SessionId;

        // 2. Session quota check (max 15 messages per 10 minutes)
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var quotaKey = $"ai_quota_{clientIp}_{sessionId}";
        var count = _memCache.GetOrCreate(quotaKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            return 0;
        });

        if (count >= 15)
        {
            return Ok(new 
            { 
                response = "Meow~ Bạn trò chuyện hăng say quá làm em hoa cả mắt rồi 😼! Em xin phép nghỉ ngơi một chút nhé, hoặc bạn có thể liên hệ trực tiếp anh Khôi qua SĐT 0931 314 792 nha!", 
                sessionId = sessionId 
            });
        }
        _memCache.Set(quotaKey, count + 1, TimeSpan.FromMinutes(10));

        // 3. Session management
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        if (session == null)
        {
            session = new ChatSession
            {
                SessionId = sessionId,
                StartedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };
            _db.ChatSessions.Add(session);
        }
        else
        {
            session.LastMessageAt = DateTime.UtcNow;
        }

        // 4. Save user message to database
        var userDbMessage = new ChatMessage
        {
            SessionId = sessionId,
            Role = "user",
            Content = request.Message,
            CreatedAt = DateTime.UtcNow
        };
        _db.ChatMessages.Add(userDbMessage);
        await _db.SaveChangesAsync();

        // 5. Notify Telegram asynchronously
        _ = Task.Run(async () =>
        {
            var shortSession = sessionId.Length > 8 ? sessionId.Substring(0, 8) : sessionId;
            var alertText = $"🚨 *Khách chat với Sigma Cat 😼!*\n" +
                            $"🆔 Session: `{shortSession}...`\n" +
                            $"👤 Khách: {request.Message}";
            await _telegram.SendMessageAsync(alertText);
        });

        // 6. Retrieve recent session history (last 6 messages before this current user message)
        var historyMessages = await _db.ChatMessages
            .Where(m => m.SessionId == sessionId && m.Id != userDbMessage.Id)
            .OrderByDescending(m => m.CreatedAt)
            .Take(6)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new OllamaChatMessage
            {
                Role = m.Role,
                Content = m.Content
            })
            .ToListAsync();

        // Sanitize history to prevent old contaminated messages from confusing the AI
        foreach (var h in historyMessages)
        {
            if (h.Role == "assistant" && IsForbiddenImpersonation(h.Content))
            {
                h.Content = "Meow chào bạn 😼! Em là Sigma Cat - trợ lý AI tiếp khách của anh Khôi nè!";
            }
        }

        // 8. Generate reply from local AI
        var replyContent = await _ollama.GenerateReplyAsync(historyMessages, request.Message);
        if (IsEnglishRefusal(replyContent) || IsForbiddenImpersonation(replyContent))
        {
            if (IsEnglishQuery(request.Message))
            {
                replyContent = "Meow! I'm Sigma Cat 😼🐾, Mr. Khoi's AI assistant. Mr. Khoi (Dang Vy Khoi) is a .NET Software Engineer at Masan Group. How can I help you explore his projects or skills?";
            }
            else if (IsGreeting(request.Message))
            {
                replyContent = "Meow chào bạn 😼! Em là Sigma Cat, trợ lý tiếp khách của anh Khôi nè. Bạn ghé thăm portal cần em hỗ trợ tìm hiểu gì về anh Khôi hong?";
            }
            else
            {
                replyContent = "Anh Khôi (tên đầy đủ là Đặng Vỹ Khôi, sinh năm 2002) là Software Engineer (.NET Backend) tại Tập đoàn Masan nha bạn 😼! Em là Sigma Cat trợ lý của ảnh nè, bạn cần xem dự án hay liên hệ ảnh hong?";
            }
        }

        // 9. Save AI reply to database
        var aiDbMessage = new ChatMessage
        {
            SessionId = sessionId,
            Role = "assistant",
            Content = replyContent,
            CreatedAt = DateTime.UtcNow
        };
        _db.ChatMessages.Add(aiDbMessage);
        await _db.SaveChangesAsync();

        // 10. Notify Telegram of reply
        _ = Task.Run(async () =>
        {
            var replyText = $"😼 *Sigma Cat trả lời:*\n{replyContent}";
            await _telegram.SendMessageAsync(replyText);
        });

        return Ok(new { response = replyContent, sessionId = sessionId });
    }

    /// <summary>
    /// Realtime Server-Sent Events (SSE) Streaming endpoint.
    /// Emits tokens immediately as they arrive from Ollama (~0.5s First-Token Latency).
    /// </summary>
    [HttpPost("chat/stream")]
    public async Task ChatStream([FromBody] ChatRequestDto request, CancellationToken cancellationToken)
    {
        Response.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        // 1. Honeypot check
        if (!string.IsNullOrEmpty(request.WebsiteTrap))
        {
            await WriteSseAsync("Meow~ Cảm ơn bạn đã ghé thăm portfolio! 😼");
            return;
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            await WriteSseAsync("Meow... Bạn chưa nhập nội dung nè 😼");
            return;
        }

        if (request.Message.Length > 350)
        {
            await WriteSseAsync("Meow~ Tin nhắn quá dài (tối đa 350 ký tự), bạn rút gọn lại giúp em nha 😼!");
            return;
        }

        var sessionId = string.IsNullOrWhiteSpace(request.SessionId) 
            ? Guid.NewGuid().ToString() 
            : request.SessionId;

        // 2. Session quota check (max 15 messages per 10 minutes)
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var quotaKey = $"ai_quota_{clientIp}_{sessionId}";
        var count = _memCache.GetOrCreate(quotaKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            return 0;
        });

        if (count >= 15)
        {
            await WriteSseAsync("Meow~ Bạn trò chuyện hăng say quá làm em hoa cả mắt rồi 😼! Em xin phép nghỉ ngơi một chút nhé, hoặc bạn có thể liên hệ trực tiếp anh Khôi qua SĐT 0931 314 792 nha!");
            return;
        }
        _memCache.Set(quotaKey, count + 1, TimeSpan.FromMinutes(10));

        // 3. Session & Message database persistence
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId, cancellationToken);
        if (session == null)
        {
            session = new ChatSession
            {
                SessionId = sessionId,
                StartedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };
            _db.ChatSessions.Add(session);
        }
        else
        {
            session.LastMessageAt = DateTime.UtcNow;
        }

        var userDbMessage = new ChatMessage
        {
            SessionId = sessionId,
            Role = "user",
            Content = request.Message,
            CreatedAt = DateTime.UtcNow
        };
        _db.ChatMessages.Add(userDbMessage);
        await _db.SaveChangesAsync(cancellationToken);

        // 4. Notify Telegram asynchronously
        _ = Task.Run(async () =>
        {
            var shortSession = sessionId.Length > 8 ? sessionId.Substring(0, 8) : sessionId;
            var alertText = $"🚨 *Khách chat với Sigma Cat (Stream) 😼!*\n" +
                            $"🆔 Session: `{shortSession}...`\n" +
                            $"👤 Khách: {request.Message}";
            await _telegram.SendMessageAsync(alertText);
        });

        // 5. Retrieve recent history for context memory
        var historyMessages = await _db.ChatMessages
            .Where(m => m.SessionId == sessionId && m.Id != userDbMessage.Id)
            .OrderByDescending(m => m.CreatedAt)
            .Take(6)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new OllamaChatMessage
            {
                Role = m.Role,
                Content = m.Content
            })
            .ToListAsync(cancellationToken);

        // Sanitize history to prevent old contaminated messages from confusing the AI
        foreach (var h in historyMessages)
        {
            if (h.Role == "assistant" && IsForbiddenImpersonation(h.Content))
            {
                h.Content = "Meow chào bạn 😼! Em là Sigma Cat - trợ lý AI tiếp khách của anh Khôi nè!";
            }
        }

        // 7. Stream from Ollama token by token with refusal & impersonation guard
        var fullReplyBuilder = new StringBuilder();
        var initialBuffer = new StringBuilder();
        var isRefusalOrImpersonation = false;
        var tokenCount = 0;

        await foreach (var chunk in _ollama.StreamReplyAsync(historyMessages, request.Message, cancellationToken))
        {
            if (tokenCount < 14)
            {
                initialBuffer.Append(chunk);
                tokenCount++;
                var peek = initialBuffer.ToString().Trim().ToLowerInvariant();
                if (IsEnglishRefusal(peek) || IsForbiddenImpersonation(peek))
                {
                    isRefusalOrImpersonation = true;
                    break;
                }
                if (tokenCount == 14)
                {
                    var buffered = initialBuffer.ToString();
                    fullReplyBuilder.Append(buffered);
                    await WriteSseAsync(buffered);
                }
            }
            else
            {
                fullReplyBuilder.Append(chunk);
                await WriteSseAsync(chunk);
            }
        }

        if (tokenCount > 0 && tokenCount < 14 && !isRefusalOrImpersonation)
        {
            var buffered = initialBuffer.ToString();
            fullReplyBuilder.Append(buffered);
            await WriteSseAsync(buffered);
        }

        if (isRefusalOrImpersonation)
        {
            string fallback;
            if (IsEnglishQuery(request.Message))
            {
                fallback = "Meow! I'm Sigma Cat 😼🐾, Mr. Khoi's AI assistant. Mr. Khoi (Dang Vy Khoi) is a .NET Software Engineer at Masan Group. How can I help you explore his projects or skills?";
            }
            else if (IsGreeting(request.Message))
            {
                fallback = "Meow chào bạn 😼! Em là Sigma Cat, trợ lý tiếp khách của anh Khôi nè. Bạn ghé thăm portal cần em hỗ trợ tìm hiểu gì về anh Khôi hong?";
            }
            else
            {
                fallback = "Anh Khôi (tên đầy đủ là Đặng Vỹ Khôi, sinh năm 2002) là Software Engineer (.NET Backend) tại Tập đoàn Masan nha bạn 😼! Em là Sigma Cat trợ lý của ảnh nè, bạn cần xem dự án hay liên hệ ảnh hong?";
            }

            fullReplyBuilder.Clear();
            fullReplyBuilder.Append(fallback);
            await WriteSseAsync(fallback);
        }

        var fullReply = fullReplyBuilder.ToString().Trim();
        if (string.IsNullOrEmpty(fullReply))
        {
            fullReply = "Meow~ Sigma Cat đang suy nghĩ một chút, bạn đợi tí nha! 😼";
            await WriteSseAsync(fullReply);
        }

        await Response.Body.WriteAsync(Encoding.UTF8.GetBytes("data: [DONE]\n\n"));
        await Response.Body.FlushAsync();

        // 8. Save full assembled AI response to PostgreSQL
        var aiDbMessage = new ChatMessage
        {
            SessionId = sessionId,
            Role = "assistant",
            Content = fullReply,
            CreatedAt = DateTime.UtcNow
        };
        _db.ChatMessages.Add(aiDbMessage);
        await _db.SaveChangesAsync(cancellationToken);

        // 9. Notify Telegram with full reply
        _ = Task.Run(async () =>
        {
            var replyText = $"😼 *Sigma Cat trả lời:*\n{fullReply}";
            await _telegram.SendMessageAsync(replyText);
        });
    }

    private async Task WriteSseAsync(string text)
    {
        var json = JsonSerializer.Serialize(new { token = text, chunk = text });
        var payload = $"data: {json}\n\n";
        var bytes = Encoding.UTF8.GetBytes(payload);
        await Response.Body.WriteAsync(bytes);
        await Response.Body.FlushAsync();
    }

    private static bool IsEnglishQuery(string message)
    {
        if (string.IsNullOrWhiteSpace(message)) return false;
        var clean = message.ToLowerInvariant();
        var enMarkers = new[] { "what", "who", "where", "how", "why", "can you", "tell me", "does", "is he", "about", "project", "experience", "education", "skill" };
        foreach (var marker in enMarkers)
        {
            if (clean.Contains(marker)) return true;
        }
        return false;
    }

    private static bool IsEnglishRefusal(string reply)
    {
        if (string.IsNullOrWhiteSpace(reply)) return false;
        var clean = reply.Trim().ToLowerInvariant();
        return clean.StartsWith("sorry")
            || clean.StartsWith("i cannot assist")
            || clean.StartsWith("i can't assist")
            || clean.StartsWith("as an ai");
    }

    private static bool IsGreeting(string message)
    {
        if (string.IsNullOrWhiteSpace(message)) return false;
        var clean = message.ToLowerInvariant().Trim();
        return clean.StartsWith("hello")
            || clean.StartsWith("hi")
            || clean.StartsWith("alo")
            || clean.StartsWith("chào")
            || clean.Contains("chào em")
            || clean.Contains("hello em");
    }

    private static bool IsForbiddenImpersonation(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        var clean = text.ToLowerInvariant().Trim();
        return clean.Contains("tôi tên là")
            || clean.Contains("tôi là vykhoi")
            || clean.Contains("tôi là vy khôi")
            || clean.Contains("tôi là anh khôi")
            || clean.Contains("tôi là khôi")
            || clean.Contains("tôi là đặng vỹ khôi")
            || clean.Contains("mình là vykhoi")
            || clean.Contains("mình là vy khôi")
            || clean.Contains("mình tên là")
            || clean.Contains("mình là anh khôi")
            || clean.Contains("mình là khôi")
            || clean.Contains("tôi chính là")
            || clean.Contains("tôi đây chính là")
            || clean.Contains("tôi là một software engineer")
            || clean.Contains("tôi là software engineer")
            || clean.Contains("tôi là một lập trình viên")
            || clean.Contains("tôi là lập trình viên")
            || clean.Contains("kinh nghiệm của tôi")
            || clean.Contains("kỹ năng của tôi")
            || clean.Contains("dự án mà tôi")
            || clean.Contains("chuyên môn của mình")
            || clean.Contains("tôi hiện đang làm việc")
            || clean.Contains("đỗ văn")
            || clean.Contains("kiều hồi")
            || clean.Contains("dưới đây là một số thông tin cơ bản")
            || clean.Contains("dưới đây là một số thông tin")
            || clean.Contains("dưới đây là thông tin")
            || clean.Contains("dưới đây là")
            || clean.Contains("thông tin chi tiết")
            || clean.Contains("tên: ")
            || clean.Contains("chức vụ: ")
            || clean.Contains("địa điểm làm việc")
            || clean.StartsWith("- ")
            || clean.Contains("\n- ")
            || clean.StartsWith("tôi là")
            || clean.StartsWith("xin chào! tôi là")
            || clean.StartsWith("xin chào, tôi là")
            || clean.StartsWith("chào bạn! tôi là");
    }

    [HttpGet("history/{sessionId}")]
    public async Task<IActionResult> GetVisitorHistory(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
        {
            return Ok(new List<object>());
        }

        var messages = await _db.ChatMessages
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new
            {
                role = m.Role,
                content = m.Content
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpGet("sessions")]
    [Authorize]
    public async Task<IActionResult> GetSessions()
    {
        var sessions = await _db.ChatSessions
            .OrderByDescending(s => s.LastMessageAt)
            .ToListAsync();
        return Ok(sessions);
    }

    [HttpGet("sessions/{id}/messages")]
    [Authorize]
    public async Task<IActionResult> GetSessionMessages(string id)
    {
        var messages = await _db.ChatMessages
            .Where(m => m.SessionId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
        return Ok(messages);
    }
}
