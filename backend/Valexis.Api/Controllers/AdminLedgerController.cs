using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/ledger")]
public class AdminLedgerController : BaseApiController
{
    private readonly IApplicationDbContext _dbContext;

    public AdminLedgerController(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetLedger()
    {
        var entries = await _dbContext.FinancialLedger
            .Include(l => l.User)
            .OrderByDescending(l => l.CreatedAt)
            .Take(100)
            .Select(l => new LedgerEntryDto
            {
                LedgerId = l.LedgerId,
                UserId = l.UserId,
                Username = l.User != null ? l.User.Username : "",
                TransactionType = l.TransactionType,
                EntryType = l.EntryType,
                Amount = l.Amount,
                BalanceBefore = l.BalanceBefore,
                BalanceAfter = l.BalanceAfter,
                TargetBalanceType = l.TargetBalanceType,
                Description = l.Description,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return Ok(entries);
    }
}
