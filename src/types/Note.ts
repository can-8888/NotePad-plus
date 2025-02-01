export enum NoteStatus {
    Personal = 'Personal',
    Shared = 'Shared',
    Public = 'Public'
}

export interface User {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    category: string;
    userId: number;
    owner: string;
    status: NoteStatus;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
    collaborators?: User[];
}

export interface NoteApiResponse {
    id: number;
    title: string;
    content: string;
    category: string;
    createdAt: string;  // API returns dates as strings
    updatedAt: string;
    userId: number;
    isPublic: boolean;
    status: NoteStatus;
    owner: string;  // Add owner to match Note interface
    user?: User;
}

// Helper function to convert API response to Note
export const convertApiResponseToNote = (apiNote: NoteApiResponse): Note => ({
    ...apiNote,
    createdAt: new Date(apiNote.createdAt),
    updatedAt: new Date(apiNote.updatedAt),
    status: apiNote.status
});

// Helper function to ensure proper status conversion
export const getNoteStatus = (status: string | NoteStatus): NoteStatus => {
    if (typeof status === 'string') {
        switch (status.toLowerCase()) {
            case 'personal':
                return NoteStatus.Personal;
            case 'shared':
                return NoteStatus.Shared;
            case 'public':
                return NoteStatus.Public;
            default:
                return NoteStatus.Personal;
        }
    }
    return status;
};