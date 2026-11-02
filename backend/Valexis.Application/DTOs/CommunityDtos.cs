namespace Valexis.Application.DTOs;

public class ReferralMemberDto
{
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Level { get; set; }
    public string CurrentRank { get; set; } = "Unranked";
    public decimal TotalInvested { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
}

public class SpotRewardDto
{
    public long SpotRewardId { get; set; }
    public string SourceUsername { get; set; } = string.Empty;
    public decimal BaseInvestmentAmount { get; set; }
    public decimal SpotRate { get; set; }
    public decimal RewardAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class ReferralCommissionDto
{
    public long CommissionId { get; set; }
    public string SourceUsername { get; set; } = string.Empty;
    public int Level { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal BaseDailyRoiAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class RankSettingDto
{
    public int RankId { get; set; }
    public string RankCode { get; set; } = string.Empty;
    public string RankName { get; set; } = string.Empty;
    public decimal RequiredSelfInvestment { get; set; }
    public decimal RequiredTeamBusiness { get; set; }
    public int RequiredLeadersCount { get; set; }
    public decimal TradeCapitalReward { get; set; }
}
