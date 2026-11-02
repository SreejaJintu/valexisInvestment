using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.DTOs;
using Valexis.Application.Services;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin")]
public class AdminInvestmentsController : BaseApiController
{
    private readonly IInvestmentService _investmentService;

    public AdminInvestmentsController(IInvestmentService investmentService)
    {
        _investmentService = investmentService;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var pendingRequests = await _investmentService.GetPendingRequestsAsync();
        var allInvestments = await _investmentService.GetAllInvestmentsAsync();
        var allRequests = await _investmentService.GetAllRequestsAsync();

        return Ok(new
        {
            totalUsers = allRequests.Select(r => r.UserId).Distinct().Count() + 1,
            pendingRequests = pendingRequests.Count,
            activeInvestments = allInvestments.Count(i => i.Status == "Active"),
            pendingWithdrawals = 0,
            totalVolume = allInvestments.Sum(i => i.PrincipalAmount)
        });
    }

    [HttpGet("investment-requests")]
    public async Task<IActionResult> GetAllRequests([FromQuery] string? status)
    {
        if (status?.ToLower() == "pending")
        {
            var pending = await _investmentService.GetPendingRequestsAsync();
            return Ok(pending);
        }

        var all = await _investmentService.GetAllRequestsAsync();
        return Ok(all);
    }

    [HttpGet("investments")]
    public async Task<IActionResult> GetAllInvestments()
    {
        var investments = await _investmentService.GetAllInvestmentsAsync();
        return Ok(investments);
    }

    [HttpPost("investment-requests/{id}/approve")]
    public async Task<IActionResult> ApproveRequest(long id, [FromQuery] string? notes)
    {
        try
        {
            var success = await _investmentService.ApproveRequestAsync(CurrentUserId, id, notes);
            return Ok(new { success, message = "Investment request verified and approved. Principal locked and 3x cycle activated." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Approval failed.", detail = ex.Message });
        }
    }

    [HttpPost("investment-requests/{id}/reject")]
    public async Task<IActionResult> RejectRequest(long id, [FromBody] RejectInvestmentRequestDto request)
    {
        try
        {
            var success = await _investmentService.RejectRequestAsync(CurrentUserId, id, request.Reason);
            return Ok(new { success, message = "Investment request rejected. Reason stored." });
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
