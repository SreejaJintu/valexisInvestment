using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;
using Valexis.Domain.Entities;

namespace Valexis.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserProfileDto?> GetUserProfileAsync(long userId);
    Task<bool> ChangePasswordAsync(long userId, ChangePasswordDto request);
    Task EnsureAdminUserSeededAsync();
}

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IJwtService _jwtService;

    public AuthService(IApplicationDbContext dbContext, IJwtService jwtService)
    {
        _dbContext = dbContext;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedUsername = request.Username.Trim();

        if (await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        if (await _dbContext.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername.ToLower()))
        {
            throw new InvalidOperationException("Username is already taken.");
        }

        User? sponsor = null;
        if (!string.IsNullOrWhiteSpace(request.ReferralCode))
        {
            sponsor = await _dbContext.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.ReferralCode.ToUpper() == request.ReferralCode.Trim().ToUpper());

            if (sponsor == null)
            {
                throw new InvalidOperationException("Invalid referral code provided.");
            }
        }

        var userRole = await _dbContext.UserRoles.FirstOrDefaultAsync(r => r.RoleName == "User");
        if (userRole == null)
        {
            userRole = new UserRole { RoleName = "User", Description = "Standard Investor" };
            _dbContext.UserRoles.Add(userRole);
            await _dbContext.SaveChangesAsync();
        }

        var newReferralCode = await GenerateUniqueReferralCodeAsync();

        using var transaction = await _dbContext.BeginTransactionAsync();
        try
        {
            var user = new User
            {
                Username = normalizedUsername,
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                RoleId = userRole.RoleId,
                ReferralCode = newReferralCode,
                ReferredByUserId = sponsor?.UserId,
                Status = "Active",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var wallet = new UserWallet
            {
                UserId = user.UserId,
                LockedPrincipal = 0m,
                ActiveInvestmentGrowth = 0m,
                SpotRewardBalance = 0m,
                ReferralCommissionBalance = 0m,
                WithdrawableBalance = 0m,
                ReservedWithdrawalBalance = 0m,
                TotalWithdrawn = 0m
            };
            _dbContext.UserWallets.Add(wallet);

            if (sponsor != null)
            {
                _dbContext.ReferralRelationships.Add(new ReferralRelationship
                {
                    AncestorUserId = sponsor.UserId,
                    DescendantUserId = user.UserId,
                    DepthLevel = 1,
                    CreatedAt = DateTimeOffset.UtcNow
                });

                var uplines = await _dbContext.ReferralRelationships
                    .Where(r => r.DescendantUserId == sponsor.UserId && r.DepthLevel <= 4)
                    .OrderBy(r => r.DepthLevel)
                    .ToListAsync();

                foreach (var upline in uplines)
                {
                    _dbContext.ReferralRelationships.Add(new ReferralRelationship
                    {
                        AncestorUserId = upline.AncestorUserId,
                        DescendantUserId = user.UserId,
                        DepthLevel = upline.DepthLevel + 1,
                        CreatedAt = DateTimeOffset.UtcNow
                    });
                }
            }

            _dbContext.Notifications.Add(new Notification
            {
                UserId = user.UserId,
                Title = "Welcome to Valexis",
                Message = "Your institutional wealth account has been established. You can now explore investment plans.",
                Type = "Info",
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            var (token, expiresAt) = _jwtService.GenerateToken(user, userRole.RoleName);

            var profileDto = new UserProfileDto
            {
                UserId = user.UserId,
                PublicId = user.PublicId,
                Username = user.Username,
                Email = user.Email,
                Role = userRole.RoleName,
                ReferralCode = user.ReferralCode,
                SponsorUsername = sponsor?.Username,
                CurrentRank = "Standard",
                LockedPrincipal = 0m,
                ActiveGrowth = 0m,
                SpotRewards = 0m,
                ReferralCommissions = 0m,
                WithdrawableBalance = 0m,
                TotalWithdrawn = 0m,
                CreatedAt = user.CreatedAt
            };

            return new AuthResponseDto
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = profileDto
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var identifier = request.UsernameOrEmail.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .Include(u => u.Role)
            .Include(u => u.Wallet)
            .Include(u => u.ReferredBy)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        if (user.Status != "Active")
        {
            throw new UnauthorizedAccessException("Account is suspended or inactive. Please contact support.");
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!passwordValid)
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        var roleName = user.Role?.RoleName ?? "User";
        var (token, expiresAt) = _jwtService.GenerateToken(user, roleName);

        var profileDto = new UserProfileDto
        {
            UserId = user.UserId,
            PublicId = user.PublicId,
            Username = user.Username,
            Email = user.Email,
            Role = roleName,
            ReferralCode = user.ReferralCode,
            SponsorUsername = user.ReferredBy?.Username,
            CurrentRank = user.CurrentRankId.HasValue ? $"R{user.CurrentRankId}" : "Standard",
            LockedPrincipal = user.Wallet?.LockedPrincipal ?? 0m,
            ActiveGrowth = user.Wallet?.ActiveInvestmentGrowth ?? 0m,
            SpotRewards = user.Wallet?.SpotRewardBalance ?? 0m,
            ReferralCommissions = user.Wallet?.ReferralCommissionBalance ?? 0m,
            WithdrawableBalance = user.Wallet?.WithdrawableBalance ?? 0m,
            TotalWithdrawn = user.Wallet?.TotalWithdrawn ?? 0m,
            CreatedAt = user.CreatedAt
        };

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = profileDto
        };
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(long userId)
    {
        var user = await _dbContext.Users
            .Include(u => u.Role)
            .Include(u => u.Wallet)
            .Include(u => u.ReferredBy)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return null;

        return new UserProfileDto
        {
            UserId = user.UserId,
            PublicId = user.PublicId,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role?.RoleName ?? "User",
            ReferralCode = user.ReferralCode,
            SponsorUsername = user.ReferredBy?.Username,
            CurrentRank = user.CurrentRankId.HasValue ? $"R{user.CurrentRankId}" : "Standard",
            LockedPrincipal = user.Wallet?.LockedPrincipal ?? 0m,
            ActiveGrowth = user.Wallet?.ActiveInvestmentGrowth ?? 0m,
            SpotRewards = user.Wallet?.SpotRewardBalance ?? 0m,
            ReferralCommissions = user.Wallet?.ReferralCommissionBalance ?? 0m,
            WithdrawableBalance = user.Wallet?.WithdrawableBalance ?? 0m,
            TotalWithdrawn = user.Wallet?.TotalWithdrawn ?? 0m,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<bool> ChangePasswordAsync(long userId, ChangePasswordDto request)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return false;

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new InvalidOperationException("Current password does not match.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task EnsureAdminUserSeededAsync()
    {
        var adminRole = await _dbContext.UserRoles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
        if (adminRole == null)
        {
            adminRole = new UserRole { RoleName = "Admin", Description = "System Administrator" };
            _dbContext.UserRoles.Add(adminRole);
            await _dbContext.SaveChangesAsync();
        }

        var adminUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == "admin@valexis.com");
        if (adminUser == null)
        {
            var admin = new User
            {
                Username = "valexis_admin",
                Email = "admin@valexis.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@Valexis2026!"),
                RoleId = adminRole.RoleId,
                ReferralCode = "VALEXIS_ROOT",
                Status = "Active",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _dbContext.Users.Add(admin);
            await _dbContext.SaveChangesAsync();

            _dbContext.UserWallets.Add(new UserWallet
            {
                UserId = admin.UserId,
                LockedPrincipal = 0m,
                ActiveInvestmentGrowth = 0m,
                SpotRewardBalance = 0m,
                ReferralCommissionBalance = 0m,
                WithdrawableBalance = 0m,
                ReservedWithdrawalBalance = 0m,
                TotalWithdrawn = 0m
            });
            await _dbContext.SaveChangesAsync();
        }
    }

    private async Task<string> GenerateUniqueReferralCodeAsync()
    {
        while (true)
        {
            var code = "VLX" + Random.Shared.Next(100000, 999999).ToString();
            if (!await _dbContext.Users.AnyAsync(u => u.ReferralCode == code))
            {
                return code;
            }
        }
    }
}
