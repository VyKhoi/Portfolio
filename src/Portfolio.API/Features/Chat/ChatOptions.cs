namespace Portfolio.API.Features.Chat;

public class ChatOptions
{
    public const string Section = "Chat";

    public string AssetsPath { get; set; } = "ai";
    public int MaxMessageLength { get; set; } = 350;
    public int HistoryMessages { get; set; } = 4;
    public int QuotaMessages { get; set; } = 15;
    public int QuotaWindowMinutes { get; set; } = 10;
    public int MaxConcurrentGenerations { get; set; } = 2;
    public int GenerationWaitSeconds { get; set; } = 15;
    public int QuickReplyWordDelayMs { get; set; } = 20;
    public int MaxHighlightsPerJob { get; set; } = 2;
}

public class OllamaOptions
{
    public const string Section = "Ollama";

    public string BaseUrl { get; set; } = "http://localhost:11434";
    public string Model { get; set; } = "qwen3.5:4b";
    public string KeepAlive { get; set; } = "-1m";
    public int FirstByteTimeoutSeconds { get; set; } = 90;
    public double Temperature { get; set; } = 0.3;
    public double TopP { get; set; } = 0.9;
    public int TopK { get; set; } = 40;
    public double RepeatPenalty { get; set; } = 1.05;
    public int NumPredict { get; set; } = 120;
    public int NumCtx { get; set; } = 4096;
    public int NumThread { get; set; } = 4;
}
