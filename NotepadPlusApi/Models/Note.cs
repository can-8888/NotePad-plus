using System.Text.Json.Serialization;

namespace NotepadPlusApi.Models;

public class Note
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UserId { get; set; }
    public bool IsPublic { get; set; }
    
    [JsonIgnore]
    public virtual User? User { get; set; }
    
    // Add collaborators
    [JsonIgnore]
    public virtual ICollection<User> Collaborators { get; set; } = new List<User>();
}