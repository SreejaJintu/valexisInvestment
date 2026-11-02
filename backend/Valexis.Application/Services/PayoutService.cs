using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;
using Valexis.Domain.Entities;

namespace Valexis.Application.Services;

public interface IPayoutService
{
    Task<WithdrawalDto> SubmitWithdrawalAsync(long userId, CreateWithdrawalRequestDto request);
    Task<List<WithdrawalDto>> GetMyWithdrawalsAsync(long userId);
    Task<List<WithdrawalDto>> GetAllWithdrawalsAsync();
    Task<bool> PayWithdrawalAsync(long adminId, long withdrawalId, string txHash);
    Task<bool> RejectWithdrawalAsync(long adminId, long withdrawalId, string reason);
}

public class PayoutService : IPayoutService
{
    private readonly IApplicationDbContext _dbContext;

    public PayoutService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WithdrawalDto> SubmitWithdrawalAsync(long userId, CreateWithdrawalRequestDto request)
    {
        var settings = await _dbContext.InvestmentSettings.FirstOrDefaultAsync(s => s.Category == "Crypto" && s.IsActive);
        var minAmount = settings?.MinWithdrawalAmount ?? 20.00m;
        var feeRate = settings?.WithdrawalFeeRate ?? 0.0500m;

        if (request.RequestedAmount < minAmount)
        {
            throw new InvalidOperationException($"Minimum withdrawal amount is {minAmount:N2} USDT.");
        }

        using var tx = await _dbContext.BeginTransactionAsync();
        try
        {
            var wallet = await _dbContext.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null || wallet.WithdrawableBalance < request.RequestedAmount)
            {
                throw new InvalidOperationException("Insufficient withdrawable balance.");
            }

            // Check if there is already a pending withdrawal
            var hasPending = await _dbContext.WithdrawalRequests
                .AnyAsync(w => w.UserId == userId && w.Status == "Pending");
            if (hasPending)
            {
                throw new InvalidOperationException("You already have a pending withdrawal request in queue.");
            }

            var feeAmount = request.RequestedAmount * feeRate;
            var netAmount = request.RequestedAmount - feeAmount;

            var balanceBefore = wallet.WithdrawableBalance;
            wallet.WithdrawableBalance -= request.RequestedAmount;
            wallet.ReservedWithdrawalBalance += request.RequestedAmount;
            var balanceAfter = wallet.WithdrawableBalance;

            var withdrawal = new WithdrawalRequest
            {
                UserId = userId,
                RequestedAmount = request.RequestedAmount,
                FeeAmount = feeAmount,
                NetAmount = netAmount,
                DestinationAddress = request.DestinationAddress.Trim(),
                Network = request.Network.ToUpper().Trim(),
                Status = "Pending",
                CreatedAt = DateTimeOffset.UtcNow
            };
            _dbContext.WithdrawalRequests.Add(withdrawal);

            _dbContext.FinancialLedger.Add(new FinancialLedger
            {
                UserId = userId,
                TransactionType = "WithdrawalReserved",
                EntryType = "Debit",
                Amount = request.RequestedAmount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                TargetBalanceType = "WithdrawableBalance",
                Description = $"Reserved {request.RequestedAmount:N2} USDT for payout. Net: {netAmount:N2} USDT (fee {feeAmount:N2} USDT).",
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            await tx.CommitAsync();

            var user = await _dbContext.Users.FindAsync(userId);
            return new WithdrawalDto
            {
                WithdrawalId = withdrawal.WithdrawalId,
                PublicId = withdrawal.PublicId,
                UserId = userId,
                Username = user?.Username ?? "",
                UserEmail = user?.Email ?? "",
                RequestedAmount = withdrawal.RequestedAmount,
                FeeAmount = withdrawal.FeeAmount,
                NetAmount = withdrawal.NetAmount,
                DestinationAddress = withdrawal.DestinationAddress,
                Network = withdrawal.Network,
                Status = withdrawal.Status,
                CreatedAt = withdrawal.CreatedAt
            };
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<List<WithdrawalDto>> GetMyWithdrawalsAsync(long userId)
    {
        return await _dbContext.WithdrawalRequests
            .Include(w => w.User)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WithdrawalDto
            {
                WithdrawalId = w.WithdrawalId,
                PublicId = w.PublicId,
                UserId = w.UserId,
                Username = w.User != null ? w.User.Username : "",
                UserEmail = w.User != null ? w.User.Email : "",
                RequestedAmount = w.RequestedAmount,
                FeeAmount = w.FeeAmount,
                NetAmount = w.NetAmount,
                DestinationAddress = w.DestinationAddress,
                Network = w.Network,
                Status = w.Status,
                TransactionHash = w.TransactionHash,
                RejectionReason = w.RejectionReason,
                CreatedAt = w.CreatedAt,
                PaidAt = w.PaidAt
            })
            .ToListAsync();
    }

    public async Task<List<WithdrawalDto>> GetAllWithdrawalsAsync()
    {
        return await _dbContext.WithdrawalRequests
            .Include(w => w.User)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WithdrawalDto
            {
                WithdrawalId = w.WithdrawalId,
                PublicId = w.PublicId,
                UserId = w.UserId,
                Username = w.User != null ? w.User.Username : "",
                UserEmail = w.User != null ? w.User.Email : "",
                RequestedAmount = w.RequestedAmount,
                FeeAmount = w.FeeAmount,
                NetAmount = w.NetAmount,
                DestinationAddress = w.DestinationAddress,
                Network = w.Network,
                Status = w.Status,
                TransactionHash = w.TransactionHash,
                RejectionReason = w.RejectionReason,
                CreatedAt = w.CreatedAt,
                PaidAt = w.PaidAt
            })
            .ToListAsync();
    }

    public async Task<bool> PayWithdrawalAsync(long adminId, long withdrawalId, string txHash)
    {
        using var tx = await _dbContext.BeginTransactionAsync();
        try
        {
            var w = await _dbContext.WithdrawalRequests.FirstOrDefaultAsync(x => x.WithdrawalId == withdrawalId);
            if (w == null) throw new InvalidOperationException("Withdrawal request not found.");
            if (w.Status != "Pending") throw new InvalidOperationException($"Withdrawal is in '{w.Status}' state; cannot mark as Paid.");

            var wallet = await _dbContext.UserWallets.FirstOrDefaultAsync(x => x.UserId == w.UserId);
            if (wallet != null)
            {
                wallet.ReservedWithdrawalBalance -= w.RequestedAmount;
                wallet.TotalWithdrawn += w.NetAmount;
            }

            w.Status = "Paid";
            w.TransactionHash = txHash.Trim();
            w.ReviewedByAdminId = adminId;
            w.ReviewedAt = DateTimeOffset.UtcNow;
            w.PaidAt = DateTimeOffset.UtcNow;

            _dbContext.FinancialLedger.Add(new FinancialLedger
            {
                UserId = w.UserId,
                TransactionType = "WithdrawalPaid",
                EntryType = "Debit",
                Amount = w.NetAmount,
                BalanceBefore = wallet?.WithdrawableBalance ?? 0,
                BalanceAfter = wallet?.WithdrawableBalance ?? 0,
                TargetBalanceType = "TotalWithdrawn",
                ReferenceId = w.WithdrawalId,
                Description = $"Disbursed {w.NetAmount:N2} USDT to {w.DestinationAddress} ({w.Network}). TX: {txHash}.",
                CreatedAt = DateTimeOffset.UtcNow
            });

            _dbContext.Notifications.Add(new Notification
            {
                UserId = w.UserId,
                Title = "Payout Disbursed!",
                Message = $"Your withdrawal of {w.NetAmount:N2} USDT has been sent. Blockchain TX: {txHash}",
                Type = "Payout",
                CreatedAt = DateTimeOffset.UtcNow
            });

            _dbContext.AdminAuditLogs.Add(new AdminAuditLog
            {
                AdminUserId = adminId,
                Action = "DisburseWithdrawal",
                TargetEntity = "WithdrawalRequest",
                TargetId = w.WithdrawalId,
                Details = $"Paid {w.NetAmount:N2} USDT to {w.DestinationAddress}. TX: {txHash}",
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            await tx.CommitAsync();
            return true;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> RejectWithdrawalAsync(long adminId, long withdrawalId, string reason)
    {
        using var tx = await _dbContext.BeginTransactionAsync();
        try
        {
            var w = await _dbContext.WithdrawalRequests.FirstOrDefaultAsync(x => x.WithdrawalId == withdrawalId);
            if (w == null) throw new InvalidOperationException("Withdrawal request not found.");
            if (w.Status != "Pending") throw new InvalidOperationException($"Withdrawal is in '{w.Status}' state; cannot reject.");

            var wallet = await _dbContext.UserWallets.FirstOrDefaultAsync(x => x.UserId == w.UserId);
            if (wallet != null)
            {
                var before = wallet.WithdrawableBalance;
                wallet.ReservedWithdrawalBalance -= w.RequestedAmount;
                wallet.WithdrawableBalance += w.RequestedAmount;
                var after = wallet.WithdrawableBalance;

                _dbContext.FinancialLedger.Add(new FinancialLedger
                {
                    UserId = w.UserId,
                    TransactionType = "WithdrawalRefunded",
                    EntryType = "Credit",
                    Amount = w.RequestedAmount,
                    BalanceBefore = before,
                    BalanceAfter = after,
                    TargetBalanceType = "WithdrawableBalance",
                    ReferenceId = w.WithdrawalId,
                    Description = $"Refunded {w.RequestedAmount:N2} USDT reserved balance due to rejected withdrawal. Reason: {reason}",
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }

            w.Status = "Rejected";
            w.RejectionReason = reason.Trim();
            w.ReviewedByAdminId = adminId;
            w.ReviewedAt = DateTimeOffset.UtcNow;

            _dbContext.Notifications.Add(new Notification
            {
                UserId = w.UserId,
                Title = "Payout Request Rejected",
                Message = $"Your withdrawal request for {w.RequestedAmount:N2} USDT was rejected. Funds restored to your Withdrawable Balance. Reason: {reason}",
                Type = "Warning",
                CreatedAt = DateTimeOffset.UtcNow
            });

            _dbContext.AdminAuditLogs.Add(new AdminAuditLog
            {
                AdminUserId = adminId,
                Action = "RejectWithdrawal",
                TargetEntity = "WithdrawalRequest",
                TargetId = w.WithdrawalId,
                Details = $"Rejected withdrawal #{withdrawalId} of {w.RequestedAmount:N2} USDT. Reason: {reason}",
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _dbContext.SaveChangesAsync();
            await tx.CommitAsync();
            return true;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
