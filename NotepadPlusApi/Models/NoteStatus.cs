using System.Text.Json.Serialization;

namespace NotepadPlusApi.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum NoteStatus
    {
        Personal = 0,    // Only visible to owner
        Shared = 1,      // Visible to specific users
        Public = 2       // Visible to all authenticated users
    }
} 