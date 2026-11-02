namespace Valexis.Domain.Entities;

public class InvestmentSetting
{
    public int SettingId { get; set; }
    public string Category { get; set; } = "Crypto";
    public decimal DailyRoiRate { get; set; } = 0.0080m; // 0.8%
    public decimal CapMultiplier { get; set; } = 3.00m;  // 3x
    public decimal MinInvestmentAmount { get; set; } = 50.00m;
    public decimal MaxInvestmentAmount { get; set; } = 100000.00m;
    public decimal SpotRewardRate { get; set; } = 0.0500m; // 5%
    public decimal MinWithdrawalAmount { get; set; } = 20.00m;
    public decimal WithdrawalFeeRate { get; set; } = 0.0500m; // 5%
    public string DepositWalletAddress { get; set; } = "TValexisOfficialDepositAddressTRC20xxxx";
    public string SupportedNetwork { get; set; } = "USDT-TRC20";
    public int RoiExecutionHourUtc { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class InvestmentRequest
{
    public long RequestId { get; set; }
    public Guid PublicId { get; set; } = Guid.NewGuid();
    public long UserId { get; set; }
    public string Category { get; set; } = "Crypto";
    public decimal Amount { get; set; }
    public string Token { get; set; } = "USDT";
    public string Network { get; set; } = "TRC20";
    public string TransactionHash { get; set; } = string.Empty;
    public string? PaymentProofUrl { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public string? RejectionReason { get; set; }
    public long? ReviewedByAdminId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
    public User? ReviewedByAdmin { get; set; }
    public Investment? ResultingInvestment { get; set; }
}

public class Investment
{
    public long InvestmentId { get; set; }
    public Guid PublicId { get; set; } = Guid.NewGuid();
    public long UserId { get; set; }
    public long? RequestId { get; set; }
    public decimal PrincipalAmount { get; set; }
    public decimal DailyRoiRate { get; set; }
    public decimal CapMultiplier { get; set; } = 3.00m;
    public decimal MaxEarningsCap { get; set; } // PrincipalAmount * CapMultiplier
    public decimal TotalRoiEarned { get; set; } = 0m;
    public string Status { get; set; } = "Active"; // Active, Matured, Cancelled
    public bool IsTradeCapitalReward { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? MaturedAt { get; set; }

    public User? User { get; set; }
    public InvestmentRequest? Request { get; set; }
    public ICollection<DailyRoiTransaction> DailyRoiTransactions { get; set; } = new List<DailyRoiTransaction>();
    public ICollection<ReferralCommission> ReferralCommissions { get; set; } = new List<ReferralCommission>();
    public SpotReward? SpotReward { get; set; }
}

public class DailyRoiTransaction
{
    public long DailyRoiId { get; set; }
    public long InvestmentId { get; set; }
    public long UserId { get; set; }
    public decimal PrincipalAmount { get; set; }
    public decimal RoiRate { get; set; }
    public decimal RoiAmount { get; set; }
    public DateOnly CalculationDate { get; set; }
    public string Status { get; set; } = "Processed"; // Processed, Failed
    public string? ErrorMessage { get; set; }
    public DateTimeOffset ProcessedAt { get; set; } = DateTimeOffset.UtcNow;

    public Investment? Investment { get; set; }
    public User? User { get; set; }
    public ICollection<ReferralCommission> TriggeredCommissions { get; set; } = new List<ReferralCommission>();
}
