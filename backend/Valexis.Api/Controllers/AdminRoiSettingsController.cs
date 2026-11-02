using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;
using Valexis.Application.Services;
using Valexis.Domain.Entities;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/roi-settings")]
public class AdminRoiSettingsController : BaseApiController
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IRoiEngineService _roiEngineService;

    public AdminRoiSettingsController(IApplicationDbContext dbContext, IRoiEngineService roiEngineService)
    {
        _dbContext = dbContext;
        _roiEngineService = roiEngineService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _dbContext.InvestmentSettings.FirstOrDefaultAsync(s => s.Category == "Crypto" && s.IsActive);
        if (settings == null)
        {
            settings = new InvestmentSetting();
            _dbContext.InvestmentSettings.Add(settings);
            await _dbContext.SaveChangesAsync();
        }

        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateRoiSettingsDto dto)
    {
        var settings = await _dbContext.InvestmentSettings.FirstOrDefaultAsync(s => s.Category == "Crypto" && s.IsActive);
        if (settings == null)
        {
            settings = new InvestmentSetting();
            _dbContext.InvestmentSettings.Add(settings);
        }

        settings.DailyRoiRate = dto.DailyRoiRate;
        settings.CapMultiplier = dto.CapMultiplier;
        settings.SpotRewardRate = dto.SpotRewardRate;
        settings.MinInvestmentAmount = dto.MinInvestmentAmount;
        settings.MaxInvestmentAmount = dto.MaxInvestmentAmount;
        settings.WithdrawalFeeRate = dto.WithdrawalFeeRate;
        settings.MinWithdrawalAmount = dto.MinWithdrawalAmount;
        settings.DepositWalletAddress = dto.DepositWalletAddress;
        settings.RoiExecutionHourUtc = dto.RoiExecutionHourUtc;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        _dbContext.AdminAuditLogs.Add(new AdminAuditLog
        {
            AdminUserId = CurrentUserId,
            Action = "UpdateRoiSettings",
            TargetEntity = "InvestmentSetting",
            Details = $"Updated DailyRoiRate: {dto.DailyRoiRate}, Cap: {dto.CapMultiplier}x, Spot: {dto.SpotRewardRate:P0}, MinInv: {dto.MinInvestmentAmount}, Fee: {dto.WithdrawalFeeRate:P0}",
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _dbContext.SaveChangesAsync();
        return Ok(settings);
    }

    [HttpPost("trigger-daily")]
    public async Task<IActionResult> TriggerDailyRoi()
    {
        var count = await _roiEngineService.ProcessDailyRoiAsync();
        return Ok(new { success = true, processedInvestments = count, message = $"Daily ROI processed for {count} active investments." });
    }
}
