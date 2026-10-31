using System;
using System.Net;
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

        // Visitor input goes into HTML: encode it so it renders as text
        var name = WebUtility.HtmlEncode(contact.Name);
        var email = WebUtility.HtmlEncode(contact.Email);
        var subject = WebUtility.HtmlEncode(contact.Subject);
        var body = WebUtility.HtmlEncode(contact.Message);

        var htmlTemplate = $@"
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
            <div style='background-color: #0A0A0C; color: #DEFF9A; padding: 20px; text-align: center; border-bottom: 2px solid #27272A;'>
                <h2 style='margin: 0;'>🚀 New Portfolio Contact Request</h2>
                <p style='margin: 5px 0 0 0; color: #A1A1AA;'>Bạn có tin nhắn mới từ trang web Portfolio cá nhân!</p>
            </div>
            <div style='padding: 20px; background-color: #121215; color: #FFFFFF;'>
                <table style='width: 100%; border-collapse: collapse;'>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; font-weight: bold; width: 100px; color: #DEFF9A;'>Họ tên:</td>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; color: #FFFFFF;'>{name}</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; font-weight: bold; color: #DEFF9A;'>Email:</td>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; color: #00E5FF;'><a href='mailto:{email}' style='color: #00E5FF; text-decoration: none;'>{email}</a></td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; font-weight: bold; color: #DEFF9A;'>Chủ đề:</td>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; color: #FFFFFF;'>{subject}</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; font-weight: bold; vertical-align: top; color: #DEFF9A;'>Tin nhắn:</td>
                        <td style='padding: 10px; color: #FFFFFF; white-space: pre-wrap; background-color: #18181C; border-radius: 6px; border: 1px solid #27272A;'>{body}</td>
                    </tr>
                </table>
            </div>
            <div style='background-color: #0A0A0C; padding: 15px; text-align: center; font-size: 12px; color: #71717A;'>
                <p style='margin: 0;'>Thời gian nhận: {contact.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC</p>
                <p style='margin: 5px 0 0 0;'>Tin nhắn tự động từ Portfolio Backend .NET 9.</p>
            </div>
        </div>";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Portfolio Notification", fromEmail));
        message.To.Add(new MailboxAddress("Khoi Dang", toEmail));
        message.Subject = $"🎉 [Portfolio Contact] {contact.Name} vừa liên hệ!";
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
