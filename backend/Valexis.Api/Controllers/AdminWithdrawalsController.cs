using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.DTOs;
using Valexis.Application.Services;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/withdrawals")]
public class AdminWithdrawalsController : BaseApiController
{
    private readonly IPayoutService _payoutService;

    public AdminWithdrawalsController(IPayoutService payoutService)
    {
        _payoutService = payoutService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _payoutService.GetAllWithdrawalsAsync();
        return Ok(list);
    }

    [HttpPost("{id}/pay")]
    public async Task<IActionResult> PayWithdrawal(long id, [FromBody] PayWithdrawalDto request)
    {
        try
        {
            var success = await _payoutService.PayWithdrawalAsync(CurrentUserId, id, request.TransactionHash);
            return Ok(new { success, message = "Withdrawal processed and marked as Paid." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Payment recording failed.", detail = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectWithdrawal(long id, [FromBody] RejectWithdrawalDto request)
    {
        try
        {
            var success = await _payoutService.RejectWithdrawalAsync(CurrentUserId, id, request.Reason);
            return Ok(new { success, message = "Withdrawal rejected and balance restored." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Rejection failed.", detail = ex.Message });
        }
    }
}
