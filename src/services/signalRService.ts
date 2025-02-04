import * as signalR from '@microsoft/signalr';
import { HubConnectionBuilder, LogLevel, HttpTransportType, IHttpConnectionOptions } from '@microsoft/signalr';
import { getCurrentUser } from './api';
import { Notification } from './notificationService';
import { api } from './api';

class SignalRService {
    private hubConnection: signalR.HubConnection | null = null;
    private connectionPromise: Promise<void> | null = null;

    public async startConnection() {
        try {
            const user = getCurrentUser();
            if (!user) {
                console.log('No user found, not connecting to SignalR');
                return;
            }

            if (this.connectionPromise) {
                console.log('Connection already in progress');
                return this.connectionPromise;
            }

            console.log('Starting SignalR connection...');
            const options: IHttpConnectionOptions = {
                withCredentials: true,
                headers: {
                    'UserId': user.id.toString()
                }
            };

            this.hubConnection = new HubConnectionBuilder()
                .withUrl(`https://static.spiruharet.ro/notificationHub?userId=${user.id}`, options)
                .configureLogging(LogLevel.Debug)
                .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
                .build();

            // Add handlers before starting connection
            this.setupConnectionHandlers(user.id);

            console.log('Attempting to start connection with UserId:', user.id);
            this.connectionPromise = this.hubConnection.start();
            await this.connectionPromise;
            console.log('SignalR Connected!');

            if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
                await this.hubConnection.invoke('JoinUserGroup', user.id.toString());
                console.log(`Joined user group: User_${user.id}`);
            }

            this.connectionPromise = null;
        } catch (err) {
            console.error('Error establishing SignalR connection:', err);
            this.connectionPromise = null;
            throw err;
        }
    }

    private setupConnectionHandlers(userId: number) {
        if (!this.hubConnection) return;

        this.hubConnection.onclose((error) => {
            console.log('SignalR Connection closed:', error);
        });

        this.hubConnection.onreconnecting((error) => {
            console.log('SignalR Reconnecting:', error);
        });

        this.hubConnection.onreconnected(async (connectionId) => {
            console.log('SignalR Reconnected:', connectionId);
            // Rejoin user group after reconnection
            if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
                try {
                    await this.hubConnection.invoke('JoinUserGroup', userId.toString());
                    console.log(`Rejoined user group: User_${userId}`);
                } catch (err) {
                    console.error('Error rejoining user group:', err);
                }
            }
        });
    }

    public async stopConnection() {
        try {
            if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
                const user = getCurrentUser();
                if (user) {
                    await this.hubConnection.invoke('LeaveUserGroup', user.id.toString());
                }
                await this.hubConnection.stop();
                console.log('SignalR Disconnected');
            }
        } catch (err) {
            console.error('Error stopping SignalR connection:', err);
        }
    }

    public onNotification(callback: (notification: Notification) => void) {
        if (this.hubConnection) {
            console.log('Setting up notification handler');
            this.hubConnection.on('ReceiveNotification', (notification) => {
                console.log('Received notification:', notification);
                callback(notification);
            });
        } else {
            console.warn('No hubConnection available for notifications');
        }
    }

    public offNotification() {
        if (this.hubConnection) {
            this.hubConnection.off('ReceiveNotification');
        }
    }

    public isConnected(): boolean {
        return this.hubConnection?.state === signalR.HubConnectionState.Connected;
    }

    public async reconnect() {
        if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
            await this.startConnection();
        }
    }
}

export const signalRService = new SignalRService(); 