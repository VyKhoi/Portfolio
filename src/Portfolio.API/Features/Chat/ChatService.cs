using System.Diagnostics;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Portfolio.API.Data;
using Portfolio.API.Entities;

namespace Portfolio.API.Features.Chat;

public record ChatTurn(string? SessionId, string? Message, string? Language, string? WebsiteTrap, string ClientIp);

/// <summary>Where a reply goes. Tokens are the answer; notices are system messages that are never stored.</summary>
public interface IChatOutput
{
    Task TokenAsync(string text, CancellationToken cancellationToken);
    Task NoticeAsync(string text, CancellationToken cancellationToken);
}

public class ChatService
{
    public const string SourceQuick = "quick";
    public const string SourceModel = "model";

    private readonly PortfolioDbContext _db;
    private readonly ChatAssets _assets;
    private readonly ChatQuota _quota;
    private readonly QuickAnswerMatcher _quickAnswers;
    private readonly ChatPromptBuilder _prompt;
    private readonly ILlmClient _llm;
    private readonly GenerationGate _gate;
    private readonly ChatNotificationChannel _notifications;
    private readonly ChatOptions _options;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        PortfolioDbContext db,
        ChatAssets assets,
        ChatQuota quota,
        QuickAnswerMatcher quickAnswers,
        ChatPromptBuilder prompt,
        ILlmClient llm,
        GenerationGate gate,
        ChatNotificationChannel notifications,
        IOptions<ChatOptions> options,
        ILogger<ChatService> logger)
    {
        _db = db;
        _assets = assets;
        _quota = quota;
        _quickAnswers = quickAnswers;
        _prompt = prompt;
        _llm = llm;
        _gate = gate;
        _notifications = notifications;
        _options = options.Value;
        _logger = logger;
    }

    public async Task HandleAsync(ChatTurn turn, IChatOutput output, CancellationToken cancellationToken)
    {
        var language = ChatLanguage.Normalize(turn.Language);
        var message = turn.Message?.Trim() ?? string.Empty;

        // Bots fill the hidden field: answer politely and spend nothing on them
        var refusal = !string.IsNullOrEmpty(turn.WebsiteTrap) ? "honeypot"
            : message.Length == 0 ? "empty"
            : message.Length > _options.MaxMessageLength ? "tooLong"
            : !_quota.TryConsume(turn.ClientIp) ? "quota"
            : null;
        if (refusal != null)
        {
            await output.NoticeAsync(_assets.Reply(refusal, language), cancellationToken);
            return;
        }

        var sessionId = ChatSessionId.Normalize(turn.SessionId);
        var userMessage = await SaveUserMessageAsync(sessionId, message);
        var clock = Stopwatch.StartNew();

        var quick = await _quickAnswers.MatchAsync(message, language, cancellationToken);
        var result = quick != null
            ? await StreamQuickAsync(quick, output, clock, cancellationToken)
            : await StreamModelAsync(sessionId, userMessage, language, output, clock, cancellationToken);

        if (result.Text.Length == 0) return;

        await SaveReplyAsync(sessionId, result, clock.ElapsedMilliseconds);
        _notifications.Publish(new ChatNotification(sessionId, message, result.Text, result.Source));
        _logger.LogInformation("Chat reply source={Source} firstTokenMs={FirstTokenMs} totalMs={TotalMs}",
            result.Source, result.FirstTokenMs, clock.ElapsedMilliseconds);
    }

    private sealed record ReplyResult(string Text, string Source, int? FirstTokenMs);

    private async Task<ReplyResult> StreamQuickAsync(string reply, IChatOutput output, Stopwatch clock, CancellationToken cancellationToken)
    {
        var firstTokenMs = (int)clock.ElapsedMilliseconds;
        var words = reply.Split(' ');
        try
        {
            for (var i = 0; i < words.Length; i++)
            {
                await output.TokenAsync(i == 0 ? words[i] : " " + words[i], cancellationToken);
                await Task.Delay(_options.QuickReplyWordDelayMs, cancellationToken);
            }
        }
        catch (Exception ex) when (ex is OperationCanceledException or IOException)
        {
            _logger.LogInformation("Visitor left during a quick reply.");
        }
        return new ReplyResult(reply, SourceQuick, firstTokenMs);
    }

    private async Task<ReplyResult> StreamModelAsync(
        string sessionId, ChatMessage userMessage, string language, IChatOutput output, Stopwatch clock, CancellationToken cancellationToken)
    {
        var messages = await BuildMessagesAsync(sessionId, userMessage, language, cancellationToken);

        if (!await _gate.TryEnterAsync(cancellationToken))
        {
            await output.NoticeAsync(_assets.Reply("busy", language), cancellationToken);
            return new ReplyResult(string.Empty, SourceModel, null);
        }

        var reply = new StringBuilder();
        int? firstTokenMs = null;
        try
        {
            await foreach (var token in _llm.StreamAsync(messages, cancellationToken))
            {
                firstTokenMs ??= (int)clock.ElapsedMilliseconds;
                reply.Append(token);
                await output.TokenAsync(token, cancellationToken);
            }
        }
        catch (LlmUnavailableException ex)
        {
            _logger.LogError(ex, "Sigma Cat could not get a reply from the model.");
            await output.NoticeAsync(_assets.Reply("unavailable", language), cancellationToken);
            return new ReplyResult(string.Empty, SourceModel, null);
        }
        catch (Exception ex) when (ex is OperationCanceledException or IOException)
        {
            // The visitor left: keep whatever was generated so the admin log still shows the turn
            _logger.LogInformation("Visitor left during a reply.");
        }
        finally
        {
            _gate.Exit();
        }

        return new ReplyResult(reply.ToString().Trim(), SourceModel, firstTokenMs);
    }

    private async Task<List<LlmMessage>> BuildMessagesAsync(string sessionId, ChatMessage userMessage, string language, CancellationToken cancellationToken)
    {
        var history = await _db.ChatMessages.AsNoTracking()
            .Where(m => m.SessionId == sessionId && m.Id != userMessage.Id)
            .OrderByDescending(m => m.Id)
            .Take(_options.HistoryMessages)
            .OrderBy(m => m.Id)
            .Select(m => new LlmMessage(m.Role, m.Content))
            .ToListAsync(cancellationToken);

        var messages = new List<LlmMessage> { new("system", await _prompt.BuildAsync(cancellationToken)) };
        messages.AddRange(history);
        // The page language goes last so the long system prompt stays identical and cached
        messages.Add(new LlmMessage("user", $"{userMessage.Content}\n\n[page language: {language}]"));
        return messages;
    }

    private async Task<ChatMessage> SaveUserMessageAsync(string sessionId, string text)
    {
        var now = DateTime.UtcNow;
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        if (session == null)
        {
            _db.ChatSessions.Add(new ChatSession { SessionId = sessionId, StartedAt = now, LastMessageAt = now });
        }
        else
        {
            session.LastMessageAt = now;
        }

        var message = new ChatMessage { SessionId = sessionId, Role = "user", Content = text, CreatedAt = now };
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();
        return message;
    }

    private async Task SaveReplyAsync(string sessionId, ReplyResult result, long totalMs)
    {
        _db.ChatMessages.Add(new ChatMessage
        {
            SessionId = sessionId,
            Role = "assistant",
            Content = result.Text,
            Source = result.Source,
            FirstTokenMs = result.FirstTokenMs,
            TotalMs = (int)totalMs,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }
}
