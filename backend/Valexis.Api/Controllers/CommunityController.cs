using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.Services;

namespace Valexis.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/community")]
public class CommunityController : BaseApiController
{
    private readonly ICommunityService _communityService;

    public CommunityController(ICommunityService communityService)
    {
        _communityService = communityService;
    }

    [HttpGet("referrals")]
    public async Task<IActionResult> GetReferrals()
    {
        var list = await _communityService.GetDownlineAsync(CurrentUserId);
        return Ok(list);
    }

    [HttpGet("spot-rewards")]
    public async Task<IActionResult> GetSpotRewards()
    {
        var list = await _communityService.GetSpotRewardsAsync(CurrentUserId);
        return Ok(list);
    }

    [HttpGet("commissions")]
    public async Task<IActionResult> GetCommissions()
    {
        var list = await _communityService.GetCommissionsAsync(CurrentUserId);
        return Ok(list);
    }

    [HttpGet("ranks")]
    public async Task<IActionResult> GetRanks()
    {
        var list = await _communityService.GetRankSettingsAsync();
        return Ok(list);
    }
}
