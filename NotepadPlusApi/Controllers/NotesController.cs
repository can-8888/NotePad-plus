using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Data;
using NotepadPlusApi.Models;

namespace NotepadPlusApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NotesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Note>>> GetNotes()
    {
        var notes = await _context.Notes.ToListAsync();
        return Ok(notes);
    }

    [HttpPost]
    public async Task<ActionResult<Note>> CreateNote([FromBody] Note note)
    {
        try
        {
            note.CreatedAt = DateTime.UtcNow;
            note.UpdatedAt = DateTime.UtcNow;
            
            _context.Notes.Add(note);
            await _context.SaveChangesAsync();

            return Ok(note);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error creating note: {ex.Message}" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateNote(int id, [FromBody] NoteDto noteDto)
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

            // Create response object
            var response = new
            {
                id = existingNote.Id,
                title = existingNote.Title,
                content = existingNote.Content,
                category = existingNote.Category,
                createdAt = existingNote.CreatedAt,
                updatedAt = existingNote.UpdatedAt,
                userId = existingNote.UserId
            };

            // Use JsonResult directly
            return new JsonResult(response)
            {
                StatusCode = 200,
                ContentType = "application/json",
                SerializerSettings = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = null,
                    WriteIndented = true
                }
            };
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
}