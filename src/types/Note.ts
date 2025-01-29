export interface Note {
    id: number;
    title: string;
    content: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    isPublic: boolean;
    user?: User;
    collaborators?: User[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    // Add uppercase variants for C# compatibility
    Id?: number;
    Username?: string;
    Email?: string;
    CreatedAt?: Date;
}

export interface NoteApiResponse {
    id?: number;
    Id?: number;
    title?: string;
    Title?: string;
    content?: string;
    Content?: string;
    category?: string;
    Category?: string;
    createdAt?: string;
    CreatedAt?: string;
    updatedAt?: string;
    UpdatedAt?: string;
    userId?: number;
    UserId?: number;
    isPublic?: boolean;
    IsPublic?: boolean;
    user?: User;
    User?: User;
}