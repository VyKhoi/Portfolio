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
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

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
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; color: #FFFFFF;'>{contact.Name}</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; font-weight: bold; color: #DEFF9A;'>Email:</td>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; color: #00E5FF;'><a href='mailto:{contact.Email}' style='color: #00E5FF; text-decoration: none;'>{contact.Email}</a></td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; font-weight: bold; color: #DEFF9A;'>Chủ đề:</td>
                        <td style='padding: 10px; border-bottom: 1px solid #27272A; color: #FFFFFF;'>{contact.Subject}</td>
                    </tr>
                    <tr>
                        <td style='padding: 10px; font-weight: bold; vertical-align: top; color: #DEFF9A;'>Tin nhắn:</td>
                        <td style='padding: 10px; color: #FFFFFF; white-space: pre-wrap; background-color: #18181C; border-radius: 6px; border: 1px solid #27272A;'>{contact.Message}</td>
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
