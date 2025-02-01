using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NotepadPlusApi.Models;
using NotepadPlusApi.Data;
using Microsoft.Extensions.Logging;
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

                return await _context.Notes
                    .Include(n => n.Owner)
                    .Where(n => n.Status == NoteStatus.Public)
                    .OrderByDescending(n => n.UpdatedAt)
                    .Select(n => new Note
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Content = n.Content,
                        Category = n.Category,
                        OwnerId = n.OwnerId,
                        Status = n.Status,
                        IsPublic = n.IsPublic,
                        CreatedAt = n.CreatedAt,
                        UpdatedAt = n.UpdatedAt,
                        Owner = new User
                        {
                            Id = n.Owner.Id,
                            Username = n.Owner.Username,
                            Email = n.Owner.Email
                        }
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public notes");
                throw;
            }
        }

        public async Task<IEnumerable<Note>> GetSharedNotesAsync(int userId)
        {
            _logger.LogInformation($"Getting shared notes for user {userId}");

            try
            {
                return await _context.Notes
                    .Include(n => n.Owner)
                    .Include(n => n.Collaborators)
                    .Include(n => n.SharedWith)
                    .Where(n => (n.Status == NoteStatus.Shared && n.Collaborators.Any(c => c.Id == userId)) || 
                               n.SharedWith.Any(s => s.UserId == userId))
                    .OrderByDescending(n => n.UpdatedAt)
                    .Select(n => new Note
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Content = n.Content,
                        Category = n.Category,
                        OwnerId = n.OwnerId,
                        Status = n.Status,
                        IsPublic = n.IsPublic,
                        CreatedAt = n.CreatedAt,
                        UpdatedAt = n.UpdatedAt,
                        Owner = new User
                        {
                            Id = n.Owner.Id,
                            Username = n.Owner.Username,
                            Email = n.Owner.Email
                        }
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shared notes");
                throw;
            }
        }

        public async Task<IEnumerable<Note>> GetPersonalNotesAsync(int userId)
        {
            try
            {
                _logger.LogInformation($"Getting all notes for user {userId}");

                return await _context.Notes
                    .Include(n => n.Owner)
                    .Include(n => n.Permissions)
                    .Where(n => n.OwnerId == userId || // Notes owned by user
                               n.Permissions.Any(p => p.UserId == userId)) // Notes with permissions
                    .OrderByDescending(n => n.UpdatedAt)
                    .Select(n => new Note
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Content = n.Content,
                        Category = n.Category,
                        OwnerId = n.OwnerId,
                        Status = n.Status,
                        IsPublic = n.IsPublic,
                        CreatedAt = n.CreatedAt,
                        UpdatedAt = n.UpdatedAt,
                        Owner = new User
                        {
                            Id = n.Owner.Id,
                            Username = n.Owner.Username,
                            Email = n.Owner.Email
                        },
                        Permissions = n.Permissions.Select(p => new NotePermission
                        {
                            UserId = p.UserId,
                            PermissionType = p.PermissionType,
                            User = new User
                            {
                                Id = p.User.Id,
                                Username = p.User.Username,
                                Email = p.User.Email
                            }
                        }).ToList()
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting notes for user {userId}");
                throw;
            }
        }

        public async Task<Note> CreateNoteAsync(Note note)
        {
            try
            {
                _logger.LogInformation($"Creating note for user {note.OwnerId}");

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
                    .Include(n => n.Collaborators)
                    .Include(n => n.SharedWith)
                    .FirstOrDefaultAsync(n => n.Id == id);

                if (note != null)
                {
                    note.Collaborators.Clear();
                    note.SharedWith.Clear();
                    
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
                    .Include(n => n.Owner)
                    .FirstOrDefaultAsync(n => n.Id == noteId);

                if (note == null)
                {
                    throw new KeyNotFoundException($"Note with id {noteId} not found");
                }

                _logger.LogInformation($"Before update - Note {noteId}: Status={note.Status} ({(int)note.Status})");

                note.Status = NoteStatus.Public;
                note.IsPublic = true;
                note.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"After update - Note {noteId}: Status={note.Status} ({(int)note.Status})");

                return note;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error making note {noteId} public");
                throw;
            }
        }
    }
}