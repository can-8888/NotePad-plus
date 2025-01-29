using Microsoft.AspNetCore.SignalR;
using NotepadPlusApi.Models;

namespace NotepadPlusApi.Hubs;

public class NoteHub : Hub
{
    private readonly ILogger<NoteHub> _logger;

    public NoteHub(ILogger<NoteHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinNote(int noteId)
    {
        var username = Context.User?.Identity?.Name ?? "Anonymous";
        await Groups.AddToGroupAsync(Context.ConnectionId, $"note_{noteId}");
        await Clients.OthersInGroup($"note_{noteId}").SendAsync("CollaboratorJoined", username);
        _logger.LogInformation($"User {username} joined note {noteId}");
    }

    public async Task LeaveNote(int noteId)
    {
        var username = Context.User?.Identity?.Name ?? "Anonymous";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"note_{noteId}");
        await Clients.OthersInGroup($"note_{noteId}").SendAsync("CollaboratorLeft", username);
        _logger.LogInformation($"User {username} left note {noteId}");
    }

    public async Task UpdateNote(int noteId, string content)
    {
        await Clients.OthersInGroup($"note_{noteId}").SendAsync("NoteUpdated", noteId, content);
        _logger.LogInformation($"Note {noteId} updated");
    }

    public async Task CursorMoved(int noteId, string username, int position)
    {
        await Clients.OthersInGroup($"note_{noteId}").SendAsync("CursorMoved", username, position);
    }

    public async Task StartTyping(int noteId)
    {
        var username = Context.User?.Identity?.Name ?? "Anonymous";
        await Clients.OthersInGroup($"note_{noteId}").SendAsync("UserStartedTyping", username);
    }

    public async Task StopTyping(int noteId)
    {
        var username = Context.User?.Identity?.Name ?? "Anonymous";
        await Clients.OthersInGroup($"note_{noteId}").SendAsync("UserStoppedTyping", username);
    }
} 