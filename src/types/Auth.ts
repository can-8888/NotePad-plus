export interface User {
    id: number;
    username: string;
    email: string;
    name?: string;
    createdAt: string;
}

export interface LoginRequest {
    username: string;  // Will accept either username or email
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    name?: string;
}

export interface RegisterResponse {
    user: User;
    token: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}