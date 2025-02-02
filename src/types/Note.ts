export enum NoteStatus {
    Personal = 'Personal',  // 0
    Shared = 'Shared',     // 1
    Public = 'Public'      // 2
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
    category?: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    status: NoteStatus;
    owner?: User;
    ownerId: number;
    sharedWith?: User[];
}

export interface NoteApiResponse {
    id: number;
    title: string;
    content: string;
    category: string;
    createdAt: string;  // API returns dates as strings
    updatedAt: string;
    isPublic: boolean;
    status: NoteStatus;
    owner: {
        id: number;
        username: string;
        email: string;
    };
    ownerId: number;
}

export interface ApiResponse<T> {
    data: T;
    // ... any other response properties
}

// Update the converter function to handle the new owner structure
export const convertApiResponseToNote = (apiNote: NoteApiResponse): Note => ({
    id: apiNote.id,
    title: apiNote.title,
    content: apiNote.content,
    category: apiNote.category,
    createdAt: new Date(apiNote.createdAt),
    updatedAt: new Date(apiNote.updatedAt),
    isPublic: apiNote.isPublic,
    status: getNoteStatus(apiNote.status),
    owner: apiNote.owner ? {
        id: apiNote.owner.id,
        username: apiNote.owner.username,
        email: apiNote.owner.email,
        createdAt: new Date()  // Since API doesn't provide this, use current date
    } : undefined,
    ownerId: apiNote.ownerId
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