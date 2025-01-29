using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Data;
using NotepadPlusApi.Models;
using Microsoft.Extensions.Logging;

namespace NotepadPlusApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NotesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotesController> _logger;

    public NotesController(ApplicationDbContext context, ILogger<NotesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Note>>> GetNotes()
    {
        try
        {
            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            _logger.LogInformation($"Getting notes for user ID: {userIdString}");

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                _logger.LogWarning("User ID not provided or invalid");
                return BadRequest(new { message = "User ID not provided" });
            }

            var notes = await _context.Notes
                .Include(n => n.User)
                .Where(n => n.UserId == userId)
                .ToListAsync();

            _logger.LogInformation($"Found {notes.Count} notes for user {userId}");
            
            var response = notes.Select(n => new
            {
                id = n.Id,
                title = n.Title,
                content = n.Content,
                category = n.Category,
                createdAt = n.CreatedAt,
                updatedAt = n.UpdatedAt,
                userId = n.UserId,
                isPublic = n.IsPublic,
                user = n.User != null ? new
                {
                    id = n.User.Id,
                    username = n.User.Username,
                    email = n.User.Email,
                    createdAt = n.User.CreatedAt
                } : null
            }).ToList();

            _logger.LogInformation($"Returning {response.Count} formatted notes");
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching notes: {ex}");
            return StatusCode(500, new { message = "Internal server error while fetching notes" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Note>> CreateNote([FromBody] Note note)
    {
        try
        {
            // Validate user ID from headers
            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return BadRequest(new { message = "User ID not provided" });
            }

            // Set creation time
            note.CreatedAt = DateTime.UtcNow;
            note.UpdatedAt = DateTime.UtcNow;
            note.UserId = userId;  // Set the user ID from the authenticated user
            
            _context.Notes.Add(note);
            await _context.SaveChangesAsync();

            // Return with lowercase property names
            return Ok(new
            {
                id = note.Id,
                title = note.Title,
                content = note.Content,
                category = note.Category,
                createdAt = note.CreatedAt,
                updatedAt = note.UpdatedAt,
                userId = note.UserId,
                isPublic = note.IsPublic
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating note: {ex}");
            return BadRequest(new { message = $"Error creating note: {ex.Message}" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Note>> UpdateNote(int id, [FromBody] NoteDto noteDto)
    {
        try
        {
            var existingNote = await _context.Notes.FindAsync(id);
            if (existingNote == null)
            {
                return NotFound(new { message = $"Note with ID {id} not found" });
            }

            existingNote.Title = noteDto.Title;
            existingNote.Content = noteDto.Content;
            existingNote.Category = noteDto.Category;
            existingNote.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Return the updated note
            return Ok(new
            {
                id = existingNote.Id,
                title = existingNote.Title,
                content = existingNote.Content,
                category = existingNote.Category,
                createdAt = existingNote.CreatedAt,
                updatedAt = existingNote.UpdatedAt,
                userId = existingNote.UserId,
                isPublic = existingNote.IsPublic
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error updating note: {ex.Message}" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNote(int id)
    {
        var note = await _context.Notes.FindAsync(id);
        if (note == null)
        {
            return NotFound(new { message = $"Note with ID {id} not found" });
        }

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Note deleted successfully" });
    }

    [HttpPost("share")]
    public async Task<IActionResult> ShareNote([FromBody] ShareNoteDto shareDto)
    {
        try
        {
            var note = await _context.Notes
                .Include(n => n.Collaborators)
                .FirstOrDefaultAsync(n => n.Id == shareDto.NoteId);

            if (note == null)
            {
                return NotFound(new { message = "Note not found" });
            }

            var collaborator = await _context.Users.FindAsync(shareDto.CollaboratorId);
            if (collaborator == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (note.Collaborators.Any(c => c.Id == shareDto.CollaboratorId))
            {
                return BadRequest(new { message = "User is already a collaborator" });
            }

            note.Collaborators.Add(collaborator);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Note shared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error sharing note: {ex}");
            return StatusCode(500, new { message = "Internal server error while sharing note" });
        }
    }

    [HttpGet("shared")]
    public async Task<ActionResult<IEnumerable<Note>>> GetSharedNotes()
    {
        try
        {
            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return BadRequest(new { message = "User ID not provided" });
            }

            var sharedNotes = await _context.Notes
                .Include(n => n.User)
                .Include(n => n.Collaborators)
                .Where(n => n.IsPublic || n.Collaborators.Any(c => c.Id == userId))
                .Select(n => new
                {
                    id = n.Id,
                    title = n.Title,
                    content = n.Content,
                    category = n.Category,
                    createdAt = n.CreatedAt,
                    updatedAt = n.UpdatedAt,
                    userId = n.UserId,
                    isPublic = n.IsPublic,
                    user = new
                    {
                        id = n.User.Id,
                        username = n.User.Username
                    }
                })
                .ToListAsync();

            return Ok(sharedNotes);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching shared notes: {ex}");
            return StatusCode(500, new { message = "Internal server error while fetching shared notes" });
        }
    }

    [HttpPost("{id}/make-public")]
    public async Task<IActionResult> MakeNotePublic(int id)
    {
        try
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
            {
                return NotFound(new { message = "Note not found" });
            }

            note.IsPublic = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Note is now public" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error making note public: {ex}");
            return StatusCode(500, new { message = "Internal server error while making note public" });
        }
    }
}