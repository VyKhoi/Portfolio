using System.Threading;
using System.Threading.Tasks;
using Identity.Service.API.Domain.Entities;
using Identity.Service.API.Infrastructure.Data;
using Identity.Service.API.Infrastructure.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Identity.Service.API.Application.Commands;

public record RegisterUserCommand(string Username, string Email, string Password) : IRequest<string>;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, string>
{
    private readonly IdentityDbContext _dbContext;
    private readonly JwtTokenGenerator _jwtGenerator;

    public RegisterUserCommandHandler(IdentityDbContext dbContext, JwtTokenGenerator jwtGenerator)
    {
        _dbContext = dbContext;
        _jwtGenerator = jwtGenerator;
    }

    public async Task<string> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        if (await _dbContext.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email, cancellationToken))
        {
            throw new System.Exception("User already exists");
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Admin"
        };

        _dbContext.Users.Add(user);
        
        var audit = new AuditLog
        {
            UserId = user.Id,
            Action = "UserRegistered",
            IpAddress = "Unknown"
        };
        _dbContext.AuditLogs.Add(audit);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return _jwtGenerator.GenerateToken(user);
    }
}
