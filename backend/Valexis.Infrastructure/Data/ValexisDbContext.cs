using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Valexis.Application.Interfaces;
using Valexis.Domain.Entities;

namespace Valexis.Infrastructure.Data;

public class ValexisDbContext : DbContext, IApplicationDbContext
{
    public ValexisDbContext(DbContextOptions<ValexisDbContext> options) : base(options)
    {
    }

    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserWallet> UserWallets => Set<UserWallet>();
    public DbSet<InvestmentSetting> InvestmentSettings => Set<InvestmentSetting>();
    public DbSet<InvestmentRequest> InvestmentRequests => Set<InvestmentRequest>();
    public DbSet<Investment> Investments => Set<Investment>();
    public DbSet<DailyRoiTransaction> DailyROITransactions => Set<DailyRoiTransaction>();
    public DbSet<ReferralRelationship> ReferralRelationships => Set<ReferralRelationship>();
    public DbSet<ReferralCommission> ReferralCommissions => Set<ReferralCommission>();
    public DbSet<SpotReward> SpotRewards => Set<SpotReward>();
    public DbSet<WithdrawalRequest> WithdrawalRequests => Set<WithdrawalRequest>();
    public DbSet<FinancialLedger> FinancialLedger => Set<FinancialLedger>();
    public DbSet<RankSetting> RankSettings => Set<RankSetting>();
    public DbSet<UserRankHistory> UserRankHistory => Set<UserRankHistory>();
    public DbSet<RankReward> RankRewards => Set<RankReward>();
    public DbSet<RankRewardClaim> RankRewardClaims => Set<RankRewardClaim>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return Database.BeginTransactionAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. UserRole
        modelBuilder.Entity<UserRole>(b =>
        {
            b.ToTable("UserRoles");
            b.HasKey(e => e.RoleId);
            b.HasIndex(e => e.RoleName).IsUnique();
        });

