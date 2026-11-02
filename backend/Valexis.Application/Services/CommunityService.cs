using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;

namespace Valexis.Application.Services;

public interface ICommunityService
{
    Task<List<ReferralMemberDto>> GetDownlineAsync(long userId);
    Task<List<SpotRewardDto>> GetSpotRewardsAsync(long userId);
    Task<List<ReferralCommissionDto>> GetCommissionsAsync(long userId);
    Task<List<RankSettingDto>> GetRankSettingsAsync();
}

public class CommunityService : ICommunityService
{
    private readonly IApplicationDbContext _dbContext;

    public CommunityService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ReferralMemberDto>> GetDownlineAsync(long userId)
    {
        var relationships = await _dbContext.ReferralRelationships
            .Include(r => r.DescendantUser)
                .ThenInclude(u => u!.Wallet)
            .Where(r => r.AncestorUserId == userId)
            .OrderBy(r => r.DepthLevel)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync();

        var ranks = await _dbContext.RankSettings.ToDictionaryAsync(r => r.RankId, r => r.RankCode);

        return relationships.Select(r => new ReferralMemberDto
        {
            UserId = r.DescendantUserId,
            Username = r.DescendantUser?.Username ?? "",
            Email = r.DescendantUser?.Email ?? "",
            Level = r.DepthLevel,
            CurrentRank = (r.DescendantUser?.CurrentRankId.HasValue == true && ranks.ContainsKey(r.DescendantUser.CurrentRankId.Value))
                ? ranks[r.DescendantUser.CurrentRankId.Value]
                : "Unranked",
            TotalInvested = r.DescendantUser?.Wallet?.LockedPrincipal ?? 0m,
            JoinedAt = r.DescendantUser?.CreatedAt ?? r.CreatedAt
        }).ToList();
    }

    public async Task<List<SpotRewardDto>> GetSpotRewardsAsync(long userId)
    {
        return await _dbContext.SpotRewards
            .Include(s => s.SourceUser)
            .Where(s => s.BeneficiaryUserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SpotRewardDto
            {
                SpotRewardId = s.SpotRewardId,
                SourceUsername = s.SourceUser != null ? s.SourceUser.Username : "",
                BaseInvestmentAmount = s.BaseInvestmentAmount,
                SpotRate = s.SpotRate,
                RewardAmount = s.RewardAmount,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<ReferralCommissionDto>> GetCommissionsAsync(long userId)
    {
        return await _dbContext.ReferralCommissions
            .Include(c => c.SourceUser)
            .Where(c => c.BeneficiaryUserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ReferralCommissionDto
            {
                CommissionId = c.CommissionId,
                SourceUsername = c.SourceUser != null ? c.SourceUser.Username : "",
                Level = c.Level,
                CommissionRate = c.CommissionRate,
                BaseDailyRoiAmount = c.BaseDailyRoiAmount,
                CommissionAmount = c.CommissionAmount,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<RankSettingDto>> GetRankSettingsAsync()
    {
        return await _dbContext.RankSettings
            .Where(r => r.IsActive)
            .OrderBy(r => r.RankId)
            .Select(r => new RankSettingDto
            {
                RankId = r.RankId,
                RankCode = r.RankCode,
                RankName = r.RankName,
                RequiredSelfInvestment = r.RequiredSelfInvestment,
                RequiredTeamBusiness = r.RequiredTeamBusiness,
                RequiredLeadersCount = r.RequiredLeadersCount,
                TradeCapitalReward = r.TradeCapitalReward
            })
            .ToListAsync();
    }
}
