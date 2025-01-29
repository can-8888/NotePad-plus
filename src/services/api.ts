import { Note, User, NoteApiResponse } from '../types/Note';
import { LoginRequest, RegisterRequest } from '../types/Auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Update the user type to match C# casing
interface CurrentUser {
    Id: number;  // Changed from id to Id
    Username: string;  // Changed from username to Username
}

// Export getCurrentUser function
export const getCurrentUser = (): CurrentUser | null => {
    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) return null;

        const user = JSON.parse(userJson);
        if (!user?.Id || typeof user.Id !== 'number') return null;

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

        const userData = await response.json();
        
        // Format the user data to handle both casings
        const formattedUser = {
            id: userData.id || userData.Id,
            username: userData.username || userData.Username,
            email: userData.email || userData.Email,
            createdAt: new Date(userData.createdAt || userData.CreatedAt),
            // Keep the original properties for backward compatibility
            Id: userData.Id || userData.id,
            Username: userData.Username || userData.username,
            Email: userData.Email || userData.email,
            CreatedAt: userData.CreatedAt || userData.createdAt
        };

        // Store the formatted user data in localStorage
        localStorage.setItem('user', JSON.stringify(formattedUser));
        return formattedUser;
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
    getNotes: async (): Promise<NoteApiResponse[]> => {
        const user = getCurrentUser();
        if (!user?.Id) {
            throw new Error('User not authenticated');
        }

        console.log('Fetching notes for user:', user.Id);

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
        console.log('Raw API response:', notes);

        return notes;
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
        const user = getCurrentUser();
        if (!user?.Id) {
            throw new Error('User not authenticated');
        }

        console.log('Creating note with data:', { ...note, userId: user.Id });

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
            console.error('Create note error:', error);
            throw new Error(error.message || 'Failed to create note');
        }

        const createdNote = await response.json();
        console.log('Server response:', createdNote);

        // Convert from C# casing to TypeScript casing
        const formattedNote: Note = {
            id: createdNote.id || createdNote.Id,
            title: createdNote.title || createdNote.Title,
            content: createdNote.content || createdNote.Content,
            category: createdNote.category || createdNote.Category,
            createdAt: new Date(createdNote.createdAt || createdNote.CreatedAt),
            updatedAt: new Date(createdNote.updatedAt || createdNote.UpdatedAt),
            userId: createdNote.userId || createdNote.UserId,
            isPublic: createdNote.isPublic || createdNote.IsPublic,
            user: createdNote.user || createdNote.User
        };

        console.log('Formatted note:', formattedNote);
        return formattedNote;
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

    searchUsers: async (searchTerm: string): Promise<User[]> => {
        const user = getCurrentUser();
        if (!user?.Id) {
            throw new Error('User not authenticated');
        }

        console.log('Starting user search with term:', searchTerm);
        console.log('Current user:', user);

        try {
            // Use lowercase 'users' in the URL
            const url = new URL(`${API_URL}/users/search`);
            url.searchParams.append('term', searchTerm);
            console.log('Request URL:', url.toString());

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'UserId': user.Id.toString()
            };
            console.log('Request headers:', headers);

            // Test the controller first
            const pingResponse = await fetch(`${API_URL}/users/ping`);
            console.log('Ping response:', await pingResponse.text());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            console.log('Raw response text:', responseText);

            if (!response.ok) {
                console.error('Response not OK:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseText
                });
                throw new Error(responseText || `HTTP error! status: ${response.status}`);
            }

            if (!responseText.trim()) {
                console.warn('Empty response received');
                return [];
            }

            try {
                const data = JSON.parse(responseText);
                console.log('Parsed response data:', data);

                if (!data.users) {
                    console.error('Response missing users array:', data);
                    return [];
                }

                const mappedUsers = data.users.map((user: any) => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: new Date(user.createdAt)
                }));
                console.log('Mapped users:', mappedUsers);
                return mappedUsers;

            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid JSON response from server');
            }
        } catch (error) {
            console.error('Search users error:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error instanceof Error ? error : new Error('Failed to search users');
        }
    },
};