namespace Valexis.Application.DTOs;

public class AdminUserDto
{
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string ReferralCode { get; set; } = string.Empty;
    public string CurrentRank { get; set; } = "Unranked";
    public decimal LockedPrincipal { get; set; }
    public decimal ActiveGrowth { get; set; }
    public decimal WithdrawableBalance { get; set; }
    public decimal SpotRewards { get; set; }
    public decimal ReferralCommissions { get; set; }
    public decimal TotalWithdrawn { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class UpdateRoiSettingsDto
{
    public decimal DailyRoiRate { get; set; }
    public decimal CapMultiplier { get; set; }
    public decimal SpotRewardRate { get; set; }
    public decimal MinInvestmentAmount { get; set; }
    public decimal MaxInvestmentAmount { get; set; }
    public decimal WithdrawalFeeRate { get; set; }
    public decimal MinWithdrawalAmount { get; set; }
    public string DepositWalletAddress { get; set; } = string.Empty;
    public int RoiExecutionHourUtc { get; set; }
}

public class ReferralSettingDto
{
    public decimal Level1Rate { get; set; } = 0.15m;
    public decimal Level2Rate { get; set; } = 0.10m;
    public decimal Level3Rate { get; set; } = 0.05m;
    public decimal Level4Rate { get; set; } = 0.02m;
    public decimal Level5Rate { get; set; } = 0.01m;
}

public class LedgerEntryDto
{
    public long LedgerId { get; set; }
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public string EntryType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string TargetBalanceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

public class AuditLogDto
{
    public long AuditLogId { get; set; }
    public string AdminUsername { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string TargetEntity { get; set; } = string.Empty;
    public long? TargetId { get; set; }
    public string? Details { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
