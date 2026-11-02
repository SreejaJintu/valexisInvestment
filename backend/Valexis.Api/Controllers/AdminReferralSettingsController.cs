using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;
using Valexis.Domain.Entities;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/referral-settings")]
public class AdminReferralSettingsController : BaseApiController
{
    private readonly IApplicationDbContext _dbContext;
    // In-memory / DB representation: default 5 levels
    private static ReferralSettingDto _currentSettings = new ReferralSettingDto();

    public AdminReferralSettingsController(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public IActionResult GetSettings()
    {
        return Ok(_currentSettings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] ReferralSettingDto dto)
    {
        _currentSettings = dto;

        _dbContext.AdminAuditLogs.Add(new AdminAuditLog
        {
            AdminUserId = CurrentUserId,
            Action = "UpdateReferralRates",
            TargetEntity = "ReferralSettings",
            Details = $"Updated L1:{dto.Level1Rate:P0}, L2:{dto.Level2Rate:P0}, L3:{dto.Level3Rate:P0}, L4:{dto.Level4Rate:P0}, L5:{dto.Level5Rate:P0}",
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _dbContext.SaveChangesAsync();
        return Ok(_currentSettings);
    }
}
