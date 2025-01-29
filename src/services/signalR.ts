import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { getCurrentUser } from './api';

class SignalRService {
    private hubConnection: HubConnection | null = null;
    private currentNoteId: number | null = null;
    private handlers: { [key: string]: (...args: any[]) => void } = {};

    public async startConnection(): Promise<void> {
        try {
            this.hubConnection = new HubConnectionBuilder()
                .withUrl(`${process.env.REACT_APP_API_URL}/notehub`)
                .withAutomaticReconnect()
                .build();

            await this.hubConnection.start();
            console.log('SignalR Connected');
        } catch (err) {
            console.error('Error starting SignalR:', err);
        }
    }

    public async joinNote(noteId: number): Promise<void> {
        if (this.currentNoteId) {
            await this.leaveNote(this.currentNoteId);
        }
        
        if (this.hubConnection?.state === HubConnectionState.Connected) {
            await this.hubConnection.invoke('JoinNote', noteId);
            this.currentNoteId = noteId;
        }
    }

    public async leaveNote(noteId: number): Promise<void> {
        if (this.hubConnection?.state === HubConnectionState.Connected) {
            await this.hubConnection.invoke('LeaveNote', noteId);
            this.currentNoteId = null;
        }
    }

    public onNoteUpdated(callback: (noteId: number, content: string) => void): void {
        this.handlers['NoteUpdated'] = callback;
        this.hubConnection?.on('NoteUpdated', callback);
    }

    public async updateNote(noteId: number, content: string): Promise<void> {
        if (this.hubConnection?.state === HubConnectionState.Connected) {
            await this.hubConnection.invoke('UpdateNote', noteId, content);
        }
    }

    public onCursorMoved(callback: (username: string, position: number) => void): void {
        this.handlers['CursorMoved'] = callback;
        this.hubConnection?.on('CursorMoved', callback);
    }

    public async updateCursorPosition(noteId: number, position: number): Promise<void> {
        const user = getCurrentUser();
        if (user && this.hubConnection?.state === HubConnectionState.Connected) {
            await this.hubConnection.invoke('CursorMoved', noteId, user.Username, position);
        }
    }

    // Add new methods for collaborator presence
    public onCollaboratorJoined(callback: (username: string) => void): void {
        this.handlers['CollaboratorJoined'] = callback;
        this.hubConnection?.on('CollaboratorJoined', callback);
    }

    public onCollaboratorLeft(callback: (username: string) => void): void {
        this.handlers['CollaboratorLeft'] = callback;
        this.hubConnection?.on('CollaboratorLeft', callback);
    }

    // Helper method to remove event handlers when needed
    public removeAllHandlers(): void {
        if (this.hubConnection) {
            Object.entries(this.handlers).forEach(([event, handler]) => {
                this.hubConnection?.on(event, handler);  // Re-register with empty handler
            });
            this.handlers = {};
        }
    }

    public onUserStartedTyping(callback: (username: string) => void): void {
        this.handlers['UserStartedTyping'] = callback;
        this.hubConnection?.on('UserStartedTyping', callback);
    }

    public onUserStoppedTyping(callback: (username: string) => void): void {
        this.handlers['UserStoppedTyping'] = callback;
        this.hubConnection?.on('UserStoppedTyping', callback);
    }

    public async notifyTypingStarted(noteId: number): Promise<void> {
        if (this.hubConnection?.state === HubConnectionState.Connected) {
            await this.hubConnection.invoke('StartTyping', noteId);
        }
    }

    public async notifyTypingStopped(noteId: number): Promise<void> {
        if (this.hubConnection?.state === HubConnectionState.Connected) {
            await this.hubConnection.invoke('StopTyping', noteId);
        }
    }
}

export const signalRService = new SignalRService(); 