namespace Valexis.Domain.Entities;

public class UserRole
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
}

public class User
{
    public long UserId { get; set; }
    public Guid PublicId { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public long? ReferredByUserId { get; set; }
    public int? CurrentRankId { get; set; }
    public string Status { get; set; } = "Active"; // Active, Suspended
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation properties
    public UserRole? Role { get; set; }
    public User? ReferredBy { get; set; }
    public UserWallet? Wallet { get; set; }
    public ICollection<User> DownlineMembers { get; set; } = new List<User>();
    public ICollection<InvestmentRequest> InvestmentRequests { get; set; } = new List<InvestmentRequest>();
    public ICollection<Investment> Investments { get; set; } = new List<Investment>();
    public ICollection<WithdrawalRequest> WithdrawalRequests { get; set; } = new List<WithdrawalRequest>();
    public ICollection<FinancialLedger> LedgerEntries { get; set; } = new List<FinancialLedger>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

public class UserWallet
{
    public long UserId { get; set; }
    public decimal LockedPrincipal { get; set; } = 0m;
    public decimal ActiveInvestmentGrowth { get; set; } = 0m;
    public decimal SpotRewardBalance { get; set; } = 0m;
    public decimal ReferralCommissionBalance { get; set; } = 0m;
    public decimal WithdrawableBalance { get; set; } = 0m;
    public decimal ReservedWithdrawalBalance { get; set; } = 0m;
    public decimal TotalWithdrawn { get; set; } = 0m;
    public byte[]? RowVersion { get; set; }

    public User? User { get; set; }
}
