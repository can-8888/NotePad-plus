namespace NotepadPlusApi.Models
{
    public class NoteShare
    {
        public int Id { get; set; }
        public int NoteId { get; set; }
        public int UserId { get; set; }
        public DateTime SharedAt { get; set; }
        
        public virtual Note Note { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
} 