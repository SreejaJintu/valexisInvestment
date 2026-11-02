using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valexis.Application.DTOs;
using Valexis.Infrastructure.Data;

namespace Valexis.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationController : BaseApiController
{
    private readonly ValexisDbContext _dbContext;

    public NotificationController(ValexisDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int limit = 20)
    {
        var notifications = await _dbContext.Notifications
            .Where(n => n.UserId == CurrentUserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new NotificationDto
            {
                NotificationId = n.NotificationId,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPost("{id}/mark-read")]
    public async Task<IActionResult> MarkAsRead(long id)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == id && n.UserId == CurrentUserId);

        if (notification != null)
        {
            notification.IsRead = true;
            await _dbContext.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var unread = await _dbContext.Notifications
            .Where(n => n.UserId == CurrentUserId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { success = true, markedCount = unread.Count });
    }
}
