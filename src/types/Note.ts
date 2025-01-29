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
}