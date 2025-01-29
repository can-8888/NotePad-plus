export interface Note {
    id: number;
    title: string;
    content: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
}