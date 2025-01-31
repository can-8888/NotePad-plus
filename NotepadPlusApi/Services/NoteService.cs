using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NotepadPlusApi.Models;
using NotepadPlusApi.Data;

namespace NotepadPlusApi.Services
{
    public class NoteService : INoteService
    {
        private readonly ApplicationDbContext _context;

        public NoteService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Note>> GetPublicNotesAsync()
        {
            return await _context.Notes
                .Where(n => n.Status == NoteStatus.Public)
                .Include(n => n.User)
                .OrderByDescending(n => n.UpdatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Note>> GetPersonalNotesAsync(int userId)
        {
            return await _context.Notes
                .Where(n => n.UserId == userId && n.Status == NoteStatus.Personal)
                .Include(n => n.User)
                .OrderByDescending(n => n.UpdatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Note>> GetSharedNotesAsync(int userId)
        {
            return await _context.Notes
                .Where(n => n.Status == NoteStatus.Shared && 
                           n.Collaborators.Any(c => c.Id == userId))
                .Include(n => n.User)
                .OrderByDescending(n => n.UpdatedAt)
                .ToListAsync();
        }

        // Add other required interface methods here
    }
} 