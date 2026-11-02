using System.ComponentModel.DataAnnotations;

namespace Valexis.Application.DTOs;

public class CreateInvestmentRequestDto
{
    [Required]
    public string Category { get; set; } = "Crypto";

    [Required]
    [Range(10.0, 1000000.0, ErrorMessage = "Investment amount must be between 10 and 1,000,000 USDT.")]
    public decimal Amount { get; set; }

    [Required]
    public string Token { get; set; } = "USDT";

    [Required]
    public string Network { get; set; } = "TRC20";

    [Required]
    [MinLength(10, ErrorMessage = "Transaction hash must be a valid blockchain transaction ID.")]
    public string TransactionHash { get; set; } = string.Empty;

    public string? PaymentProofUrl { get; set; }
}

public class InvestmentRequestResponseDto
{
    public long RequestId { get; set; }
    public Guid PublicId { get; set; }
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Network { get; set; } = string.Empty;
    public string TransactionHash { get; set; } = string.Empty;
    public string? PaymentProofUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public string? ReviewedByAdminUsername { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class RejectInvestmentRequestDto
{
    [Required]
    [MinLength(3, ErrorMessage = "A valid rejection reason must be documented.")]
    public string Reason { get; set; } = string.Empty;
}

public class InvestmentDto
{
    public long InvestmentId { get; set; }
    public Guid PublicId { get; set; }
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public decimal PrincipalAmount { get; set; }
    public decimal DailyRoiRate { get; set; }
    public decimal CapMultiplier { get; set; }
    public decimal MaxEarningsCap { get; set; }
    public decimal TotalRoiEarned { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsTradeCapitalReward { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? MaturedAt { get; set; }
}

public class InvestmentSettingDto
{
    public int SettingId { get; set; }
    public string Category { get; set; } = "Crypto";
    public decimal DailyRoiRate { get; set; }
    public decimal CapMultiplier { get; set; }
    public decimal MinInvestmentAmount { get; set; }
    public decimal MaxInvestmentAmount { get; set; }
    public decimal SpotRewardRate { get; set; }
    public string DepositWalletAddress { get; set; } = string.Empty;
    public string SupportedNetwork { get; set; } = string.Empty;
}

public class DailyRoiTransactionDto
{
    public long DailyRoiId { get; set; }
    public long InvestmentId { get; set; }
    public decimal PrincipalAmount { get; set; }
    public decimal RoiRate { get; set; }
    public decimal RoiAmount { get; set; }
    public string CalculationDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset ProcessedAt { get; set; }
}
