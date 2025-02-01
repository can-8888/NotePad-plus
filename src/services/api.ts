import { Note, User, NoteApiResponse, NoteStatus, convertApiResponseToNote, getNoteStatus } from '../types/Note';
import { LoginRequest, RegisterRequest } from '../types/Auth';
import axios from 'axios';

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

// Configure axios with default headers
axios.interceptors.request.use((config: any) => {
    const user = getCurrentUser();
    if (user && config.headers) {
        config.headers['UserId'] = user.id.toString();  // Make sure to convert to string
        console.log('Setting UserId header:', user.id); // Debug log
    } else {
        console.log('No user found for header'); // Debug log
    }
    return config;
});

interface SearchUsersResponse {
    users: User[];
}

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
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await axios.get<Note[]>(`${API_URL}/notes`, {
                headers: {
                    'UserId': user.id.toString()
                }
            });
            
            // Transform the response to ensure correct status
            return response.data.map(note => ({
                ...note,
                status: note.isPublic ? NoteStatus.Public : 
                        note.status === NoteStatus.Shared ? NoteStatus.Shared : 
                        NoteStatus.Personal
            }));
        } catch (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const noteData = {
                ...note,
                userId: user.id,
                status: note.status || NoteStatus.Personal,
                isPublic: false
            };

            const response = await axios.post<Note>(`${API_URL}/notes`, noteData);
            return response.data;
        } catch (error) {
            console.error('Error creating note:', error);
            throw error;
        }
    },

    updateNote: async (id: number, note: Partial<Note>): Promise<Note> => {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await axios.put<Note>(`${API_URL}/notes/${id}`, {
                ...note,
                id,
                userId: user.id
            });
            return response.data;
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
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
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await axios.post<Note>(
                `${API_URL}/notes/${noteId}/share`,
                { collaboratorId },
                {
                    headers: {
                        'UserId': user.id.toString()
                    }
                }
            );
            
            // Ensure the returned note has the correct status
            return {
                ...response.data,
                status: NoteStatus.Shared
            };
        } catch (error) {
            console.error('Error sharing note:', error);
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
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await axios.post<Note>(
                `${API_URL}/notes/${noteId}/make-public`,
                {},
                {
                    headers: {
                        'UserId': user.id.toString()
                    }
                }
            );
            
            // Ensure the returned note has the correct status
            return {
                ...response.data,
                status: NoteStatus.Public,
                isPublic: true
            };
        } catch (error) {
            console.error('Error making note public:', error);
            throw error;
        }
    },

    searchUsers: async (searchTerm: string): Promise<SearchUsersResponse> => {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            console.log('Searching users with term:', searchTerm);
            const response = await axios.get<SearchUsersResponse>(`${API_URL}/users/search`, {
                params: { 
                    term: searchTerm
                },
                headers: {
                    'UserId': user.id.toString(),
                    'Content-Type': 'application/json'
                }
            });
            console.log('Search response:', response.data);
            return response.data;
        } catch (error: any) {
            if (error?.isAxiosError) {
                console.error('Search users error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            } else {
                console.error('Unexpected error:', error);
            }
            throw error;
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