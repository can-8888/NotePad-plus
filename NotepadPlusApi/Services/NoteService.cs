using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NotepadPlusApi.Models;
using NotepadPlusApi.Data;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System;

namespace NotepadPlusApi.Services
{
    public class NoteService : INoteService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NoteService> _logger;

        public NoteService(ApplicationDbContext context, ILogger<NoteService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<Note>> GetPublicNotesAsync()
        {
            try
            {
                _logger.LogInformation("Getting public notes");

                var publicNotes = await _context.Notes
                    .Include(n => n.User)
                    .Where(n => n.Status == NoteStatus.Public)
                    .OrderByDescending(n => n.UpdatedAt)
                    .Select(n => new Note
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Content = n.Content,
                        Category = n.Category,
                        UserId = n.UserId,
                        Status = n.Status,
                        IsPublic = n.IsPublic,
                        CreatedAt = n.CreatedAt,
                        UpdatedAt = n.UpdatedAt,
                        User = new User 
                        { 
                            Id = n.User.Id,
                            Username = n.User.Username 
                        }
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {publicNotes.Count} public notes");
                foreach (var note in publicNotes)
                {
                    _logger.LogInformation($"Public note: Id={note.Id}, Status={note.Status} ({(int)note.Status})");
                }

                return publicNotes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public notes");
                throw;
            }
        }

        public async Task<IEnumerable<Note>> GetPersonalNotesAsync(int userId)
        {
            // Get only personal notes owned by the user
            return await _context.Notes
                .Include(n => n.User)
                .Where(n => n.UserId == userId && n.Status == NoteStatus.Personal)
                .OrderByDescending(n => n.UpdatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Note>> GetSharedNotesAsync(int userId)
        {
            _logger.LogInformation($"Getting shared notes for user {userId}");

            try
            {
                // Include all necessary relationships and handle both shared with me and my shared notes
                var sharedNotes = await _context.Notes
                    .Include(n => n.User)
                    .Include(n => n.Collaborators)
                    .Include(n => n.SharedWith)
                    .Where(n => (n.Status == NoteStatus.Shared && n.Collaborators.Any(c => c.Id == userId)) || 
                               n.SharedWith.Any(s => s.UserId == userId))
                    .OrderByDescending(n => n.UpdatedAt)
                    .ToListAsync();

                _logger.LogInformation($"Found {sharedNotes.Count} shared notes for user {userId}");
                foreach (var note in sharedNotes)
                {
                    _logger.LogDebug($"Shared note: Id={note.Id}, Title={note.Title}, " +
                                   $"Owner={note.User?.Username}, " +
                                   $"Status={note.Status}, " +
                                   $"Collaborators={note.Collaborators.Count}");
                }

                return sharedNotes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shared notes");
                throw;
            }
        }

        public async Task<Note> CreateNoteAsync(Note note)
        {
            try
            {
                _logger.LogInformation($"Creating note for user {note.UserId}");

                // Ensure required fields are set
                note.CreatedAt = DateTime.UtcNow;
                note.UpdatedAt = DateTime.UtcNow;
                note.Status = NoteStatus.Personal;
                note.IsPublic = false;

                _context.Notes.Add(note);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Note created successfully with ID: {note.Id}");
                return note;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating note");
                throw;
            }
        }

        public async Task<Note> UpdateNoteAsync(int id, Note note)
        {
            var existingNote = await _context.Notes.FindAsync(id);
            if (existingNote == null)
            {
                throw new KeyNotFoundException($"Note with id {id} not found");
            }

            existingNote.Title = note.Title;
            existingNote.Content = note.Content;
            existingNote.Category = note.Category;
            existingNote.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingNote;
        }

        public async Task DeleteNoteAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Deleting note {id}");

                var note = await _context.Notes
                    .Include(n => n.Collaborators)  // Include related collaborators
                    .Include(n => n.SharedWith)     // Include related shares
                    .FirstOrDefaultAsync(n => n.Id == id);

                if (note != null)
                {
                    // Clear the relationships first
                    note.Collaborators.Clear();
                    note.SharedWith.Clear();
                    
                    // Then remove the note
                    _context.Notes.Remove(note);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"Note {id} deleted successfully");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting note {id}");
                throw;
            }
        }

        public async Task ShareNoteAsync(int noteId, int collaboratorId)
        {
            var note = await _context.Notes
                .Include(n => n.Collaborators)
                .FirstOrDefaultAsync(n => n.Id == noteId);

            if (note == null)
            {
                throw new KeyNotFoundException($"Note with id {noteId} not found");
            }

            var collaborator = await _context.Users.FindAsync(collaboratorId);
            if (collaborator == null)
            {
                throw new KeyNotFoundException($"User with id {collaboratorId} not found");
            }

            if (!note.Collaborators.Any(c => c.Id == collaboratorId))
            {
                note.Collaborators.Add(collaborator);
                note.Status = NoteStatus.Shared;  // Update the status when sharing
                note.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Note> MakeNotePublicAsync(int noteId)
        {
            try
            {
                var note = await _context.Notes
                    .Include(n => n.User)
                    .FirstOrDefaultAsync(n => n.Id == noteId);

                if (note == null)
                {
                    throw new KeyNotFoundException($"Note with id {noteId} not found");
                }

                _logger.LogInformation($"Before update - Note {noteId}: Status={note.Status} ({(int)note.Status})");

                // Use direct SQL update with value 2 since we know it works
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE Notes 
                       SET Status = 2,  -- Explicitly use 2 for Public
                           IsPublic = 1, 
                           UpdatedAt = {DateTime.UtcNow} 
                       WHERE Id = {noteId}");

                // Force a reload of the entity
                await _context.Entry(note).ReloadAsync();

                _logger.LogInformation($"After update - Note {noteId}: Status={note.Status} ({(int)note.Status})");

                return note;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error making note {noteId} public");
                throw;
            }
        }

        // Add other required interface methods here
    }
} 