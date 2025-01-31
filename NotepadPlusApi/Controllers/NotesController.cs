using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Data;
using NotepadPlusApi.Models;
using Microsoft.Extensions.Logging;
using NotepadPlusApi.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Text.Json;

namespace NotepadPlusApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotesController> _logger;
    private readonly INoteService _noteService;

    public NotesController(
        ApplicationDbContext context,
        ILogger<NotesController> logger,
        INoteService noteService)
    {
        _context = context;
        _logger = logger;
        _noteService = noteService;
    }

    // Base GET endpoint for notes
    [HttpGet]  // Just use HttpGet without any route
    public async Task<ActionResult<IEnumerable<Note>>> GetNotes()
    {
        try
        {
            _logger.LogInformation($"GetNotes endpoint hit at {DateTime.UtcNow}");
            
            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            _logger.LogInformation($"UserId from header: {userIdString}");

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                _logger.LogWarning("Invalid or missing UserId in request headers");
                return BadRequest(new { message = "User ID not provided" });
            }

            var notes = await _noteService.GetPersonalNotesAsync(userId);
            return Ok(notes.Select(n => FormatNoteResponse(n)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notes");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<string> Health()
    {
        _logger.LogInformation("Health check endpoint hit");
        return Ok("API is running");
    }

    [HttpGet("ping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<string> Ping()
    {
        _logger.LogInformation("Ping endpoint hit");
        return Ok("API is running");
    }

    public class CreateNoteRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public NoteStatus Status { get; set; }
        public bool IsPublic { get; set; }
    }

    [HttpPost]
    public async Task<ActionResult<Note>> CreateNote([FromBody] CreateNoteRequest request)
    {
        try
        {
            _logger.LogInformation("Creating new note");

            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return BadRequest(new { message = "User ID not provided" });
            }

            var note = new Note
            {
                Title = request.Title,
                Content = request.Content,
                Category = request.Category,
                UserId = userId,
                Status = NoteStatus.Personal,
                IsPublic = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdNote = await _noteService.CreateNoteAsync(note);
            
            // Return the created note with proper casing
            return CreatedAtAction(
                nameof(GetNotes), 
                new { id = createdNote.Id }, 
                new
                {
                    id = createdNote.Id,
                    title = createdNote.Title,
                    content = createdNote.Content,
                    category = createdNote.Category,
                    userId = createdNote.UserId,
                    status = createdNote.Status,
                    isPublic = createdNote.IsPublic,
                    createdAt = createdNote.CreatedAt,
                    updatedAt = createdNote.UpdatedAt
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating note");
            return StatusCode(500, new { message = "Internal server error while creating note" });
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
        try
        {
            _logger.LogInformation($"Attempting to delete note {id}");

            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return BadRequest(new { message = "User ID not provided" });
            }

            // Verify the note exists and belongs to the user
            var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (note == null)
            {
                return NotFound(new { message = $"Note with ID {id} not found or doesn't belong to the user" });
            }

            await _noteService.DeleteNoteAsync(id);
            return Ok(new { message = "Note deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting note {id}");
            return StatusCode(500, new { message = "Internal server error while deleting note" });
        }
    }

    [HttpPost("{id}/share")]
    public async Task<IActionResult> ShareNote(int id, [FromBody] ShareNoteDto shareDto)
    {
        try
        {
            _logger.LogInformation($"Attempting to share note {id} with user {shareDto.CollaboratorId}");

            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return BadRequest(new { message = "User ID not provided" });
            }

            var note = await _context.Notes
                .Include(n => n.Collaborators)
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (note == null)
            {
                return NotFound(new { message = "Note not found" });
            }

            var collaborator = await _context.Users.FindAsync(shareDto.CollaboratorId);
            if (collaborator == null)
            {
                return NotFound(new { message = "User to share with not found" });
            }

            // Update note status and add collaborator
            note.Status = NoteStatus.Shared;
            note.UpdatedAt = DateTime.UtcNow;
            
            if (!note.Collaborators.Any(c => c.Id == shareDto.CollaboratorId))
            {
                note.Collaborators.Add(collaborator);
            }

            await _context.SaveChangesAsync();

            // Return the updated note
            return Ok(new { 
                message = "Note shared successfully",
                note = new {
                    id = note.Id,
                    status = note.Status,
                    updatedAt = note.UpdatedAt,
                    collaborators = note.Collaborators.Select(c => new { c.Id, c.Username, c.Email })
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sharing note {id}");
            return StatusCode(500, new { message = "Internal server error while sharing note" });
        }
    }

    [HttpGet("shared")]
    public async Task<ActionResult<IEnumerable<Note>>> GetSharedNotes()
    {
        try
        {
            if (!Request.Headers.TryGetValue("UserId", out var userIdHeader))
            {
                return BadRequest(new { message = "User ID not provided" });
            }

            if (!int.TryParse(userIdHeader, out int userId))
            {
                return BadRequest(new { message = "Invalid User ID format" });
            }

            var notes = await _noteService.GetSharedNotesAsync(userId);
            return Ok(notes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shared notes");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("{id}/make-public")]
    public async Task<ActionResult<Note>> MakeNotePublic(int id)
    {
        try
        {
            var userIdString = Request.Headers["UserId"].FirstOrDefault();
            _logger.LogInformation($"MakeNotePublic called with noteId: {id}, userId: {userIdString}");

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return BadRequest(new { message = "User ID not provided" });
            }

            // First verify the note exists and belongs to the user
            var note = await _context.Notes
                .Include(n => n.User)
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (note == null)
            {
                _logger.LogWarning($"Note {id} not found or doesn't belong to user {userId}");
                return NotFound(new { message = "Note not found or access denied" });
            }

            // Make the note public
            var updatedNote = await _noteService.MakeNotePublicAsync(id);

            // Return complete note data
            var noteDto = new
            {
                id = updatedNote.Id,
                title = updatedNote.Title,
                content = updatedNote.Content,
                category = updatedNote.Category,
                userId = updatedNote.UserId,
                owner = updatedNote.User?.Username,
                status = (int)updatedNote.Status,  // Send numeric value
                isPublic = true,
                createdAt = updatedNote.CreatedAt.ToString("o"),
                updatedAt = updatedNote.UpdatedAt.ToString("o")
            };

            _logger.LogInformation($"Returning updated note: {JsonSerializer.Serialize(noteDto)}");
            return Ok(noteDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error making note {id} public");
            return StatusCode(500, new { message = "Failed to make note public" });
        }
    }

    [HttpGet("public")]
    public async Task<ActionResult<IEnumerable<Note>>> GetPublicNotes()
    {
        try
        {
            var notes = await _noteService.GetPublicNotesAsync();
            return Ok(notes.Select(n => FormatNoteResponse(n)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public notes");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<Note>> UpdateNoteStatus(int id, [FromBody] NoteStatus status)
    {
        try
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
                return NotFound();

            note.Status = status;
            note.IsPublic = status == NoteStatus.Public;
            note.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(note);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private async Task EnsureTestData(int userId)
    {
        if (!await _context.Notes.AnyAsync(n => n.UserId == userId))
        {
            var testNote = new Note
            {
                Title = "Test Note",
                Content = "This is a test note",
                Category = "Test",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UserId = userId,
                Status = NoteStatus.Personal,
                IsPublic = false
            };

            _context.Notes.Add(testNote);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Created test note for user {userId}");
        }
    }

    private object FormatNoteResponse(Note note)
    {
        var response = new
        {
            id = note.Id,
            title = note.Title,
            content = note.Content,
            category = note.Category,
            userId = note.UserId,
            owner = note.User?.Username,
            status = note.Status,
            isPublic = note.IsPublic,
            createdAt = note.CreatedAt.ToString("o"),
            updatedAt = note.UpdatedAt.ToString("o")
        };

        _logger.LogInformation($"Formatted note response: {JsonSerializer.Serialize(response)}");
        return response;
    }
}