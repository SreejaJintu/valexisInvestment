using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.DTOs;
using Valexis.Application.Services;

namespace Valexis.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvestmentsController : BaseApiController
{
    private readonly IInvestmentService _investmentService;

    public InvestmentsController(IInvestmentService investmentService)
    {
        _investmentService = investmentService;
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _investmentService.GetCurrentSettingsAsync();
        return Ok(settings);
    }

    [HttpPost("request")]
    public async Task<IActionResult> SubmitInvestmentRequest([FromBody] CreateInvestmentRequestDto request)
    {
        try
        {
            var result = await _investmentService.SubmitRequestAsync(CurrentUserId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to submit investment request.", detail = ex.Message });
        }
    }

    [HttpGet("my-requests")]
    public async Task<IActionResult> GetMyRequests()
    {
        var requests = await _investmentService.GetMyRequestsAsync(CurrentUserId);
        return Ok(requests);
    }

    [HttpGet("my-investments")]
    public async Task<IActionResult> GetMyInvestments()
    {
        var investments = await _investmentService.GetMyInvestmentsAsync(CurrentUserId);
        return Ok(investments);
    }
}
