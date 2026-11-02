using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;
using Valexis.Domain.Entities;

namespace Valexis.Application.Services;

public interface IInvestmentService
{
    Task<InvestmentRequestResponseDto> SubmitRequestAsync(long userId, CreateInvestmentRequestDto request);
    Task<List<InvestmentRequestResponseDto>> GetMyRequestsAsync(long userId);
    Task<List<InvestmentDto>> GetMyInvestmentsAsync(long userId);
    Task<InvestmentSettingDto> GetCurrentSettingsAsync();
    Task<List<InvestmentRequestResponseDto>> GetPendingRequestsAsync();
    Task<List<InvestmentRequestResponseDto>> GetAllRequestsAsync();
    Task<List<InvestmentDto>> GetAllInvestmentsAsync();
    Task<bool> ApproveRequestAsync(long adminId, long requestId, string? adminNotes = null);
    Task<bool> RejectRequestAsync(long adminId, long requestId, string reason);
}

public class InvestmentService : IInvestmentService
{
    private readonly IApplicationDbContext _dbContext;

    public InvestmentService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<InvestmentRequestResponseDto> SubmitRequestAsync(long userId, CreateInvestmentRequestDto request)
    {
        var cleanTxHash = request.TransactionHash.Trim();

        // 1. Prevent duplicate transaction hash reuse
        var txExists = await _dbContext.InvestmentRequests.AnyAsync(r => 
            r.TransactionHash.ToLower() == cleanTxHash.ToLower() && (r.Status == "Pending" || r.Status == "Approved"));

        if (txExists)
        {
            throw new InvalidOperationException("This blockchain transaction hash has already been submitted or approved.");
        }

        // 2. Validate against settings
        var settings = await _dbContext.InvestmentSettings.FirstOrDefaultAsync(s => s.Category == "Crypto" && s.IsActive);
        var minAmount = settings?.MinInvestmentAmount ?? 50m;
        var maxAmount = settings?.MaxInvestmentAmount ?? 100000m;

        if (request.Amount < minAmount || request.Amount > maxAmount)
        {
            throw new InvalidOperationException($"Investment amount must be between {minAmount:N2} and {maxAmount:N2} USDT.");
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) throw new InvalidOperationException("User not found.");

        var investmentRequest = new InvestmentRequest
        {
            UserId = userId,
            Category = "Crypto",
            Amount = request.Amount,
            Token = "USDT",
            Network = request.Network.ToUpper().Trim(),
            TransactionHash = cleanTxHash,
            PaymentProofUrl = request.PaymentProofUrl,
            Status = "Pending",
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.InvestmentRequests.Add(investmentRequest);

        // Notify Admins
        var adminRole = await _dbContext.UserRoles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
        if (adminRole != null)
        {
            var adminUsers = await _dbContext.Users.Where(u => u.RoleId == adminRole.RoleId).ToListAsync();
            foreach (var admin in adminUsers)
            {
                _dbContext.Notifications.Add(new Notification
                {
                    UserId = admin.UserId,
                    Title = "New Deposit Verification Required",
                    Message = $"User @{user.Username} submitted a {request.Amount:N2} USDT deposit request ({request.Network}).",
                    Type = "Deposit",
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        return new InvestmentRequestResponseDto
        {
            RequestId = investmentRequest.RequestId,
            PublicId = investmentRequest.PublicId,
            UserId = user.UserId,
            Username = user.Username,
            UserEmail = user.Email,
            Category = investmentRequest.Category,
            Amount = investmentRequest.Amount,
            Token = investmentRequest.Token,
            Network = investmentRequest.Network,
            TransactionHash = investmentRequest.TransactionHash,
            PaymentProofUrl = investmentRequest.PaymentProofUrl,
            Status = investmentRequest.Status,
            CreatedAt = investmentRequest.CreatedAt
        };
    }

    public async Task<List<InvestmentRequestResponseDto>> GetMyRequestsAsync(long userId)
    {
        return await _dbContext.InvestmentRequests
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new InvestmentRequestResponseDto
            {
                RequestId = r.RequestId,
                PublicId = r.PublicId,
                UserId = r.UserId,
                Username = r.User!.Username,
                UserEmail = r.User.Email,
                Category = r.Category,
                Amount = r.Amount,
                Token = r.Token,
                Network = r.Network,
                TransactionHash = r.TransactionHash,
                PaymentProofUrl = r.PaymentProofUrl,
                Status = r.Status,
                RejectionReason = r.RejectionReason,
                ReviewedAt = r.ReviewedAt,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<InvestmentDto>> GetMyInvestmentsAsync(long userId)
    {
        return await _dbContext.Investments
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvestmentDto
            {
                InvestmentId = i.InvestmentId,
                PublicId = i.PublicId,
                UserId = i.UserId,
                Username = i.User!.Username,
                PrincipalAmount = i.PrincipalAmount,
                DailyRoiRate = i.DailyRoiRate,
                CapMultiplier = i.CapMultiplier,
                MaxEarningsCap = i.MaxEarningsCap,
                TotalRoiEarned = i.TotalRoiEarned,
                Status = i.Status,
                IsTradeCapitalReward = i.IsTradeCapitalReward,
                CreatedAt = i.CreatedAt,
                MaturedAt = i.MaturedAt
            })
            .ToListAsync();
    }

    public async Task<InvestmentSettingDto> GetCurrentSettingsAsync()
    {
        var settings = await _dbContext.InvestmentSettings.FirstOrDefaultAsync(s => s.Category == "Crypto" && s.IsActive);
        if (settings == null)
        {
            return new InvestmentSettingDto
            {
                Category = "Crypto",
                DailyRoiRate = 0.0080m,
                CapMultiplier = 3.00m,
                MinInvestmentAmount = 50.00m,
                MaxInvestmentAmount = 100000.00m,
                SpotRewardRate = 0.0500m,
                DepositWalletAddress = "TValexisOfficialDepositAddressTRC20xxxx",
                SupportedNetwork = "USDT-TRC20"
            };
        }

        return new InvestmentSettingDto
        {
            SettingId = settings.SettingId,
            Category = settings.Category,
            DailyRoiRate = settings.DailyRoiRate,
            CapMultiplier = settings.CapMultiplier,
            MinInvestmentAmount = settings.MinInvestmentAmount,
            MaxInvestmentAmount = settings.MaxInvestmentAmount,
            SpotRewardRate = settings.SpotRewardRate,
            DepositWalletAddress = settings.DepositWalletAddress,
            SupportedNetwork = settings.SupportedNetwork
        };
    }

    public async Task<List<InvestmentRequestResponseDto>> GetPendingRequestsAsync()
    {
        return await _dbContext.InvestmentRequests
            .Include(r => r.User)
            .Where(r => r.Status == "Pending")
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new InvestmentRequestResponseDto
            {
                RequestId = r.RequestId,
                PublicId = r.PublicId,
                UserId = r.UserId,
                Username = r.User!.Username,
                UserEmail = r.User.Email,
                Category = r.Category,
                Amount = r.Amount,
                Token = r.Token,
                Network = r.Network,
                TransactionHash = r.TransactionHash,
                PaymentProofUrl = r.PaymentProofUrl,
                Status = r.Status,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<InvestmentRequestResponseDto>> GetAllRequestsAsync()
    {
        return await _dbContext.InvestmentRequests
            .Include(r => r.User)
            .Include(r => r.ReviewedByAdmin)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new InvestmentRequestResponseDto
            {
                RequestId = r.RequestId,
                PublicId = r.PublicId,
                UserId = r.UserId,
                Username = r.User!.Username,
                UserEmail = r.User.Email,
                Category = r.Category,
                Amount = r.Amount,
                Token = r.Token,
                Network = r.Network,
                TransactionHash = r.TransactionHash,
                PaymentProofUrl = r.PaymentProofUrl,
                Status = r.Status,
                RejectionReason = r.RejectionReason,
                ReviewedByAdminUsername = r.ReviewedByAdmin != null ? r.ReviewedByAdmin.Username : null,
                ReviewedAt = r.ReviewedAt,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<InvestmentDto>> GetAllInvestmentsAsync()
    {
        return await _dbContext.Investments
            .Include(i => i.User)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvestmentDto
            {
                InvestmentId = i.InvestmentId,
                PublicId = i.PublicId,
                UserId = i.UserId,
                Username = i.User!.Username,
                PrincipalAmount = i.PrincipalAmount,
                DailyRoiRate = i.DailyRoiRate,
                CapMultiplier = i.CapMultiplier,
                MaxEarningsCap = i.MaxEarningsCap,
                TotalRoiEarned = i.TotalRoiEarned,
                Status = i.Status,
                IsTradeCapitalReward = i.IsTradeCapitalReward,
                CreatedAt = i.CreatedAt,
                MaturedAt = i.MaturedAt
            })
            .ToListAsync();
    }

    public async Task<bool> ApproveRequestAsync(long adminId, long requestId, string? adminNotes = null)
    {
        using var transaction = await _dbContext.BeginTransactionAsync();
        try
        {
            var req = await _dbContext.InvestmentRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RequestId == requestId);

            if (req == null)
            {
                throw new InvalidOperationException("Investment request not found.");
            }

            // Prevent duplicate approval
            if (req.Status != "Pending")
            {
                throw new InvalidOperationException($"Cannot approve request with current status '{req.Status}'. Only pending requests can be approved.");
            }

            // Prevent reuse of transaction hash across any already approved request
            var txAlreadyApproved = await _dbContext.InvestmentRequests.AnyAsync(r => 
                r.TransactionHash.ToLower() == req.TransactionHash.ToLower() && 
                r.Status == "Approved" && 
                r.RequestId != requestId);

            if (txAlreadyApproved)
            {
                throw new InvalidOperationException("Security Violation: This blockchain transaction hash was already approved for another deposit.");
            }

            var wallet = await _dbContext.UserWallets.FirstOrDefaultAsync(w => w.UserId == req.UserId);
            if (wallet == null)
            {
                wallet = new UserWallet { UserId = req.UserId };
                _dbContext.UserWallets.Add(wallet);
            }

            var settings = await _dbContext.InvestmentSettings.FirstOrDefaultAsync(s => s.Category == "Crypto" && s.IsActive);
            var dailyRoiRate = settings?.DailyRoiRate ?? 0.0080m;
            var capMultiplier = settings?.CapMultiplier ?? 3.00m;
            var maxCapAmount = req.Amount * capMultiplier;

            // 1. Create Investment record
            var investment = new Investment
            {
                UserId = req.UserId,
                RequestId = req.RequestId,
                PrincipalAmount = req.Amount,
                DailyRoiRate = dailyRoiRate,
                CapMultiplier = capMultiplier,
                MaxEarningsCap = maxCapAmount,
                TotalRoiEarned = 0m,
                Status = "Active",
                IsTradeCapitalReward = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _dbContext.Investments.Add(investment);

            // 2. Update User's Locked Principal
            var balanceBefore = wallet.LockedPrincipal;
            wallet.LockedPrincipal += req.Amount;
            var balanceAfter = wallet.LockedPrincipal;

            // 3. Create Immutable Financial Ledger Entry
            _dbContext.FinancialLedger.Add(new FinancialLedger
            {
                UserId = req.UserId,
                TransactionType = "DepositApproved",
                EntryType = "Credit",
                Amount = req.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                TargetBalanceType = "LockedPrincipal",
                ReferenceId = req.RequestId,
                Description = $"Approved {req.Amount:N2} USDT {req.Network} deposit. TX: {req.TransactionHash}. Active 3x cap target: {maxCapAmount:N2} USDT.",
                CreatedAt = DateTimeOffset.UtcNow
            });

            // 4. Mark Request as Approved
            req.Status = "Approved";
            req.ReviewedByAdminId = adminId;
            req.ReviewedAt = DateTimeOffset.UtcNow;

            // 5. User Notification
            _dbContext.Notifications.Add(new Notification
            {
                UserId = req.UserId,
                Title = "Deposit Approved & Capital Locked",
                Message = $"Your deposit of {req.Amount:N2} USDT has been verified. An active investment of {req.Amount:N2} USDT with a 3x cap ({maxCapAmount:N2} USDT) is now running.",
                Type = "Success",
                IsRead = false,
                CreatedAt = DateTimeOffset.UtcNow
            });

            // 6. Admin Audit Log
            _dbContext.AdminAuditLogs.Add(new AdminAuditLog
            {
                AdminUserId = adminId,
                Action = "ApproveInvestmentDeposit",
                TargetEntity = "InvestmentRequest",
                TargetId = req.RequestId,
                Details = $"Approved deposit of {req.Amount} USDT for user {req.User?.Username} (UserId: {req.UserId}). TX: {req.TransactionHash}. Notes: {adminNotes ?? "None"}",
                CreatedAt = DateTimeOffset.UtcNow
            });

            // 7. Spot Reward (Prompt 6: Separate spot rewards on deposit approval)
            if (req.User?.ReferredByUserId != null)
            {
                var spotRate = settings?.SpotRewardRate ?? 0.0500m;
                var spotAmount = req.Amount * spotRate;
                if (spotAmount > 0)
                {
                    var sponsorId = req.User.ReferredByUserId.Value;
                    var sponsorWallet = await _dbContext.UserWallets.FirstOrDefaultAsync(w => w.UserId == sponsorId);
                    if (sponsorWallet == null)
                    {
                        sponsorWallet = new UserWallet { UserId = sponsorId };
                        _dbContext.UserWallets.Add(sponsorWallet);
                    }

                    var spotBefore = sponsorWallet.WithdrawableBalance;
                    sponsorWallet.SpotRewardBalance += spotAmount;
                    sponsorWallet.WithdrawableBalance += spotAmount;
                    var spotAfter = sponsorWallet.WithdrawableBalance;

                    var spotReward = new SpotReward
                    {
                        BeneficiaryUserId = sponsorId,
                        SourceUserId = req.UserId,
                        Investment = investment,
                        SpotRate = spotRate,
                        BaseInvestmentAmount = req.Amount,
                        RewardAmount = spotAmount,
                        Status = "Processed",
                        CreatedAt = DateTimeOffset.UtcNow
                    };
                    _dbContext.SpotRewards.Add(spotReward);

                    _dbContext.FinancialLedger.Add(new FinancialLedger
                    {
                        UserId = sponsorId,
                        TransactionType = "SpotReward",
                        EntryType = "Credit",
                        Amount = spotAmount,
                        BalanceBefore = spotBefore,
                        BalanceAfter = spotAfter,
                        TargetBalanceType = "SpotRewards",
                        ReferenceId = req.RequestId,
                        Description = $"Spot Reward ({(spotRate * 100):N0}%) credited from @{req.User.Username}'s approved deposit of {req.Amount:N2} USDT.",
                        CreatedAt = DateTimeOffset.UtcNow
                    });

                    _dbContext.Notifications.Add(new Notification
                    {
                        UserId = sponsorId,
                        Title = "Spot Reward Credited!",
                        Message = $"You received a {spotAmount:N2} USDT Spot Reward from @{req.User.Username}'s approved investment.",
                        Type = "Success",
                        IsRead = false,
                        CreatedAt = DateTimeOffset.UtcNow
                    });
                }
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> RejectRequestAsync(long adminId, long requestId, string reason)
    {
        var req = await _dbContext.InvestmentRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        if (req == null)
        {
            throw new InvalidOperationException("Investment request not found.");
        }

        if (req.Status != "Pending")
        {
            throw new InvalidOperationException($"Cannot reject request with current status '{req.Status}'. Only pending requests can be rejected.");
        }

        req.Status = "Rejected";
        req.RejectionReason = reason.Trim();
        req.ReviewedByAdminId = adminId;
        req.ReviewedAt = DateTimeOffset.UtcNow;

        // User Notification
        _dbContext.Notifications.Add(new Notification
        {
            UserId = req.UserId,
            Title = "Investment Deposit Rejected",
            Message = $"Your deposit request of {req.Amount:N2} USDT was rejected. Reason: {reason}",
            Type = "Warning",
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        });

        // Admin Audit Log
        _dbContext.AdminAuditLogs.Add(new AdminAuditLog
        {
            AdminUserId = adminId,
            Action = "RejectInvestmentDeposit",
            TargetEntity = "InvestmentRequest",
            TargetId = req.RequestId,
            Details = $"Rejected deposit of {req.Amount} USDT for user {req.User?.Username} (UserId: {req.UserId}). Reason: {reason}",
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _dbContext.SaveChangesAsync();
        return true;
    }
}
