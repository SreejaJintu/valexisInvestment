namespace Valexis.Application.DTOs;

public class CreateWithdrawalRequestDto
{
    public decimal RequestedAmount { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;
    public string Network { get; set; } = "TRC20";
}

public class WithdrawalDto
{
    public long WithdrawalId { get; set; }
    public Guid PublicId { get; set; }
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public decimal RequestedAmount { get; set; }
    public decimal FeeAmount { get; set; }
    public decimal NetAmount { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;
    public string Network { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? TransactionHash { get; set; }
    public string? RejectionReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
}

public class PayWithdrawalDto
{
    public string TransactionHash { get; set; } = string.Empty;
}

public class RejectWithdrawalDto
{
    public string Reason { get; set; } = string.Empty;
}
