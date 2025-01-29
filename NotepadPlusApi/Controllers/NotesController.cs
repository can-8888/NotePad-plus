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
        return await _context.Notes
            .Include(n => n.User)
            .ToListAsync();
    }

[HttpPost]
public async Task<ActionResult<Note>> CreateNote([FromBody] Note note)
{
    try
    {
        // Don't require the User object, just use UserId
        note.CreatedAt = DateTime.UtcNow;
        note.UpdatedAt = DateTime.UtcNow;
        
        _context.Notes.Add(note);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNotes), new { id = note.Id }, note);
    }
    catch (Exception ex)
    {
        return BadRequest($"Error creating note: {ex.Message}");
    }
}

public class NoteDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int UserId { get; set; }
}
  [HttpPut("{id}")]
public async Task<ActionResult<Note>> UpdateNote(int id, [FromBody] Note note)
{
    if (id != note.Id)
    {
        return BadRequest(new { message = "ID mismatch" });
    }

    try
    {
        var existingNote = await _context.Notes.FindAsync(id);
        if (existingNote == null)
        {
            return NotFound(new { message = $"Note with ID {id} not found" });
        }

        // Update the existing note properties
        existingNote.Title = note.Title;
        existingNote.Content = note.Content;
        existingNote.Category = note.Category;
        existingNote.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Create a response object
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

        return Ok(response);
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
            return NotFound();
        }

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool NoteExists(int id)
    {
        return _context.Notes.Any(e => e.Id == id);
    }
}