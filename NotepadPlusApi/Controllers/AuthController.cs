using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Data;
using NotepadPlusApi.Models;
using System.Security.Cryptography;
using System.Text;

namespace NotepadPlusApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(ApplicationDbContext context, ILogger<AuthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<User>> Login(LoginDto request)
    {
        _logger.LogInformation($"Login attempt for username: {request.Username}");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null)
        {
            _logger.LogWarning($"User not found: {request.Username}");
            return Unauthorized("Invalid username or password");
        }

        var hashedPassword = HashPassword(request.Password);
        _logger.LogInformation($"Stored hash: {user.PasswordHash}");
        _logger.LogInformation($"Input hash: {hashedPassword}");

        if (user.PasswordHash != hashedPassword)
        {
            _logger.LogWarning($"Invalid password for user: {request.Username}");
            return Unauthorized("Invalid username or password");
        }

        _logger.LogInformation($"Login successful for user: {request.Username}");

        // Don't return the password hash
        user.PasswordHash = "";
        return Ok(user);
    }

    [HttpPost("register")]
    public async Task<ActionResult<User>> Register(RegisterDto request)
    {
        _logger.LogInformation($"Registration attempt for username: {request.Username}");

        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            _logger.LogWarning($"Username already exists: {request.Username}");
            return BadRequest("Username already exists");
        }

        var hashedPassword = HashPassword(request.Password);
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = hashedPassword,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"User registered successfully: {request.Username}");

        // Don't return the password hash
        user.PasswordHash = "";
        return Ok(user);
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }
}