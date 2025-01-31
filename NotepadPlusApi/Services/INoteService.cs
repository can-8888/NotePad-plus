using System.Collections.Generic;
using System.Threading.Tasks;
using NotepadPlusApi.Models;

namespace NotepadPlusApi.Services
{
    public interface INoteService
    {
        Task<IEnumerable<Note>> GetPublicNotesAsync();
        // Add other methods as needed
    }
} 