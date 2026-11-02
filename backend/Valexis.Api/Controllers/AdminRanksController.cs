using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/ranks")]
public class AdminRanksController : BaseApiController
{
    private readonly IApplicationDbContext _dbContext;

    public AdminRanksController(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetRanks()
    {
        var ranks = await _dbContext.RankSettings
            .OrderBy(r => r.RankId)
            .Select(r => new RankSettingDto
            {
                RankId = r.RankId,
                RankCode = r.RankCode,
                RankName = r.RankName,
                RequiredSelfInvestment = r.RequiredSelfInvestment,
                RequiredTeamBusiness = r.RequiredTeamBusiness,
                RequiredLeadersCount = r.RequiredLeadersCount,
                TradeCapitalReward = r.TradeCapitalReward
            })
            .ToListAsync();

        return Ok(ranks);
    }
}
