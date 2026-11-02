using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Valexis.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected long CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(idClaim, out var id) ? id : 0;
        }
    }

    protected string CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    protected string CurrentUsername => User.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;
}
