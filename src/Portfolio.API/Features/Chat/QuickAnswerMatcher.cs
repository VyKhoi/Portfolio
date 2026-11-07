using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Portfolio.API.Data;

namespace Portfolio.API.Features.Chat;

/// <summary>
/// Answers instantly only when the whole message is a known question, so anything longer reaches the model.
/// Reply templates take their values from the assistant facts, which keeps every fact in one place.
/// </summary>
public partial class QuickAnswerMatcher
{
    private const string AnyLanguage = "any";

    private readonly Dictionary<string, (QuickAnswer Answer, string Language)> _patterns = new();
    private readonly List<string> _prefixes;
    private readonly List<string> _suffixes;
    private readonly PortfolioDbContext _db;

    public QuickAnswerMatcher(ChatAssets assets, PortfolioDbContext db)
    {
        _db = db;
        _prefixes = assets.QuickAnswers.Prefixes.Select(Normalize).OrderByDescending(p => p.Length).ToList();
        _suffixes = assets.QuickAnswers.Suffixes.Select(Normalize).OrderByDescending(s => s.Length).ToList();

        foreach (var answer in assets.QuickAnswers.Answers)
        {
            foreach (var (language, patterns) in answer.Patterns)
            {
                foreach (var pattern in patterns)
                {
                    _patterns[Normalize(pattern)] = (answer, language);
                }
            }
        }
    }

    /// <summary>Returns the reply, or null when the model should answer.</summary>
    public async Task<string?> MatchAsync(string message, string pageLanguage, CancellationToken cancellationToken)
    {
        if (!_patterns.TryGetValue(Strip(Normalize(message)), out var match)) return null;

        var language = match.Language == AnyLanguage ? pageLanguage : match.Language;
        var facts = await _db.AssistantFacts.AsNoTracking().Where(f => f.Enabled).ToListAsync(cancellationToken);

        var missingFact = false;
        var reply = Placeholder().Replace(match.Answer.Replies[language], placeholder =>
        {
            var fact = facts.FirstOrDefault(f => f.Key == placeholder.Groups[1].Value);
            var value = language == ChatLanguage.Vietnamese ? fact?.ValueVi : fact?.ValueEn;
            missingFact |= string.IsNullOrWhiteSpace(value);
            return value ?? string.Empty;
        });
        return missingFact ? null : reply;
    }

    private string Strip(string text)
    {
        while (true)
        {
            var prefix = _prefixes.FirstOrDefault(p => text.StartsWith(p + " "));
            if (prefix != null)
            {
                text = text[(prefix.Length + 1)..];
                continue;
            }

            var suffix = _suffixes.FirstOrDefault(s => text.EndsWith(" " + s));
            if (suffix != null)
            {
                text = text[..^(suffix.Length + 1)];
                continue;
            }

            return text;
        }
    }

    public static string Normalize(string text)
    {
        var builder = new StringBuilder(text.Length);
        foreach (var c in text.ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            builder.Append(char.IsLetterOrDigit(c) ? c : ' ');
        }
        return string.Join(' ', builder.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    [GeneratedRegex(@"\{\{(\w+)\}\}")]
    private static partial Regex Placeholder();
}
