export enum NoteStatus {
    Personal = 0,
    Shared = 1,
    Public = 2
}

export interface Note {
    id: number;
    title: string;
    content: string;
    category: string;
    userId: number;
    owner?: string;
    status: NoteStatus;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
    collaborators?: User[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
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
    user?: User;
}

// Helper function to convert API response to Note
export const convertApiResponseToNote = (apiNote: NoteApiResponse): Note => ({
    ...apiNote,
    createdAt: new Date(apiNote.createdAt),
    updatedAt: new Date(apiNote.updatedAt),
    status: apiNote.status as NoteStatus  // Ensure proper enum conversion
});

// Helper function to ensure proper status conversion
export const getNoteStatus = (status: string | number | NoteStatus): NoteStatus => {
    if (typeof status === 'number') {
        return status as NoteStatus;
    }
    
    switch (status.toString().toLowerCase()) {
        case 'personal':
        case '0':
            return NoteStatus.Personal;
        case 'shared':
        case '1':
            return NoteStatus.Shared;
        case 'public':
        case '2':
            return NoteStatus.Public;
        default:
            return NoteStatus.Personal;
    }
};