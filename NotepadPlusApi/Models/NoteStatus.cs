namespace NotepadPlusApi.Models
{
    public enum NoteStatus
    {
        Personal,    // Only visible to owner
        Shared,      // Visible to specific users
        Public       // Visible to all authenticated users
    }
} 