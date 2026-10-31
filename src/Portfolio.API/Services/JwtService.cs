using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Portfolio.API.Entities;

namespace Portfolio.API.Services;

public class JwtService
{
    public const string PasswordStampClaim = "pwd_ver";
    private const int MinSecretLength = 32;

    private readonly IConfiguration _config;
    private readonly string _secret;

    public JwtService(IConfiguration config)
    {
        _config = config;
        _secret = GetValidatedSecret(config);
    }

    /// <summary>
    /// Returns JwtSettings:Secret or throws when it is missing: the app must not start and silently
    /// sign tokens with a value that is public in the repository. A short secret only logs a warning,
    /// so an existing deployment keeps working while the secret is rotated.
    /// </summary>
    public static string GetValidatedSecret(IConfiguration config)
    {
        var secret = config["JwtSettings:Secret"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException("JwtSettings:Secret is not configured.");
        }
        if (secret.Length < MinSecretLength)
        {
            Serilog.Log.Warning("JwtSettings:Secret is shorter than {Min} characters; rotate it to a longer random value.",
                MinSecretLength);
        }
        return secret;
    }

    /// <summary>Short fingerprint of the password hash; changes whenever the password changes.</summary>
    public static string PasswordStamp(string passwordHash)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(passwordHash));
        return Convert.ToHexString(bytes, 0, 8);
    }

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(PasswordStampClaim, PasswordStamp(user.PasswordHash))
        };

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"] ?? "Portfolio.API",
            audience: _config["JwtSettings:Audience"] ?? "Portfolio.Client",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(3),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
