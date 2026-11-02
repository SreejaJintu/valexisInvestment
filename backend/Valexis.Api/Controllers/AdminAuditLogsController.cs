using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Application.Interfaces;

namespace Valexis.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/audit-logs")]
public class AdminAuditLogsController : BaseApiController
{
    private readonly IApplicationDbContext _dbContext;

    public AdminAuditLogsController(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs()
    {
        var logs = await _dbContext.AdminAuditLogs
            .Include(a => a.AdminUser)
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .Select(a => new AuditLogDto
            {
                AuditLogId = a.AuditLogId,
                AdminUsername = a.AdminUser != null ? a.AdminUser.Username : "Admin",
                Action = a.Action,
                TargetEntity = a.TargetEntity,
                TargetId = a.TargetId,
                Details = a.Details,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }
}
