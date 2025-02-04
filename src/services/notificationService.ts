import { api } from './api';

export enum NotificationType {
    NewPublicNote = 0,
    NoteShared = 1
}

export interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    noteId?: number;
    createdAt: string;
    isRead: boolean;
    userId: number;
}

export const notificationService = {
    getNotifications: async (): Promise<Notification[]> => {
        try {
            const response = await api.axiosInstance.get<{ data: Notification[] }>('/notifications');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    markAsRead: async (id: number): Promise<void> => {
        try {
            console.log('Marking notification as read:', id);
            const url = `/notifications/${id}/read`;
            console.log('Full request URL:', `${api.axiosInstance.defaults.baseURL}${url}`);
            const response = await api.axiosInstance.put(url);
            console.log('Mark as read response:', response.data);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            console.error('Request URL:', `/notifications/${id}/read`);
            throw error;
        }
    },

    markAllAsRead: async (): Promise<void> => {
        try {
            await api.axiosInstance.put('/notifications/read-all');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
}; 