using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Portfolio.API.Services;

public class TelegramNotifier
{
    // A chat flood would otherwise turn into hundreds of phone notifications.
    private const int MaxMessagesPerHour = 30;
    private static readonly object ThrottleLock = new();
    private static DateTime _windowStart = DateTime.MinValue;
    private static int _sentInWindow;

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<TelegramNotifier> _logger;

    public TelegramNotifier(HttpClient httpClient, IConfiguration config, ILogger<TelegramNotifier> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    /// <summary>Escapes visitor/AI text for Telegram's HTML parse mode.</summary>
    public static string Escape(string? text) => WebUtility.HtmlEncode(text ?? string.Empty);

    /// <summary>Sends an HTML-formatted message; dynamic parts must go through <see cref="Escape"/>.</summary>
    public async Task SendMessageAsync(string html)
    {
        var botToken = _config["TELEGRAM_BOT_TOKEN"] ?? _config["Telegram:BotToken"];
        var chatId = _config["TELEGRAM_CHAT_ID"] ?? _config["Telegram:ChatId"];

        if (string.IsNullOrEmpty(botToken) || string.IsNullOrEmpty(chatId))
        {
            _logger.LogDebug("Telegram token or chatId not configured. Skipping alert.");
            return;
        }

        var slot = ReserveSlot();
        if (slot == ThrottleResult.Drop) return;
        if (slot == ThrottleResult.LastBeforeMute)
        {
            html += $"\n\n⏸️ <i>Đã đạt {MaxMessagesPerHour} thông báo/giờ — tạm ngưng thông báo tới hết giờ (tin vẫn được lưu trong admin).</i>";
        }

        try
        {
            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var payload = new { chat_id = chatId, text = html, parse_mode = "HTML" };
            var response = await _httpClient.PostAsJsonAsync(url, payload);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Telegram API error: {Error}", error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Telegram notification.");
        }
    }

    private enum ThrottleResult { Send, LastBeforeMute, Drop }

    private static ThrottleResult ReserveSlot()
    {
        lock (ThrottleLock)
        {
            var now = DateTime.UtcNow;
            if (now - _windowStart >= TimeSpan.FromHours(1))
            {
                _windowStart = now;
                _sentInWindow = 0;
            }
            if (_sentInWindow >= MaxMessagesPerHour) return ThrottleResult.Drop;
            _sentInWindow++;
            return _sentInWindow == MaxMessagesPerHour ? ThrottleResult.LastBeforeMute : ThrottleResult.Send;
        }
    }
}
