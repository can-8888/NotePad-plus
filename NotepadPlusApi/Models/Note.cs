using System.Text.Json.Serialization;
using System;
using System.Collections.Generic;

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
    
    public NoteStatus Status { get; set; }
    
    [JsonIgnore]
    public virtual User? User { get; set; }
    
    [JsonIgnore]
    public virtual ICollection<User> Collaborators { get; set; } = new List<User>();

    [JsonIgnore]
    public virtual ICollection<NoteShare> SharedWith { get; set; } = new List<NoteShare>();
}