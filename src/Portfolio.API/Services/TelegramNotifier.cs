using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Portfolio.API.Services;

public class TelegramNotifier
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<TelegramNotifier> _logger;

    public TelegramNotifier(HttpClient httpClient, IConfiguration config, ILogger<TelegramNotifier> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task SendMessageAsync(string text)
    {
        var botToken = _config["TELEGRAM_BOT_TOKEN"] ?? _config["Telegram:BotToken"];
        var chatId = _config["TELEGRAM_CHAT_ID"] ?? _config["Telegram:ChatId"];

        if (string.IsNullOrEmpty(botToken) || string.IsNullOrEmpty(chatId))
        {
            _logger.LogDebug("Telegram token or chatId not configured. Skipping alert.");
            return;
        }

        try
        {
            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var payload = new { chat_id = chatId, text = text, parse_mode = "Markdown" };
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
}
