import { User } from './Auth';

export enum NoteStatus {
    Personal = 'Personal',  // 0
    Shared = 'Shared',     // 1
    Public = 'Public'      // 2
}

export interface NoteShare {
    noteId: number;
    userId: number;
    user?: User;
    sharedAt: string;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    category?: string;
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
    status: NoteStatus;
    owner?: User;
    userId: number;
    noteShares?: NoteShare[];
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
        name: string;
        createdAt: string;
    };
    ownerId: number;
}

export interface ApiResponse<T> {
    data: T;
}

// Update the converter function to handle the new owner structure
export const convertApiResponseToNote = (apiNote: NoteApiResponse): Note => ({
    id: apiNote.id,
    title: apiNote.title,
    content: apiNote.content,
    category: apiNote.category,
    createdAt: apiNote.createdAt,
    updatedAt: apiNote.updatedAt,
    isPublic: apiNote.isPublic,
    status: getNoteStatus(apiNote.status),
    owner: apiNote.owner ? {
        id: apiNote.owner.id,
        username: apiNote.owner.username,
        email: apiNote.owner.email,
        name: apiNote.owner.name,
        createdAt: apiNote.owner.createdAt
    } : undefined,
    userId: apiNote.ownerId
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