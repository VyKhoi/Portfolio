using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Portfolio.API.Entities;

namespace Portfolio.API.Services;

public class EmailService
{
    // Keeps a contact-form flood from exhausting the Gmail sending quota; extra messages still land in the inbox.
    private const int MaxEmailsPerDay = 30;
    private static readonly object CapLock = new();
    private static DateOnly _capDay;
    private static int _sentToday;

    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    private static bool TryReserveDailySlot()
    {
        lock (CapLock)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (_capDay != today)
            {
                _capDay = today;
                _sentToday = 0;
            }
            if (_sentToday >= MaxEmailsPerDay) return false;
            _sentToday++;
            return true;
        }
    }

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendContactNotificationAsync(ContactMessage contact)
    {
        var toEmail = _config["Mail:ToEmail"] ?? "dangvykhoi@gmail.com";
        var fromEmail = _config["Mail:From"] ?? "dangvykhoi@gmail.com";
        var host = _config["Mail:Host"] ?? "smtp.gmail.com";
        var port = int.Parse(_config["Mail:Port"] ?? "587");
        var username = _config["Mail:Username"] ?? "dangvykhoi@gmail.com";
        var password = _config["Mail:Password"] ?? _config["MAIL_APP_PASSWORD"];

        if (!TryReserveDailySlot())
        {
            _logger.LogWarning("Daily contact email cap ({Cap}) reached; message {Id} is saved in the inbox but not emailed.",
                MaxEmailsPerDay, contact.Id);
            return;
        }

        // No visitor data in the email: Gmail's servers are abroad, and sending personal data there would need a
        // cross-border transfer assessment (Personal Data Protection Law 91/2025). The message is read in the admin inbox.
        // Same look as the site: black, one orange accent, square corners. Time shown in Vietnam time.
        var receivedVn = contact.CreatedAt.AddHours(7);
        var htmlTemplate = $@"
        <div style='font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; background-color: #050505; border: 1px solid #1f1f22; border-top: 3px solid #FF5C00;'>
            <div style='padding: 28px 28px 24px 28px;'>
                <p style='margin: 0 0 12px 0; font-family: Consolas, monospace; font-size: 12px; letter-spacing: 2px; color: #FF5C00;'>DANGVYKHOI.COM // HỘP THƯ</p>
                <h2 style='margin: 0 0 12px 0; font-size: 22px; color: #FFFFFF;'>Có tin liên hệ mới</h2>
                <p style='margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #8E8E93;'>Nhận lúc {receivedVn:HH:mm dd/MM/yyyy}. Nội dung chỉ xem trong trang quản trị.</p>
                <a href='https://dangvykhoi.com/dashboard/inbox' style='display: inline-block; background-color: #FF5C00; color: #000000; padding: 12px 20px; font-family: Consolas, monospace; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-decoration: none;'>MỞ HỘP THƯ →</a>
            </div>
        </div>";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Portfolio Notification", fromEmail));
        message.To.Add(new MailboxAddress("Khoi Dang", toEmail));
        message.Subject = "📬 [Portfolio] Có tin liên hệ mới";
        message.Body = new BodyBuilder { HtmlBody = htmlTemplate }.ToMessageBody();

        if (string.IsNullOrEmpty(password))
        {
            _logger.LogWarning("Mail password not configured. Skipping actual SMTP sending.");
            return;
        }

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Successfully sent contact email to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
        }
    }
}
