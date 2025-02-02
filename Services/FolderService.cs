using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Models;
using NotepadPlusApi.Data;

namespace NotepadPlusApi.Services
{
    public class FolderService : IFolderService
    {
        private readonly ApplicationDbContext _context;

        public FolderService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Folder>> GetUserFoldersAsync(int userId)
        {
            return await _context.Folders
                .Where(f => f.UserId == userId)
                .ToListAsync();
        }

        public async Task<Folder> CreateFolderAsync(Folder folder)
        {
            _context.Folders.Add(folder);
            await _context.SaveChangesAsync();
            return folder;
        }

        public async Task<Folder> UpdateFolderAsync(int id, Folder folder)
        {
            var existingFolder = await _context.Folders.FindAsync(id);
            if (existingFolder == null)
                return null;

            existingFolder.Name = folder.Name;
            existingFolder.ParentFolderId = folder.ParentFolderId;
            existingFolder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingFolder;
        }

        public async Task DeleteFolderAsync(int id)
        {
            var folder = await _context.Folders.FindAsync(id);
            if (folder != null)
            {
                _context.Folders.Remove(folder);
                await _context.SaveChangesAsync();
            }
        }
    }
} 