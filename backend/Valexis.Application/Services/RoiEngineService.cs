using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;
using Valexis.Domain.Entities;

namespace Valexis.Application.Services;

public interface IRoiEngineService
{
    Task<List<DailyRoiTransactionDto>> GetMyRoiTransactionsAsync(long userId);
    Task<int> ProcessDailyRoiAsync(DateOnly? targetDate = null);
}

public class RoiEngineService : IRoiEngineService
{
    private readonly IApplicationDbContext _dbContext;

    public RoiEngineService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<DailyRoiTransactionDto>> GetMyRoiTransactionsAsync(long userId)
    {
        return await _dbContext.DailyROITransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.ProcessedAt)
            .Select(t => new DailyRoiTransactionDto
            {
                DailyRoiId = t.DailyRoiId,
                InvestmentId = t.InvestmentId,
                PrincipalAmount = t.PrincipalAmount,
                RoiRate = t.RoiRate,
                RoiAmount = t.RoiAmount,
                CalculationDate = t.CalculationDate.ToString("yyyy-MM-dd"),
                Status = t.Status,
                ProcessedAt = t.ProcessedAt
            })
            .ToListAsync();
    }

    public async Task<int> ProcessDailyRoiAsync(DateOnly? targetDate = null)
    {
        var date = targetDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var activeInvestments = await _dbContext.Investments
            .Include(i => i.User)
            .Where(i => i.Status == "Active")
            .ToListAsync();

        int processedCount = 0;

        foreach (var inv in activeInvestments)
        {
            // Idempotency: prevent double calculation for same investment and date
            var alreadyProcessed = await _dbContext.DailyROITransactions
                .AnyAsync(t => t.InvestmentId == inv.InvestmentId && t.CalculationDate == date && t.Status == "Processed");

            if (alreadyProcessed) continue;

            using var tx = await _dbContext.BeginTransactionAsync();
            try
            {
                var remainingCap = inv.MaxEarningsCap - inv.TotalRoiEarned;
                if (remainingCap <= 0)
                {
                    inv.Status = "Matured";
                    inv.MaturedAt = DateTimeOffset.UtcNow;
                    await _dbContext.SaveChangesAsync();
                    await tx.CommitAsync();
                    continue;
                }

                var roi = inv.PrincipalAmount * inv.DailyRoiRate;
                if (roi >= remainingCap)
                {
                    roi = remainingCap;
                    inv.Status = "Matured";
                    inv.MaturedAt = DateTimeOffset.UtcNow;
                }

                inv.TotalRoiEarned += roi;

                var dailyTx = new DailyRoiTransaction
                {
                    InvestmentId = inv.InvestmentId,
                    UserId = inv.UserId,
                    PrincipalAmount = inv.PrincipalAmount,
                    RoiRate = inv.DailyRoiRate,
                    RoiAmount = roi,
                    CalculationDate = date,
                    Status = "Processed",
                    ProcessedAt = DateTimeOffset.UtcNow
                };
                _dbContext.DailyROITransactions.Add(dailyTx);

                // Update User Wallet
                var wallet = await _dbContext.UserWallets.FirstOrDefaultAsync(w => w.UserId == inv.UserId);
                if (wallet == null)
                {
                    wallet = new UserWallet { UserId = inv.UserId };
                    _dbContext.UserWallets.Add(wallet);
                }

                var before = wallet.WithdrawableBalance;
                wallet.ActiveInvestmentGrowth += roi;
                wallet.WithdrawableBalance += roi;
                var after = wallet.WithdrawableBalance;

                _dbContext.FinancialLedger.Add(new FinancialLedger
                {
                    UserId = inv.UserId,
                    TransactionType = "DailyRoi",
                    EntryType = "Credit",
                    Amount = roi,
                    BalanceBefore = before,
                    BalanceAfter = after,
                    TargetBalanceType = "ActiveInvestmentGrowth",
                    ReferenceId = inv.InvestmentId,
                    Description = $"Daily ROI yield (+{(inv.DailyRoiRate * 100):N2}%) on Investment #{inv.InvestmentId}. Total accrued: {inv.TotalRoiEarned:N2} / {inv.MaxEarningsCap:N2} USDT.",
                    CreatedAt = DateTimeOffset.UtcNow
                });

                // 5-Level Referral Commissions (calculated from downline Daily ROI)
                var uplines = await _dbContext.ReferralRelationships
                    .Include(r => r.AncestorUser)
                    .Where(r => r.DescendantUserId == inv.UserId && r.DepthLevel >= 1 && r.DepthLevel <= 5)
                    .OrderBy(r => r.DepthLevel)
                    .ToListAsync();

                foreach (var rel in uplines)
                {
                    decimal commRate = rel.DepthLevel switch
                    {
                        1 => 0.15m, // Level 1: 15%
                        2 => 0.10m, // Level 2: 10%
                        3 => 0.05m, // Level 3: 5%
                        4 => 0.02m, // Level 4: 2%
                        5 => 0.01m, // Level 5: 1%
                        _ => 0.0m
                    };

                    if (commRate > 0)
                    {
                        var commAmount = roi * commRate;
                        if (commAmount > 0)
                        {
                            var comm = new ReferralCommission
                            {
                                BeneficiaryUserId = rel.AncestorUserId,
                                SourceUserId = inv.UserId,
                                SourceInvestment = inv,
                                DailyRoiTx = dailyTx,
                                Level = rel.DepthLevel,
                                CommissionRate = commRate,
                                BaseDailyRoiAmount = roi,
                                CommissionAmount = commAmount,
                                Status = "Processed",
                                CreatedAt = DateTimeOffset.UtcNow
                            };
                            _dbContext.ReferralCommissions.Add(comm);

                            var uplineWallet = await _dbContext.UserWallets.FirstOrDefaultAsync(w => w.UserId == rel.AncestorUserId);
                            if (uplineWallet == null)
                            {
                                uplineWallet = new UserWallet { UserId = rel.AncestorUserId };
                                _dbContext.UserWallets.Add(uplineWallet);
                            }

                            var upBefore = uplineWallet.WithdrawableBalance;
                            uplineWallet.ReferralCommissionBalance += commAmount;
                            uplineWallet.WithdrawableBalance += commAmount;
                            var upAfter = uplineWallet.WithdrawableBalance;

                            _dbContext.FinancialLedger.Add(new FinancialLedger
                            {
                                UserId = rel.AncestorUserId,
                                TransactionType = "ReferralCommission",
                                EntryType = "Credit",
                                Amount = commAmount,
                                BalanceBefore = upBefore,
                                BalanceAfter = upAfter,
                                TargetBalanceType = "ReferralCommissions",
                                ReferenceId = inv.InvestmentId,
                                Description = $"Level {rel.DepthLevel} Commission ({(commRate * 100):N0}%) from @{inv.User?.Username}'s {roi:N4} USDT daily ROI.",
                                CreatedAt = DateTimeOffset.UtcNow
                            });
                        }
                    }
                }

                await _dbContext.SaveChangesAsync();
                await tx.CommitAsync();
                processedCount++;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();

                _dbContext.DailyROITransactions.Add(new DailyRoiTransaction
                {
                    InvestmentId = inv.InvestmentId,
                    UserId = inv.UserId,
                    PrincipalAmount = inv.PrincipalAmount,
                    RoiRate = inv.DailyRoiRate,
                    RoiAmount = 0m,
                    CalculationDate = date,
                    Status = "Failed",
                    ErrorMessage = ex.Message,
                    ProcessedAt = DateTimeOffset.UtcNow
                });
                await _dbContext.SaveChangesAsync();
            }
        }

        return processedCount;
    }
}
