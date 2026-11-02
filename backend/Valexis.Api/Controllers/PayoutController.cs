using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.DTOs;
using Valexis.Application.Services;

namespace Valexis.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/payout")]
public class PayoutController : BaseApiController
{
    private readonly IPayoutService _payoutService;

    public PayoutController(IPayoutService payoutService)
    {
        _payoutService = payoutService;
    }

    [HttpGet("my-withdrawals")]
    public async Task<IActionResult> GetMyWithdrawals()
    {
        var list = await _payoutService.GetMyWithdrawalsAsync(CurrentUserId);
        return Ok(list);
    }

    [HttpPost("request")]
    public async Task<IActionResult> RequestPayout([FromBody] CreateWithdrawalRequestDto request)
    {
        try
        {
            var result = await _payoutService.SubmitWithdrawalAsync(CurrentUserId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Payout request submission failed.", detail = ex.Message });
        }
    }
}
