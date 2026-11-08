using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Portfolio.API.Data;
using Portfolio.API.Entities;
using Portfolio.API.Features.Chat;
using Xunit;

namespace Portfolio.API.Tests;

public class ChatServiceTests
{
    private const string SessionId = "11111111-2222-3333-4444-555555555555";

    private sealed class FakeLlm : ILlmClient
    {
        public List<IReadOnlyList<LlmMessage>> Calls { get; } = new();
        public string[] Tokens { get; set; } = { "Hello", " there" };
        public Exception? Failure { get; set; }

        public async IAsyncEnumerable<string> StreamAsync(
            IReadOnlyList<LlmMessage> messages,
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            Calls.Add(messages);
            await Task.Yield();
            if (Failure != null) throw Failure;
            foreach (var token in Tokens) yield return token;
        }

        public Task WarmUpAsync(string systemPrompt, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class RecordingOutput : IChatOutput
    {
        public string Tokens { get; private set; } = string.Empty;
        public List<string> Notices { get; } = new();

        public Task TokenAsync(string text, CancellationToken cancellationToken)
        {
            Tokens += text;
            return Task.CompletedTask;
        }

        public Task NoticeAsync(string text, CancellationToken cancellationToken)
        {
            Notices.Add(text);
            return Task.CompletedTask;
        }
    }

    private sealed class Harness
    {
        public PortfolioDbContext Db { get; }
        public FakeLlm Llm { get; } = new();
        public RecordingOutput Output { get; } = new();
        public ChatAssets Assets { get; }
        public ChatNotificationChannel Notifications { get; } = new();
        public ChatService Service { get; }

        public Harness(ChatOptions? chatOptions = null)
        {
            var options = Options.Create(chatOptions ?? new ChatOptions());
            Db = new PortfolioDbContext(new DbContextOptionsBuilder<PortfolioDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);
            Db.AssistantFacts.AddRange(
                new AssistantFact { Key = "email", Label = "Email", ValueVi = "a@b.c", ValueEn = "a@b.c", Order = 1 },
                new AssistantFact { Key = "phone", Label = "Phone", ValueVi = "0123", ValueEn = "0123", Order = 2 },
                new AssistantFact { Key = "hidden", Label = "Secret", ValueVi = "x", ValueEn = "hidden value", Order = 3, Enabled = false });
            Db.Profiles.Add(new Profile { Title = "Kỹ sư", TitleEn = "Engineer", GithubLink = "gh", LinkedinLink = "li" });
            Db.Skills.Add(new Skill { Name = "C#", Order = 1 });
            Db.Experiences.Add(new Experience
            {
                Role = "Dev",
                Company = "Team độc lập",
                CompanyEn = "Independent Team",
                Period = "2024",
                HighlightsEn = new() { "First", "Second", "Third", "Fourth" },
                Order = 1,
            });
            Db.SaveChanges();

            Assets = new ChatAssets(options);
            Service = new ChatService(
                Db,
                Assets,
                new ChatQuota(new MemoryCache(new MemoryCacheOptions()), options),
                new ChatPromptBuilder(Db, Assets, options),
                Llm,
                new GenerationGate(options),
                Notifications,
                options,
                NullLogger<ChatService>.Instance);
        }

        public Task SendAsync(string message, string language = "en", string? trap = null)
            => Service.HandleAsync(new ChatTurn(SessionId, message, language, trap, "1.1.1.1"), Output, CancellationToken.None);
    }

    [Fact]
    public async Task Model_reply_is_streamed_and_stored_with_timing()
    {
        var harness = new Harness();

        await harness.SendAsync("Does Khoi like long walks on the beach?");

        Assert.Equal("Hello there", harness.Output.Tokens);
        var reply = await harness.Db.ChatMessages.SingleAsync(m => m.Role == "assistant");
        Assert.Equal("Hello there", reply.Content);
        Assert.Equal(ChatService.SourceModel, reply.Source);
        Assert.NotNull(reply.TotalMs);
    }

    [Fact]
    public async Task Failed_model_shows_a_notice_in_the_page_language_and_stores_no_reply()
    {
        var harness = new Harness();
        harness.Llm.Failure = new LlmUnavailableException("down");

        await harness.SendAsync("Does he surf?", "vi");

        Assert.Equal(harness.Assets.Reply("unavailable", "vi"), Assert.Single(harness.Output.Notices));
        Assert.False(await harness.Db.ChatMessages.AnyAsync(m => m.Role == "assistant"));
    }

    [Fact]
    public async Task Honeypot_is_answered_without_saving_or_calling_the_model()
    {
        var harness = new Harness();

        await harness.SendAsync("buy pills", trap: "filled");

        Assert.Single(harness.Output.Notices);
        Assert.Empty(harness.Llm.Calls);
        Assert.False(await harness.Db.ChatMessages.AnyAsync());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Empty_message_is_refused(string message)
    {
        var harness = new Harness();

        await harness.SendAsync(message);

        Assert.Equal(harness.Assets.Reply("empty", "en"), Assert.Single(harness.Output.Notices));
    }

    [Fact]
    public async Task Message_over_the_limit_is_refused()
    {
        var harness = new Harness();

        await harness.SendAsync(new string('x', 351));

        Assert.Equal(harness.Assets.Reply("tooLong", "en"), Assert.Single(harness.Output.Notices));
        Assert.Empty(harness.Llm.Calls);
    }

    [Fact]
    public async Task Quota_stops_a_visitor_even_with_new_sessions()
    {
        var harness = new Harness(new ChatOptions { QuotaMessages = 1 });

        await harness.Service.HandleAsync(new ChatTurn("session-one", "a question", "en", null, "9.9.9.9"), harness.Output, default);
        await harness.Service.HandleAsync(new ChatTurn("session-two", "a question", "en", null, "9.9.9.9"), harness.Output, default);

        Assert.Equal(harness.Assets.Reply("quota", "en"), Assert.Single(harness.Output.Notices));
        Assert.Single(harness.Llm.Calls);
    }

    [Fact]
    public async Task Model_gets_the_prompt_and_recent_history()
    {
        var harness = new Harness(new ChatOptions { HistoryMessages = 2 });
        await harness.SendAsync("first question here");
        await harness.SendAsync("second question here");
        await harness.SendAsync("third question here");

        var messages = harness.Llm.Calls.Last();

        Assert.Equal("system", messages[0].Role);
        Assert.Equal(new[] { "second question here", "Hello there" }, messages.Skip(1).Take(2).Select(m => m.Content));
        Assert.Equal("third question here\n\n" + harness.Assets.Reply("replyLanguage", "en"), messages.Last().Content);
    }

    [Fact]
    public async Task Prompt_uses_enabled_facts_and_english_values_and_is_stable()
    {
        var harness = new Harness();
        var builder = new ChatPromptBuilder(harness.Db, harness.Assets, Options.Create(new ChatOptions()));

        var first = await builder.BuildAsync(CancellationToken.None);
        var second = await builder.BuildAsync(CancellationToken.None);

        Assert.Equal(first, second);
        Assert.StartsWith(harness.Assets.Persona, first);
        Assert.Contains("- Email: a@b.c", first);
        Assert.Contains("Dev at Independent Team", first);
        Assert.Contains("First Second Third", first);
        Assert.DoesNotContain("Fourth", first);
        Assert.DoesNotContain("hidden value", first);
    }

    [Fact]
    public async Task Fact_edit_reaches_the_next_prompt()
    {
        var harness = new Harness();
        var builder = new ChatPromptBuilder(harness.Db, harness.Assets, Options.Create(new ChatOptions()));

        var fact = await harness.Db.AssistantFacts.SingleAsync(f => f.Key == "email");
        fact.ValueEn = "new@mail.com";
        await harness.Db.SaveChangesAsync();

        Assert.Contains("new@mail.com", await builder.BuildAsync(CancellationToken.None));
    }

    [Fact]
    public async Task Finished_turn_publishes_one_notification()
    {
        var harness = new Harness();

        await harness.SendAsync("Does he surf?");

        Assert.True(harness.Notifications.Reader.TryRead(out var turn));
        Assert.Equal("Does he surf?", turn.Question);
        Assert.False(harness.Notifications.Reader.TryRead(out _));
    }

    [Theory]
    [InlineData("Liên hệ thế nào vậy em?")]
    [InlineData("hello")]
    [InlineData("Who is Khoi?")]
    public async Task Every_question_is_answered_by_the_model(string message)
    {
        var harness = new Harness();

        await harness.SendAsync(message);

        Assert.Single(harness.Llm.Calls);
        Assert.Equal("Hello there", harness.Output.Tokens);
    }

    [Theory]
    [InlineData("Anh Khôi học trường nào?", "en", "vi")]
    [InlineData("đi đâu", "en", "vi")]
    [InlineData("Where did he study?", "en", "en")]
    [InlineData("khoi hoc truong nao", "vi", "vi")]
    public void Reply_language_follows_vietnamese_marks_then_the_page(string message, string page, string expected)
        => Assert.Equal(expected, ChatLanguage.ForReply(message, page));

    [Theory]
    [InlineData("11111111-2222", true)]
    [InlineData("short", false)]
    [InlineData("has spaces in it", false)]
    public void Session_ids_are_validated(string id, bool valid)
        => Assert.Equal(valid, ChatSessionId.IsValid(id));
}
