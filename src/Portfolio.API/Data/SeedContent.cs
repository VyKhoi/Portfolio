using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using Portfolio.API.Entities;

namespace Portfolio.API.Data;

/// <summary>Reads the frontend's content files (embedded at build) to fill empty tables.</summary>
public static class SeedContent
{
    private static JsonNode Read(string name)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(name)
            ?? throw new InvalidOperationException($"Missing embedded resource {name}");
        return JsonNode.Parse(stream) ?? throw new InvalidOperationException($"Empty resource {name}");
    }

    public static IEnumerable<Project> Projects()
    {
        var order = 0;
        foreach (var node in Read("seed.projects.json").AsArray())
        {
            var obj = node!.AsObject();
            var slug = obj["slug"]!.GetValue<string>();
            obj.Remove("slug");
            yield return new Project { Slug = slug, Order = ++order, Content = obj.ToJsonString() };
        }
    }

    public static IEnumerable<NowItem> NowItems()
    {
        var now = Read("seed.portfolio.json")["now"];
        if (now?["items"] is not JsonArray items) yield break;
        var updated = DateTime.TryParse(now["updated"]?.GetValue<string>(), out var d)
            ? DateTime.SpecifyKind(d, DateTimeKind.Utc)
            : DateTime.UtcNow;
        var order = 0;
        foreach (var item in items)
        {
            yield return new NowItem
            {
                Label = item!["label"]?.GetValue<string>() ?? "",
                LabelEn = item["labelEn"]?.GetValue<string>() ?? "",
                Text = item["text"]?.GetValue<string>() ?? "",
                TextEn = item["textEn"]?.GetValue<string>() ?? "",
                Order = ++order,
                UpdatedAt = updated,
            };
        }
    }
}
