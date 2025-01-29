import { Note, User } from '../types/Note';
import { LoginRequest, RegisterRequest } from '../types/Auth';

const API_URL = 'http://localhost:5000/api';

// Update the user type to match C# casing
interface CurrentUser {
    Id: number;  // Changed from id to Id
    Username: string;  // Changed from username to Username
}

// Update the getCurrentUser function
const getCurrentUser = (): CurrentUser | null => {
    const userJson = localStorage.getItem('user');
    console.log('User from localStorage:', userJson);
    if (!userJson) return null;
    try {
        const user = JSON.parse(userJson);
        console.log('Parsed user:', user);
        // Update validation to check for Id instead of id
        if (!user || typeof user.Id !== 'number') {
            console.log('Invalid user object:', user);
            return null;
        }
        return user;
    } catch (err) {
        console.error('Error parsing user:', err);
        return null;
    }
};

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
        const user = await response.json();
        // Store the user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        return user;
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
        const user = getCurrentUser();
        if (!user?.Id) {
            throw new Error('User not authenticated');
        }

        console.log('Fetching notes with userId:', user.Id); // Debug log

        const response = await fetch(`${API_URL}/notes`, {
            headers: {
                'Content-Type': 'application/json',
                'UserId': user.Id.toString()
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch notes');
        }

        const notes = await response.json();
        console.log('Raw API response:', notes); // Debug log

        const formattedNotes = notes.map((note: any) => ({
            id: note.id,
            title: note.title,
            content: note.content,
            category: note.category,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
            userId: note.userId,
            isPublic: note.isPublic,
            user: note.user
        }));

        console.log('Formatted notes:', formattedNotes); // Debug log
        return formattedNotes;
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
        const user = getCurrentUser();
        if (!user?.Id) {
            throw new Error('User not authenticated');
        }

        console.log('Creating note:', note);

        const response = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'UserId': user.Id.toString()
            },
            body: JSON.stringify({
                title: note.title || '',
                content: note.content || '',
                category: note.category || '',
                userId: user.Id
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create note');
        }

        const createdNote = await response.json();
        console.log('Created note response:', createdNote);

        // Convert the response to match our Note interface
        return {
            id: createdNote.Id,
            title: createdNote.Title,
            content: createdNote.Content,
            category: createdNote.Category,
            createdAt: new Date(createdNote.CreatedAt),
            updatedAt: new Date(createdNote.UpdatedAt),
            userId: createdNote.UserId,
            isPublic: createdNote.IsPublic,
            user: createdNote.User ? {
                id: createdNote.User.Id,
                username: createdNote.User.Username,
                email: createdNote.User.Email,
                createdAt: new Date(createdNote.User.CreatedAt)
            } : undefined
        };
    },

    updateNote: async (id: number, note: Partial<Note>): Promise<Note> => {
        try {
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
                const error = await response.text();
                throw new Error(error || 'Failed to update note');
            }

            const updatedNote = await response.json();
            return {
                ...updatedNote,
                createdAt: new Date(updatedNote.createdAt),
                updatedAt: new Date(updatedNote.updatedAt)
            };
        } catch (err) {
            console.error('Update error:', err);
            throw err;
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

    shareNote: async (noteId: number, collaboratorId: number): Promise<void> => {
        const user = getCurrentUser();
        if (!user?.Id) {  // Changed from id to Id
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${API_URL}/notes/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'UserId': user.Id.toString()  // Changed from id to Id
            },
            body: JSON.stringify({
                noteId,
                collaboratorId
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to share note');
        }
    },

    getSharedNotes: async (): Promise<Note[]> => {
        const user = getCurrentUser();
        if (!user?.Id) {  // Changed from id to Id
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${API_URL}/notes/shared`, {
            headers: {
                'Content-Type': 'application/json',
                'UserId': user.Id.toString()  // Changed from id to Id
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch shared notes');
        }
        
        const notes = await response.json();
        return notes.map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt)
        }));
    },

    makeNotePublic: async (id: number): Promise<void> => {
        const user = getCurrentUser();
        if (!user?.Id) {  // Changed from id to Id
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${API_URL}/notes/${id}/make-public`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'UserId': user.Id.toString()  // Changed from id to Id
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to make note public');
        }
    },
};