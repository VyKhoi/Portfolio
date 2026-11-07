using System.Text.Json;
using Microsoft.Extensions.Options;

namespace Portfolio.API.Features.Chat;

public record QuickAnswer(string Id, Dictionary<string, List<string>> Patterns, Dictionary<string, string> Replies);

public record QuickAnswerFile(List<string> Prefixes, List<string> Suffixes, List<QuickAnswer> Answers);

/// <summary>The persona and every fixed sentence live in src/Portfolio.AI, copied next to the app at build time.</summary>
public class ChatAssets
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private readonly Dictionary<string, Dictionary<string, string>> _replies;

    public ChatAssets(IOptions<ChatOptions> options)
    {
        var folder = Path.Combine(AppContext.BaseDirectory, options.Value.AssetsPath);
        Persona = File.ReadAllText(Path.Combine(folder, "persona.md")).Trim();
        _replies = Read<Dictionary<string, Dictionary<string, string>>>(Path.Combine(folder, "replies.json"));
        QuickAnswers = Read<QuickAnswerFile>(Path.Combine(folder, "quick-answers.json"));
    }

    public string Persona { get; }

    public QuickAnswerFile QuickAnswers { get; }

    public string Reply(string key, string language) => _replies[key][language];

    private static T Read<T>(string path)
        => JsonSerializer.Deserialize<T>(File.ReadAllText(path), Json)
           ?? throw new InvalidOperationException($"{path} is empty.");
}
