using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Portfolio.API.Data;
using Portfolio.API.Entities;
using Portfolio.API.Services;

namespace Portfolio.API.Controllers;

[ApiController]
[Route("api/auth")]
[Route("identity/api/auth")] // Compatible with previous YARP Gateway routing
public class AuthController : ControllerBase
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutWindow = TimeSpan.FromMinutes(15);

    // Verified against when the username does not exist, so both paths cost one BCrypt check
    // and response time does not reveal whether a username is valid.
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString());

    private readonly PortfolioDbContext _db;
    private readonly JwtService _jwt;
    private readonly IMemoryCache _cache;

    public AuthController(PortfolioDbContext db, JwtService jwt, IMemoryCache cache)
    {
        _db = db;
        _jwt = jwt;
        _cache = cache;
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { error = "Username and password are required." });
        }

        if (dto.Username.Length > 100 || dto.Password.Length > 200)
        {
            return Unauthorized(new { error = "Invalid credentials." });
        }

        var failKey = $"login_fail_{HttpContext.Connection.RemoteIpAddress}";
        if (_cache.TryGetValue(failKey, out int failures) && failures >= MaxFailedAttempts)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { error = "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
        var passwordOk = BCrypt.Net.BCrypt.Verify(dto.Password, user?.PasswordHash ?? DummyHash);
        if (user == null || !passwordOk)
        {
            _cache.Set(failKey, failures + 1, LockoutWindow);
            return Unauthorized(new { error = "Invalid credentials." });
        }

        _cache.Remove(failKey);
        var token = _jwt.GenerateToken(user);
        return Ok(new { token = token, username = user.Username, role = user.Role });
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return BadRequest(new { error = "Mật khẩu hiện tại và mật khẩu mới không được để trống." });
        }

        if (dto.NewPassword.Length < 8)
        {
            return BadRequest(new { error = "Mật khẩu mới phải có tối thiểu 8 ký tự." });
        }

        if (dto.NewPassword.Length > 200)
        {
            return BadRequest(new { error = "Mật khẩu mới quá dài." });
        }

        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            return Unauthorized(new { error = "Không xác định được phiên đăng nhập." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { error = "Mật khẩu hiện tại không chính xác." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _db.SaveChangesAsync();

        // Every token issued before this point is now revoked; hand the current session a fresh one.
        _cache.Remove($"pwd_stamp_{user.Id}");
        var token = _jwt.GenerateToken(user);

        return Ok(new { message = "Đổi mật khẩu thành công!", token = token });
    }
}
