using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Portfolio.API.Data;

namespace Portfolio.API.Features.Chat;

/// <summary>
/// Builds the system prompt from the persona file and the live database, so an edit in the admin console
/// reaches Sigma Cat on the next message. Facts are in English because Vietnamese costs far more tokens; the
/// model answers in the visitor's language. The text must not change between messages, otherwise Ollama
/// cannot reuse its prompt cache.
/// </summary>
public class ChatPromptBuilder
{
    public const string FactsHeading = "# Facts";

    private readonly PortfolioDbContext _db;
    private readonly ChatAssets _assets;
    private readonly ChatOptions _options;

    public ChatPromptBuilder(PortfolioDbContext db, ChatAssets assets, IOptions<ChatOptions> options)
    {
        _db = db;
        _assets = assets;
        _options = options.Value;
    }

    public async Task<string> BuildAsync(CancellationToken cancellationToken)
    {
        var profile = await _db.Profiles.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        var facts = await _db.AssistantFacts.AsNoTracking().Where(f => f.Enabled).OrderBy(f => f.Order).ToListAsync(cancellationToken);
        var jobs = await _db.Experiences.AsNoTracking().OrderBy(e => e.Order).ToListAsync(cancellationToken);
        var skills = await _db.Skills.AsNoTracking().OrderBy(s => s.Order).Select(s => s.Name).ToListAsync(cancellationToken);

        var prompt = new StringBuilder(_assets.Persona).Append("\n\n").Append(FactsHeading).Append('\n');

        foreach (var fact in facts)
        {
            prompt.Append("- ").Append(fact.Label).Append(": ").Append(First(fact.ValueEn, fact.ValueVi)).Append('\n');
        }

        if (profile != null)
        {
            prompt.Append("- Job title: ").Append(First(profile.TitleEn, profile.Title)).Append('\n');
            prompt.Append("- GitHub: ").Append(profile.GithubLink).Append('\n');
            prompt.Append("- LinkedIn: ").Append(profile.LinkedinLink).Append('\n');
        }

        if (skills.Count > 0)
        {
            prompt.Append("- Skills: ").AppendJoin(", ", skills).Append('\n');
        }

        foreach (var job in jobs)
        {
            prompt.Append("- Work: ")
                .Append(First(job.PeriodEn, job.Period)).Append(", ")
                .Append(First(job.RoleEn, job.Role)).Append(", ")
                .Append(First(job.CompanyEn, job.Company));

            var project = First(job.ProjectNameEn, job.ProjectName);
            if (project.Length > 0) prompt.Append(", ").Append(project);
            if (job.TechStack.Count > 0) prompt.Append(". Tech: ").AppendJoin(", ", job.TechStack);

            // Without the details the model has nothing concrete to say about the work
            var highlights = job.HighlightsEn.Count > 0 ? job.HighlightsEn : job.Highlights;
            foreach (var highlight in highlights.Take(_options.MaxHighlightsPerJob))
            {
                prompt.Append(' ').Append(highlight);
            }
            prompt.Append('\n');
        }

        return prompt.ToString().TrimEnd();
    }

    private static string First(string preferred, string fallback)
        => string.IsNullOrWhiteSpace(preferred) ? fallback : preferred;
}
