import { Note, User, NoteApiResponse, NoteStatus, convertApiResponseToNote, getNoteStatus } from '../types/Note';
import { LoginRequest, RegisterRequest } from '../types/Auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add logging to verify the URL
console.log('API_URL:', API_URL);

// Update the user type to match C# casing
interface CurrentUser {
    Id: number;  // Changed from id to Id
    Username: string;  // Changed from username to Username
}

// Export getCurrentUser function
export const getCurrentUser = (): User | null => {
    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) return null;

        const rawUser = JSON.parse(userJson);
        if (!rawUser) return null;

        // Convert PascalCase to camelCase
        return {
            id: rawUser.Id || rawUser.id,
            username: rawUser.Username || rawUser.username,
            email: rawUser.Email || rawUser.email,
            createdAt: new Date(rawUser.CreatedAt || rawUser.createdAt)
        };
    } catch {
        return null;
    }
};

// Add at the top of the file with other utility functions
const getToken = (): string | null => {
    const user = getCurrentUser();
    if (!user) return null;
    // If you store the token separately in localStorage
    return localStorage.getItem('token');
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
        
        // Format the user data to camelCase
        const formattedUser = {
            id: userData.Id || userData.id,
            username: userData.Username || userData.username,
            email: userData.Email || userData.email,
            createdAt: new Date(userData.CreatedAt || userData.createdAt)
        };

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
    getNotes: async (): Promise<Note[]> => {
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await fetch(`${API_URL}/notes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'UserId': user.id.toString()
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }

            const notes = await response.json();
            return notes.map((note: any) => ({
                ...note,
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt),
                status: getNoteStatus(note.status)
            }));
        } catch (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        try {
            const noteData = {
                title: note.title || '',
                content: note.content || '',
                category: note.category || '',
                userId: user.id,
                status: NoteStatus.Personal,
                isPublic: false
            };

            console.log('Creating note with data:', noteData);

            const response = await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'UserId': user.id.toString()
                },
                body: JSON.stringify(noteData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Create note error response:', errorText);
                throw new Error(errorText || 'Failed to create note');
            }

            const createdNote = await response.json();
            return {
                ...createdNote,
                createdAt: new Date(createdNote.createdAt),
                updatedAt: new Date(createdNote.updatedAt),
                status: getNoteStatus(createdNote.status)
            };
        } catch (error) {
            console.error('Create note error:', error);
            throw error;
        }
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
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await fetch(`${API_URL}/notes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'UserId': user.id.toString()
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete note error:', errorText);
                throw new Error(errorText || `Failed to delete note (${response.status})`);
            }
        } catch (error) {
            console.error('Delete note error:', error);
            throw error;
        }
    },

    shareNote: async (noteId: number, collaboratorId: number): Promise<Note> => {
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        try {
            console.log(`Sharing note ${noteId} with user ${collaboratorId}`);
            const response = await fetch(`${API_URL}/notes/${noteId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'UserId': user.id.toString()
                },
                body: JSON.stringify({
                    collaboratorId: collaboratorId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Share note error:', errorText);
                throw new Error(errorText || `Failed to share note (${response.status})`);
            }

            const result = await response.json();
            
            // Update the local note with the new status and collaborators
            return {
                ...result.note,
                createdAt: new Date(result.note.createdAt),
                updatedAt: new Date(result.note.updatedAt),
                status: getNoteStatus(result.note.status),
                isShared: true
            };
        } catch (error) {
            console.error('Share note error:', error);
            throw error;
        }
    },

    getSharedNotes: async (): Promise<Note[]> => {
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${API_URL}/notes/shared`, {
            headers: {
                'Content-Type': 'application/json',
                'UserId': user.id.toString()
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

    makeNotePublic: async (noteId: number): Promise<Note> => {
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        console.log('makeNotePublic called with:', { noteId, userId: user.id });

        try {
            const response = await fetch(`${API_URL}/notes/${noteId}/make-public`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'UserId': user.id.toString()
                }
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to make note public');
            }

            if (!data.id) {
                console.error('Invalid server response:', data);
                throw new Error('Server returned invalid note data');
            }

            // Convert to Note object
            const note: Note = {
                id: data.id,
                title: data.title,
                content: data.content,
                category: data.category || '',
                userId: data.userId,
                owner: data.owner,
                status: NoteStatus.Public,
                isPublic: true,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt)
            };

            console.log('Converted note:', note);
            return note;
        } catch (error) {
            console.error('Make note public error:', error);
            throw error;
        }
    },

    searchUsers: async (searchTerm: string): Promise<User[]> => {
        const user = getCurrentUser();
        if (!user?.id) {
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
                'UserId': user.id.toString()
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

    getPublicNotes: async (): Promise<Note[]> => {
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        try {
            console.log('Fetching public notes');
            const response = await fetch(`${API_URL}/notes/public`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'UserId': user.id.toString()
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch public notes:', errorText);
                throw new Error('Failed to fetch public notes');
            }

            const notes = await response.json();
            console.log('Received public notes:', notes);

            return notes.map((note: any) => ({
                ...note,
                createdAt: new Date(note.createdAt || note.CreatedAt),
                updatedAt: new Date(note.updatedAt || note.UpdatedAt),
                status: NoteStatus.Public,
                isPublic: true
            }));
        } catch (error) {
            console.error('Error fetching public notes:', error);
            throw error;
        }
    },

    getSharedWithMeNotes: async (): Promise<Note[]> => {
        const user = getCurrentUser();
        if (!user?.id) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await fetch(`${API_URL}/notes/shared`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'UserId': user.id.toString()
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch shared notes');
            }

            const notes = await response.json();
            return notes.map((note: any) => ({
                ...note,
                createdAt: new Date(note.createdAt || note.CreatedAt),
                updatedAt: new Date(note.updatedAt || note.UpdatedAt),
                status: getNoteStatus(note.status || note.Status),
                isShared: true
            }));
        } catch (error) {
            console.error('Error fetching shared notes:', error);
            throw error;
        }
    },
};