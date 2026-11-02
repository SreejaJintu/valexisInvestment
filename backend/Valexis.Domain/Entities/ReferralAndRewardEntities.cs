namespace Valexis.Domain.Entities;

public class ReferralRelationship
{
    public long RelationshipId { get; set; }
    public long AncestorUserId { get; set; }
    public long DescendantUserId { get; set; }
    public int DepthLevel { get; set; } // 1 to 5
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? AncestorUser { get; set; }
    public User? DescendantUser { get; set; }
}

public class ReferralCommission
{
    public long CommissionId { get; set; }
    public long BeneficiaryUserId { get; set; }
    public long SourceUserId { get; set; }
    public long SourceInvestmentId { get; set; }
    public long DailyRoiTxId { get; set; }
    public int Level { get; set; } // 1 to 5
    public decimal CommissionRate { get; set; } // e.g. 0.15
    public decimal BaseDailyRoiAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public string Status { get; set; } = "Processed";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? BeneficiaryUser { get; set; }
    public User? SourceUser { get; set; }
    public Investment? SourceInvestment { get; set; }
    public DailyRoiTransaction? DailyRoiTx { get; set; }
}

public class SpotReward
{
    public long SpotRewardId { get; set; }
    public long BeneficiaryUserId { get; set; }
    public long SourceUserId { get; set; }
    public long InvestmentId { get; set; }
    public decimal SpotRate { get; set; } // e.g. 0.05
    public decimal BaseInvestmentAmount { get; set; }
    public decimal RewardAmount { get; set; }
    public string Status { get; set; } = "Processed";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? BeneficiaryUser { get; set; }
    public User? SourceUser { get; set; }
    public Investment? Investment { get; set; }
}

public class WithdrawalRequest
{
    public long WithdrawalId { get; set; }
    public Guid PublicId { get; set; } = Guid.NewGuid();
    public long UserId { get; set; }
    public decimal RequestedAmount { get; set; }
    public decimal FeeAmount { get; set; }
    public decimal NetAmount { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;
    public string Network { get; set; } = "USDT-TRC20";
    public string Status { get; set; } = "Pending"; // Pending, Approved, Paid, Rejected
    public string? TransactionHash { get; set; }
    public string? RejectionReason { get; set; }
    public long? ReviewedByAdminId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
    public User? ReviewedByAdmin { get; set; }
}

public class FinancialLedger
{
    public long LedgerId { get; set; }
    public long UserId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string EntryType { get; set; } = string.Empty; // Credit, Debit
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string TargetBalanceType { get; set; } = string.Empty;
    public long? ReferenceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
}

public class RankSetting
{
    public int RankId { get; set; }
    public string RankCode { get; set; } = string.Empty; // R1, R2 ... R8
    public string RankName { get; set; } = string.Empty;
    public decimal RequiredSelfInvestment { get; set; }
    public decimal RequiredTeamBusiness { get; set; }
    public int RequiredLeadersCount { get; set; } = 0;
    public int? RequiredLeaderRankId { get; set; }
    public decimal TradeCapitalReward { get; set; }
    public bool IsLifetime { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public RankSetting? RequiredLeaderRank { get; set; }
}

public class UserRankHistory
{
    public long HistoryId { get; set; }
    public long UserId { get; set; }
    public int RankId { get; set; }
    public decimal AchievedSelfInvestment { get; set; }
    public decimal AchievedTeamBusiness { get; set; }
    public DateTimeOffset AchievedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
    public RankSetting? Rank { get; set; }
}

public class RankReward
{
    public long RewardId { get; set; }
    public long UserId { get; set; }
    public int RankId { get; set; }
    public decimal TradeCapitalAmount { get; set; }
    public string Status { get; set; } = "Eligible"; // Eligible, Claimed, Expired
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
    public RankSetting? Rank { get; set; }
    public RankRewardClaim? Claim { get; set; }
}

public class RankRewardClaim
{
    public long ClaimId { get; set; }
    public long RewardId { get; set; }
    public long UserId { get; set; }
    public long ResultingInvestmentId { get; set; }
    public DateTimeOffset ClaimedAt { get; set; } = DateTimeOffset.UtcNow;

    public RankReward? Reward { get; set; }
    public User? User { get; set; }
    public Investment? ResultingInvestment { get; set; }
}

public class Notification
{
    public long NotificationId { get; set; }
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Info"; // Info, Success, Warning, Payout, Deposit
    public bool IsRead { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
}

public class AdminAuditLog
{
    public long AuditLogId { get; set; }
    public long AdminUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetEntity { get; set; } = string.Empty;
    public long? TargetId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? AdminUser { get; set; }
}
