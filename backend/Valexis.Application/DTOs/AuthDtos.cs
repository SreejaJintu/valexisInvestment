using System.ComponentModel.DataAnnotations;

namespace Valexis.Application.DTOs;

public class RegisterRequestDto
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string? ReferralCode { get; set; }
}

public class LoginRequestDto
{
    [Required]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public long UserId { get; set; }
    public Guid PublicId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string ReferralCode { get; set; } = string.Empty;
    public string? SponsorUsername { get; set; }
    public string? CurrentRank { get; set; }
    public decimal LockedPrincipal { get; set; }
    public decimal ActiveGrowth { get; set; }
    public decimal SpotRewards { get; set; }
    public decimal ReferralCommissions { get; set; }
    public decimal WithdrawableBalance { get; set; }
    public decimal TotalWithdrawn { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class NotificationDto
{
    public long NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Info";
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
