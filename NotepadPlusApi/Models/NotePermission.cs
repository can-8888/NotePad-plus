namespace NotepadPlusApi.Models
{
    public class NotePermission
    {
        public int Id { get; set; }
        public int NoteId { get; set; }
        public int UserId { get; set; }
        public NotePermissionType PermissionType { get; set; }
        public DateTime GrantedAt { get; set; }
        
        public virtual Note Note { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
} 