using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace NotepadPlusApi.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Remove the Notes navigation property if it exists
    // [JsonIgnore]
    // public virtual ICollection<Note> Notes { get; set; } = new List<Note>();
}