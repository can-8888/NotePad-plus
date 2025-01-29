using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Data;
using NotepadPlusApi.Models;

namespace NotepadPlusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "Users controller is working" });
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string term)
    {
        try
        {
            _logger.LogInformation($"Search request received with term: {term}");

            if (string.IsNullOrEmpty(term) || term.Length < 2)
            {
                return Ok(new { users = Array.Empty<object>() });
            }

            var userId = Request.Headers["UserId"].FirstOrDefault();
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int currentUserId))
            {
                return BadRequest(new { message = "Invalid or missing UserId header" });
            }

            var users = await _context.Users
                .AsNoTracking()
                .Where(u => 
                    u.Id != currentUserId &&
                    (u.Username.Contains(term) || u.Email.Contains(term))
                )
                .Select(u => new
                {
                    id = u.Id,
                    username = u.Username,
                    email = u.Email,
                    createdAt = u.CreatedAt
                })
                .Take(10)
                .ToListAsync();

            return Ok(new { users });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("ping")]
    public ActionResult<string> Ping()
    {
        _logger.LogInformation("Ping endpoint called");
        return Ok("Users controller is responding");
    }

    [HttpGet("test")]
    public ActionResult TestEndpoint()
    {
        return Ok(new { message = "Users controller is working" });
    }
} 