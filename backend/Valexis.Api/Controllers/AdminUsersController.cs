using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/users")]
public class AdminUsersController : BaseApiController
{
    private readonly IApplicationDbContext _dbContext;

    public AdminUsersController(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _dbContext.Users
            .Include(u => u.Role)
            .Include(u => u.Wallet)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var ranks = await _dbContext.RankSettings.ToDictionaryAsync(r => r.RankId, r => r.RankCode);

        var dtos = users.Select(u => new AdminUserDto
        {
            UserId = u.UserId,
            Username = u.Username,
            Email = u.Email,
            Role = u.Role?.RoleName ?? "User",
            ReferralCode = u.ReferralCode,
            CurrentRank = (u.CurrentRankId.HasValue && ranks.ContainsKey(u.CurrentRankId.Value)) ? ranks[u.CurrentRankId.Value] : "Unranked",
            LockedPrincipal = u.Wallet?.LockedPrincipal ?? 0m,
            ActiveGrowth = u.Wallet?.ActiveInvestmentGrowth ?? 0m,
            WithdrawableBalance = u.Wallet?.WithdrawableBalance ?? 0m,
            SpotRewards = u.Wallet?.SpotRewardBalance ?? 0m,
            ReferralCommissions = u.Wallet?.ReferralCommissionBalance ?? 0m,
            TotalWithdrawn = u.Wallet?.TotalWithdrawn ?? 0m,
            IsActive = u.Status == "Active",
            CreatedAt = u.CreatedAt
        }).ToList();

        return Ok(dtos);
    }
}
