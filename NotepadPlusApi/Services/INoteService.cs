using System.Collections.Generic;
using System.Threading.Tasks;
using NotepadPlusApi.Models;

namespace NotepadPlusApi.Services
{
    public interface INoteService
    {
        Task<IEnumerable<Note>> GetPersonalNotesAsync(int userId);
        Task<IEnumerable<Note>> GetSharedNotesAsync(int userId);
        Task<IEnumerable<Note>> GetPublicNotesAsync();
        Task<Note> CreateNoteAsync(Note note);
        Task<Note> UpdateNoteAsync(int id, Note note);
        Task DeleteNoteAsync(int id);
        Task ShareNoteAsync(int noteId, int collaboratorId);
        Task<Note> MakeNotePublicAsync(int id);
    }
} 