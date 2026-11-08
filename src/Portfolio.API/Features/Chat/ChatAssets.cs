using System.Text.Json;
using Microsoft.Extensions.Options;

namespace Portfolio.API.Features.Chat;

/// <summary>The persona and the system notices live in src/Portfolio.AI, copied next to the app at build time.</summary>
public class ChatAssets
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private readonly Dictionary<string, Dictionary<string, string>> _replies;

    public ChatAssets(IOptions<ChatOptions> options)
    {
        var folder = Path.Combine(AppContext.BaseDirectory, options.Value.AssetsPath);
        Persona = File.ReadAllText(Path.Combine(folder, "persona.md")).Trim();
        _replies = Read<Dictionary<string, Dictionary<string, string>>>(Path.Combine(folder, "replies.json"));
    }

    public string Persona { get; }

    public string Reply(string key, string language) => _replies[key][language];

    private static T Read<T>(string path)
        => JsonSerializer.Deserialize<T>(File.ReadAllText(path), Json)
           ?? throw new InvalidOperationException($"{path} is empty.");
}
