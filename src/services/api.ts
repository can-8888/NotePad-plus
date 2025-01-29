import { Note, User } from '../types/Note';
import { LoginRequest, RegisterRequest } from '../types/Auth';

const API_URL = 'http://localhost:5000/api';

export const api = {
    // Auth operations
    login: async (credentials: LoginRequest): Promise<User> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Login failed');
        }
        return response.json();
    },

    register: async (userData: RegisterRequest): Promise<User> => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Registration failed');
        }
        return response.json();
    },

    // Note operations
    getNotes: async (): Promise<Note[]> => {
        const response = await fetch(`${API_URL}/notes`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to fetch notes');
        }
        return response.json();
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
        const response = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: note.title,
                content: note.content,
                category: note.category,
                userId: note.userId
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to create note');
        }
        return response.json();
    },
    updateNote: async (id: number, note: Partial<Note>): Promise<Note> => {
        const response = await fetch(`${API_URL}/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                title: note.title || '',
                content: note.content || '',
                category: note.category || '',
                userId: note.userId
            }),
        });
    
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update note');
        }
    
        try {
            const data = await response.json();
            if (!data) {
                throw new Error('No data received from server');
            }
            return data;
        } catch (err) {
            console.error('Error parsing response:', err);
            throw new Error('Failed to parse server response');
        }
    },

    deleteNote: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/notes/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to delete note');
        }
    },
};