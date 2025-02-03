import axios from 'axios';
import { Note, User } from '../types/Note';
import { LoginRequest, RegisterRequest, LoginResponse } from '../types/Auth';
import { DriveFile, FileUploadResponse, Folder } from '../types/File';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add more debug logging
console.log('API_URL:', API_URL);

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

// Configure axios with default headers
axios.interceptors.request.use((config: any) => {
    const user = getCurrentUser();
    if (user && config.headers) {
        config.headers['UserId'] = user.id.toString();
        console.log('Setting UserId header:', user.id);
    } else {
        console.log('No user found for header');
    }
    return config;
});

// Create the axios instance
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request logging
axiosInstance.interceptors.request.use((config) => {
    console.log('Full request URL:', `${config.baseURL}${config.url}`);
    return config;
});

// Configure axios with default headers
axiosInstance.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('token');
    const user = getCurrentUser();
    
    // Skip auth headers for login/register
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
        return config;
    }

    // Add auth headers for all other requests
    if (config.headers) {
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        if (user) {
            config.headers['UserId'] = user.id.toString();
        }
    }

    // Debug logging
    console.log('Request headers:', config.headers);
    console.log('Request URL:', config.url);

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Update response interceptor with better error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.error('API Error:', {
            status: error?.response?.status,
            url: error?.config?.url,
            message: error?.response?.data?.message || error.message
        });

        if (error?.response?.status === 401 && 
            !window.location.pathname.includes('login') &&
            !error.config.url?.includes('/auth/login')) {
            console.log('Unauthorized access, redirecting to login');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

interface ApiResponse<T> {
    data: T;
    success: boolean;
}

// Export the api object with all methods
export const api = {
    axiosInstance,

    // Auth operations
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
        const { user, token } = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        return response.data;
    },

    register: async (userData: RegisterRequest): Promise<User> => {
        const response = await axiosInstance.post<User>('/auth/register', userData);
        return response.data;
    },

    // Note operations
    getNotes: async (): Promise<Note[]> => {
        try {
            console.log('Fetching notes...');
            const response = await axiosInstance.get<ApiResponse<Note[]> | Note[]>('/notes');
            console.log('Notes response:', response.data);
            
            // Handle both response formats
            if (Array.isArray(response.data)) {
                return response.data;
            }
            
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }
    },

    getSharedNotes: async (): Promise<Note[]> => {
        try {
            console.log('Fetching shared notes...');
            const response = await axiosInstance.get<ApiResponse<Note[]>>('/notes/shared');
            console.log('Shared notes response:', response.data);
            
            // Handle both response formats
            if (Array.isArray(response.data)) {
                return response.data;
            }
            
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching shared notes:', error);
            throw error;
        }
    },

    getPublicNotes: async (): Promise<Note[]> => {
        try {
            console.log('Fetching public notes...');
            const response = await axiosInstance.get<ApiResponse<Note[]>>('/notes/public');
            console.log('Public notes response:', response.data);
            
            // Handle both response formats
            if (Array.isArray(response.data)) {
                return response.data;
            }
            
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching public notes:', error);
            throw error;
        }
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
        const response = await axiosInstance.post<ApiResponse<Note>>('/notes', note);
        return response.data.data;
    },

    updateNote: async (id: number, note: Partial<Note>): Promise<Note> => {
        const response = await axiosInstance.put<ApiResponse<Note>>(`/notes/${id}`, note);
        return response.data.data;
    },

    deleteNote: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/notes/${id}`);
    },

    shareNote: async (noteId: number, collaboratorId: number): Promise<Note> => {
        const response = await axiosInstance.post<ApiResponse<Note>>(`/notes/${noteId}/share`, { collaboratorId });
        return response.data.data;
    },

    makeNotePublic: async (noteId: number): Promise<Note> => {
        try {
            console.log('Making note public:', noteId);
            const response = await axiosInstance.put<ApiResponse<Note>>(`/notes/${noteId}/make-public`);
            console.log('Make public response:', response.data);
            return response.data.data;
        } catch (error) {
            console.error('Error making note public:', error);
            throw error;
        }
    },

    // Drive operations
    uploadFile: async (file: File): Promise<ApiResponse<FileUploadResponse>> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post<ApiResponse<FileUploadResponse>>('/drive/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getFolders: async (): Promise<ApiResponse<Folder[]>> => {
        const response = await axiosInstance.get<ApiResponse<Folder[]>>('/drive/folders');
        return response.data;
    },

    createFolder: async (name: string, parentId?: number): Promise<Folder> => {
        const response = await axiosInstance.post<Folder>('/drive/folders', { name, parentId });
        return response.data;
    },

    deleteFolder: async (folderId: number): Promise<void> => {
        await axiosInstance.delete(`/drive/folders/${folderId}`);
    },

    deleteFile: async (fileId: number): Promise<void> => {
        await axiosInstance.delete(`/drive/file/${fileId}`);
    },

    getFilesInFolder: async (folderId: number | null): Promise<DriveFile[]> => {
        const path = folderId ? `/drive/folders/${folderId}/files` : '/drive/folders/root/files';
        const response = await axiosInstance.get<ApiResponse<DriveFile[]>>(path);
        return response.data.data;
    },

    searchUsers: async (searchTerm: string): Promise<{ users: User[] }> => {
        const response = await axiosInstance.get<{ users: User[] }>(`/users/search?term=${searchTerm}`);
        return response.data;
    },

    // Add this to your api object
    debugGetAllShares: async () => {
        try {
            console.log('Getting all shares debug info...');
            const response = await axiosInstance.get('/notes/debug/all-shares');
            console.log('Shares debug info:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error getting shares debug info:', error);
            throw error;
        }
    }
};