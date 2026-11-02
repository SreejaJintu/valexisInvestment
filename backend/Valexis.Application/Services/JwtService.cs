using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Valexis.Domain.Entities;

namespace Valexis.Application.Services;

public interface IJwtService
{
    (string Token, DateTimeOffset ExpiresAt) GenerateToken(User user, string roleName);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTimeOffset ExpiresAt) GenerateToken(User user, string roleName)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "DefaultFallbackSecretKeyLongEnoughForHmacSha256!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "ValexisApi";
        var audience = _configuration["JwtSettings:Audience"] ?? "ValexisClient";
        var expiryDays = int.TryParse(_configuration["JwtSettings:ExpiryDays"], out var days) ? days : 7;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTimeOffset.UtcNow.AddDays(expiryDays);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, roleName),
            new("public_id", user.PublicId.ToString()),
            new("referral_code", user.ReferralCode)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt.UtcDateTime,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return (tokenHandler.WriteToken(token), expiresAt);
    }
}
