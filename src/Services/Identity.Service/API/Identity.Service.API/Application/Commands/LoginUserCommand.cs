using System.Threading;
using System.Threading.Tasks;
using Identity.Service.API.Domain.Entities;
using Identity.Service.API.Infrastructure.Data;
using Identity.Service.API.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Identity.Service.API.Application.Commands;

public record LoginUserCommand(string Username, string Password) : IRequest<AuthResponse>;

public record AuthResponse(string Token, string RefreshToken);

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, AuthResponse>
{
    private readonly IdentityDbContext _dbContext;
    private readonly JwtTokenGenerator _jwtGenerator;

    public LoginUserCommandHandler(IdentityDbContext dbContext, JwtTokenGenerator jwtGenerator)
    {
        _dbContext = dbContext;
        _jwtGenerator = jwtGenerator;
    }

    public async Task<AuthResponse> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new System.Exception("Invalid credentials");
        }

        var token = _jwtGenerator.GenerateToken(user);
        var refreshToken = _jwtGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = System.DateTime.UtcNow.AddDays(7);

        var audit = new AuditLog
        {
            UserId = user.Id,
            Action = "UserLoggedIn",
            IpAddress = "Unknown" 
        };
        _dbContext.AuditLogs.Add(audit);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse(token, refreshToken);
    }
}
