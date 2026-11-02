using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Valexis.Application.DTOs;
using Valexis.Application.Services;

namespace Valexis.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : BaseApiController
{
    private readonly IAuthService _authService;

    public ProfileController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _authService.GetUserProfileAsync(CurrentUserId);
        if (profile == null) return NotFound();
        return Ok(profile);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        try
        {
            var success = await _authService.ChangePasswordAsync(CurrentUserId, request);
            if (!success) return BadRequest(new { message = "Failed to change password." });
            return Ok(new { message = "Password updated successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
