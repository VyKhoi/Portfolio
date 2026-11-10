using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Portfolio.API.Controllers;

/// <summary>
/// What the admin console may send for each kind of content, and the checks it must pass.
/// Every check returns a Vietnamese message the console shows as is (the console is Khoi's, in Vietnamese).
/// </summary>
public static partial class ContentRules
{
    /// <summary>The skill groups the site knows how to title in both languages (lib/i18n.ts skillCategories).</summary>
    public static readonly string[] SkillCategories = ["Backend & Core", "Architecture & Sec", "Databases", "Frontend", "DevOps & Cloud"];

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    [GeneratedRegex(@"^\d{4}$")]
    private static partial Regex YearPattern();

    [GeneratedRegex(@"^/projects/[a-z0-9-]+\.(webp|jpg)(\?v=\d+)?$")]
    private static partial Regex ImagePattern();

    public static string? Text(string? value, string field, int max, bool required = true)
    {
        var length = value?.Trim().Length ?? 0;
        if (required && length == 0) return $"Thiếu {field}.";
        if (length > max) return $"{field} dài quá {max} ký tự.";
        return null;
    }

    public static string? Link(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (value.Length > 200 || !Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            return $"{field} phải là link https://.";
        return null;
    }

    public static string? List(List<string>? items, string field, int maxItems, int maxLength)
    {
        if (items == null) return null;
        if (items.Count > maxItems) return $"{field} tối đa {maxItems} dòng.";
        return items.Any(i => i.Trim().Length > maxLength) ? $"Mỗi dòng {field} tối đa {maxLength} ký tự." : null;
    }

    public static List<string> Clean(List<string>? items)
        => items?.Select(i => i.Trim()).Where(i => i.Length > 0).ToList() ?? new();

    public static string? First(params string?[] errors) => errors.FirstOrDefault(e => e != null);

    public static bool IsYear(string? value) => value != null && YearPattern().IsMatch(value);

    public static bool IsImage(string? value) => value != null && !value.Contains("..") && ImagePattern().IsMatch(value);
}

public record ProfileRequest(string FullName, string Title, string? TitleEn, string Bio, string? BioEn, string? GithubLink, string? LinkedinLink)
{
    public string? Validate() => ContentRules.First(
        ContentRules.Text(FullName, "Họ tên", 80),
        ContentRules.Text(Title, "Chức danh", 120),
        ContentRules.Text(TitleEn, "Chức danh (EN)", 120, required: false),
        ContentRules.Text(Bio, "Giới thiệu", 600),
        ContentRules.Text(BioEn, "Giới thiệu (EN)", 600, required: false),
        ContentRules.Link(GithubLink, "GitHub"),
        ContentRules.Link(LinkedinLink, "LinkedIn"));
}

public record SkillRequest(string Name, string Category)
{
    public string? Validate() => ContentRules.First(
        ContentRules.Text(Name, "Tên kỹ năng", 60),
        ContentRules.SkillCategories.Contains(Category) ? null : "Nhóm kỹ năng không hợp lệ.");
}

public record ExperienceRequest(
    string Role, string? RoleEn,
    string Company, string? CompanyEn,
    string Period, string? PeriodEn,
    string? ProjectName, string? ProjectNameEn,
    List<string>? Highlights, List<string>? HighlightsEn,
    List<string>? TechStack)
{
    public string? Validate() => ContentRules.First(
        ContentRules.Text(Role, "Vị trí", 100),
        ContentRules.Text(RoleEn, "Vị trí (EN)", 100, required: false),
        ContentRules.Text(Company, "Công ty", 100),
        ContentRules.Text(CompanyEn, "Công ty (EN)", 100, required: false),
        ContentRules.Text(Period, "Thời gian", 40),
        ContentRules.Text(PeriodEn, "Thời gian (EN)", 40, required: false),
        ContentRules.Text(ProjectName, "Tên dự án", 100, required: false),
        ContentRules.Text(ProjectNameEn, "Tên dự án (EN)", 100, required: false),
        ContentRules.List(Highlights, "ý chính", 8, 300),
        ContentRules.List(HighlightsEn, "ý chính (EN)", 8, 300),
        ContentRules.List(TechStack, "công nghệ", 12, 30));
}

public record OrderRequest(List<Guid> Ids);

public record NowItemRequest(string Label, string? LabelEn, string Text, string? TextEn);

public record NowRequest(List<NowItemRequest> Items)
{
    public string? Validate()
    {
        if (Items == null || Items.Count == 0) return "Cần ít nhất 1 dòng.";
        if (Items.Count > 6) return "Tối đa 6 dòng.";
        return ContentRules.First(Items.SelectMany(i => new[]
        {
            ContentRules.Text(i.Label, "Nhãn", 30),
            ContentRules.Text(i.LabelEn, "Nhãn (EN)", 30, required: false),
            ContentRules.Text(i.Text, "Nội dung", 160),
            ContentRules.Text(i.TextEn, "Nội dung (EN)", 160, required: false),
        }).ToArray());
    }
}

// ─── Projects: the exact shape of src/Web/frontend/src/content/projects.json (minus the slug) ───

public record LangPair(string En, string Vi);

public record ProjectSection(string Title, string? Text, List<string>? Points);

public record ProjectCopy(
    string Name, string Kind, string Summary, string Tagline, string Role, string LinkLabel,
    List<ProjectSection> Sections, string SeoTitle, string SeoDescription, string ImageAlt)
{
    public string? Validate(string lang)
    {
        var tag = lang == "en" ? " (EN)" : "";
        if (Sections == null || Sections.Count is < 1 or > 6) return $"Cần 1 đến 6 mục{tag}.";
        return ContentRules.First(new[]
        {
            ContentRules.Text(Name, "Tên" + tag, 60),
            ContentRules.Text(Kind, "Loại" + tag, 40),
            ContentRules.Text(Summary, "Tóm tắt" + tag, 220),
            ContentRules.Text(Tagline, "Câu giới thiệu" + tag, 200),
            ContentRules.Text(Role, "Phần tôi làm" + tag, 200),
            ContentRules.Text(LinkLabel, "Chữ trên nút" + tag, 40),
            ContentRules.Text(SeoTitle, "Tiêu đề Google" + tag, 80),
            ContentRules.Text(SeoDescription, "Mô tả Google" + tag, 200),
            ContentRules.Text(ImageAlt, "Mô tả ảnh" + tag, 160),
        }.Concat(Sections.SelectMany(s => new[]
        {
            ContentRules.Text(s.Title, "Tên mục" + tag, 60),
            ContentRules.Text(s.Text, "Đoạn văn" + tag, 1200, required: false),
            ContentRules.List(s.Points, "ý" + tag, 8, 300),
            string.IsNullOrWhiteSpace(s.Text) && ContentRules.Clean(s.Points).Count == 0 ? $"Mục \"{s.Title}\"{tag} đang trống." : null,
        })).ToArray());
    }

    public ProjectCopy Cleaned() => this with
    {
        Sections = Sections.Select(s => new ProjectSection(
            s.Title.Trim(),
            string.IsNullOrWhiteSpace(s.Text) ? null : s.Text.Trim(),
            ContentRules.Clean(s.Points) is { Count: > 0 } points ? points : null)).ToList(),
    };
}

public record ProjectRequest(
    string Year, LangPair Url, LangPair Image, LangPair Thumb, LangPair OgImage, string SchemaType,
    Dictionary<string, ProjectCopy> Copy)
{
    public string? Validate()
    {
        if (!ContentRules.IsYear(Year)) return "Năm phải có 4 chữ số.";
        if (SchemaType is not ("WebApplication" or "WebSite")) return "Loại sản phẩm không hợp lệ.";
        if (Url == null || Image == null || Thumb == null || OgImage == null) return "Thiếu link hoặc ảnh.";
        var linkError = ContentRules.First(ContentRules.Link(Url.En, "Link (EN)"), ContentRules.Link(Url.Vi, "Link"));
        if (linkError != null || string.IsNullOrWhiteSpace(Url.En) || string.IsNullOrWhiteSpace(Url.Vi)) return linkError ?? "Thiếu link.";
        if (new[] { Image.En, Image.Vi, Thumb.En, Thumb.Vi, OgImage.En, OgImage.Vi }.Any(i => !ContentRules.IsImage(i)))
            return "Ảnh phải là file có sẵn trong /projects/.";
        if (Copy == null || !Copy.TryGetValue("en", out var en) || !Copy.TryGetValue("vi", out var vi))
            return "Cần đủ chữ tiếng Việt và tiếng Anh.";
        return en.Validate("en") ?? vi.Validate("vi");
    }

    public ProjectRequest Cleaned() => this with
    {
        Copy = new Dictionary<string, ProjectCopy> { ["en"] = Copy["en"].Cleaned(), ["vi"] = Copy["vi"].Cleaned() },
    };
}
