using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.Services;

namespace Valexis.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/roi")]
public class RoiController : BaseApiController
{
    private readonly IRoiEngineService _roiEngineService;

    public RoiController(IRoiEngineService roiEngineService)
    {
        _roiEngineService = roiEngineService;
    }

    [HttpGet("my-transactions")]
    public async Task<IActionResult> GetMyTransactions()
    {
        var list = await _roiEngineService.GetMyRoiTransactionsAsync(CurrentUserId);
        return Ok(list);
    }
}
