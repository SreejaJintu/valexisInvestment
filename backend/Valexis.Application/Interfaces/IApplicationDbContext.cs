using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Valexis.Domain.Entities;

namespace Valexis.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<UserRole> UserRoles { get; }
    DbSet<User> Users { get; }
    DbSet<UserWallet> UserWallets { get; }
    DbSet<InvestmentSetting> InvestmentSettings { get; }
    DbSet<InvestmentRequest> InvestmentRequests { get; }
    DbSet<Investment> Investments { get; }
    DbSet<DailyRoiTransaction> DailyROITransactions { get; }
    DbSet<ReferralRelationship> ReferralRelationships { get; }
    DbSet<ReferralCommission> ReferralCommissions { get; }
    DbSet<SpotReward> SpotRewards { get; }
    DbSet<WithdrawalRequest> WithdrawalRequests { get; }
    DbSet<FinancialLedger> FinancialLedger { get; }
    DbSet<RankSetting> RankSettings { get; }
    DbSet<UserRankHistory> UserRankHistory { get; }
    DbSet<RankReward> RankRewards { get; }
    DbSet<RankRewardClaim> RankRewardClaims { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AdminAuditLog> AdminAuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