        // 2. User
        modelBuilder.Entity<User>(b =>
        {
            b.ToTable("Users");
            b.HasKey(e => e.UserId);
            b.HasIndex(e => e.Username).IsUnique();
            b.HasIndex(e => e.Email).IsUnique();
            b.HasIndex(e => e.ReferralCode).IsUnique();
            b.HasIndex(e => e.ReferredByUserId);

            b.HasOne(e => e.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.ReferredBy)
                .WithMany(u => u.DownlineMembers)
                .HasForeignKey(e => e.ReferredByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.Wallet)
                .WithOne(w => w.User)
                .HasForeignKey<UserWallet>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 3. UserWallet
        modelBuilder.Entity<UserWallet>(b =>
        {
            b.ToTable("UserWallets");
            b.HasKey(e => e.UserId);

            b.Property(e => e.LockedPrincipal).HasPrecision(18, 8);
            b.Property(e => e.ActiveInvestmentGrowth).HasPrecision(18, 8);
            b.Property(e => e.SpotRewardBalance).HasPrecision(18, 8);
            b.Property(e => e.ReferralCommissionBalance).HasPrecision(18, 8);
            b.Property(e => e.WithdrawableBalance).HasPrecision(18, 8);
            b.Property(e => e.ReservedWithdrawalBalance).HasPrecision(18, 8);
            b.Property(e => e.TotalWithdrawn).HasPrecision(18, 8);
            b.Property(e => e.RowVersion).IsRowVersion();
        });

        // 4. InvestmentSetting
        modelBuilder.Entity<InvestmentSetting>(b =>
        {
            b.ToTable("InvestmentSettings");
            b.HasKey(e => e.SettingId);
            b.Property(e => e.DailyRoiRate).HasPrecision(5, 4);
            b.Property(e => e.CapMultiplier).HasPrecision(4, 2);
            b.Property(e => e.MinInvestmentAmount).HasPrecision(18, 8);
            b.Property(e => e.MaxInvestmentAmount).HasPrecision(18, 8);
            b.Property(e => e.SpotRewardRate).HasPrecision(5, 4);
            b.Property(e => e.MinWithdrawalAmount).HasPrecision(18, 8);
            b.Property(e => e.WithdrawalFeeRate).HasPrecision(5, 4);
        });

        // 5. InvestmentRequest
        modelBuilder.Entity<InvestmentRequest>(b =>
        {
            b.ToTable("InvestmentRequests");
            b.HasKey(e => e.RequestId);
            b.Property(e => e.Amount).HasPrecision(18, 8);

            b.HasOne(e => e.User)
                .WithMany(u => u.InvestmentRequests)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.ReviewedByAdmin)
                .WithMany()
                .HasForeignKey(e => e.ReviewedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => e.TransactionHash)
                .IsUnique()
                .HasFilter("[Status] IN ('Pending', 'Approved')");
        });

        // 6. Investment
        modelBuilder.Entity<Investment>(b =>
        {
            b.ToTable("Investments");
            b.HasKey(e => e.InvestmentId);
            b.Property(e => e.PrincipalAmount).HasPrecision(18, 8);
            b.Property(e => e.DailyRoiRate).HasPrecision(5, 4);
            b.Property(e => e.CapMultiplier).HasPrecision(4, 2);
            b.Property(e => e.MaxEarningsCap).HasPrecision(18, 8);
            b.Property(e => e.TotalRoiEarned).HasPrecision(18, 8);

            b.HasOne(e => e.User)
                .WithMany(u => u.Investments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.Request)
                .WithOne(r => r.ResultingInvestment)
                .HasForeignKey<Investment>(e => e.RequestId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 7. DailyRoiTransaction
        modelBuilder.Entity<DailyRoiTransaction>(b =>
        {
            b.ToTable("DailyROITransactions");
            b.HasKey(e => e.DailyRoiId);
            b.Property(e => e.PrincipalAmount).HasPrecision(18, 8);
            b.Property(e => e.RoiRate).HasPrecision(5, 4);
            b.Property(e => e.RoiAmount).HasPrecision(18, 8);

            b.HasOne(e => e.Investment)
                .WithMany(i => i.DailyRoiTransactions)
                .HasForeignKey(e => e.InvestmentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => new { e.InvestmentId, e.CalculationDate }).IsUnique();
        });

        // 8. ReferralRelationship
        modelBuilder.Entity<ReferralRelationship>(b =>
        {
            b.ToTable("ReferralRelationships");
            b.HasKey(e => e.RelationshipId);

            b.HasOne(e => e.AncestorUser)
                .WithMany()
                .HasForeignKey(e => e.AncestorUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.DescendantUser)
                .WithMany()
                .HasForeignKey(e => e.DescendantUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => new { e.AncestorUserId, e.DescendantUserId }).IsUnique();
        });

        // 9. ReferralCommission
        modelBuilder.Entity<ReferralCommission>(b =>
        {
            b.ToTable("ReferralCommissions");
            b.HasKey(e => e.CommissionId);
            b.Property(e => e.CommissionRate).HasPrecision(5, 4);
            b.Property(e => e.BaseDailyRoiAmount).HasPrecision(18, 8);
            b.Property(e => e.CommissionAmount).HasPrecision(18, 8);

            b.HasOne(e => e.BeneficiaryUser)
                .WithMany()
                .HasForeignKey(e => e.BeneficiaryUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.SourceUser)
                .WithMany()
                .HasForeignKey(e => e.SourceUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.SourceInvestment)
                .WithMany(i => i.ReferralCommissions)
                .HasForeignKey(e => e.SourceInvestmentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.DailyRoiTx)
                .WithMany(d => d.TriggeredCommissions)
                .HasForeignKey(e => e.DailyRoiTxId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => new { e.DailyRoiTxId, e.BeneficiaryUserId }).IsUnique();
        });

        // 10. SpotReward
        modelBuilder.Entity<SpotReward>(b =>
        {
            b.ToTable("SpotRewards");
            b.HasKey(e => e.SpotRewardId);
            b.Property(e => e.SpotRate).HasPrecision(5, 4);
            b.Property(e => e.BaseInvestmentAmount).HasPrecision(18, 8);
            b.Property(e => e.RewardAmount).HasPrecision(18, 8);

            b.HasOne(e => e.BeneficiaryUser)
                .WithMany()
                .HasForeignKey(e => e.BeneficiaryUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.SourceUser)
                .WithMany()
                .HasForeignKey(e => e.SourceUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.Investment)
                .WithOne(i => i.SpotReward)
                .HasForeignKey<SpotReward>(e => e.InvestmentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => e.InvestmentId).IsUnique();
        });

        // 11. WithdrawalRequest
        modelBuilder.Entity<WithdrawalRequest>(b =>
        {
            b.ToTable("WithdrawalRequests");
            b.HasKey(e => e.WithdrawalId);
            b.Property(e => e.RequestedAmount).HasPrecision(18, 8);
            b.Property(e => e.FeeAmount).HasPrecision(18, 8);
            b.Property(e => e.NetAmount).HasPrecision(18, 8);

            b.HasOne(e => e.User)
                .WithMany(u => u.WithdrawalRequests)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.ReviewedByAdmin)
                .WithMany()
                .HasForeignKey(e => e.ReviewedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 12. FinancialLedger
        modelBuilder.Entity<FinancialLedger>(b =>
        {
            b.ToTable("FinancialLedger");
            b.HasKey(e => e.LedgerId);
            b.Property(e => e.Amount).HasPrecision(18, 8);
            b.Property(e => e.BalanceBefore).HasPrecision(18, 8);
            b.Property(e => e.BalanceAfter).HasPrecision(18, 8);

            b.HasOne(e => e.User)
                .WithMany(u => u.LedgerEntries)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => new { e.UserId, e.CreatedAt });
        });

        // 13. RankSetting
        modelBuilder.Entity<RankSetting>(b =>
        {
            b.ToTable("RankSettings");
            b.HasKey(e => e.RankId);
            b.Property(e => e.RequiredSelfInvestment).HasPrecision(18, 8);
            b.Property(e => e.RequiredTeamBusiness).HasPrecision(18, 8);
            b.Property(e => e.TradeCapitalReward).HasPrecision(18, 8);
            b.HasIndex(e => e.RankCode).IsUnique();

            b.HasOne(e => e.RequiredLeaderRank)
                .WithMany()
                .HasForeignKey(e => e.RequiredLeaderRankId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 14. UserRankHistory
        modelBuilder.Entity<UserRankHistory>(b =>
        {
            b.ToTable("UserRankHistory");
            b.HasKey(e => e.HistoryId);
            b.Property(e => e.AchievedSelfInvestment).HasPrecision(18, 8);
            b.Property(e => e.AchievedTeamBusiness).HasPrecision(18, 8);

            b.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.Rank)
                .WithMany()
                .HasForeignKey(e => e.RankId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => new { e.UserId, e.RankId }).IsUnique();
        });

        // 15. RankReward
        modelBuilder.Entity<RankReward>(b =>
        {
            b.ToTable("RankRewards");
            b.HasKey(e => e.RewardId);
            b.Property(e => e.TradeCapitalAmount).HasPrecision(18, 8);

            b.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.Rank)
                .WithMany()
                .HasForeignKey(e => e.RankId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => new { e.UserId, e.RankId }).IsUnique();
        });

        // 16. RankRewardClaim
        modelBuilder.Entity<RankRewardClaim>(b =>
        {
            b.ToTable("RankRewardClaims");
            b.HasKey(e => e.ClaimId);

            b.HasOne(e => e.Reward)
                .WithOne(r => r.Claim)
                .HasForeignKey<RankRewardClaim>(e => e.RewardId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(e => e.ResultingInvestment)
                .WithMany()
                .HasForeignKey(e => e.ResultingInvestmentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => e.RewardId).IsUnique();
        });

        // 17. Notification
        modelBuilder.Entity<Notification>(b =>
        {
            b.ToTable("Notifications");
            b.HasKey(e => e.NotificationId);

            b.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(e => new { e.UserId, e.IsRead });
        });

        // 18. AdminAuditLog
        modelBuilder.Entity<AdminAuditLog>(b =>
        {
            b.ToTable("AdminAuditLogs");
            b.HasKey(e => e.AuditLogId);

            b.HasOne(e => e.AdminUser)
                .WithMany()
                .HasForeignKey(e => e.AdminUserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(e => new { e.AdminUserId, e.Action, e.CreatedAt });
        });
    }
}
