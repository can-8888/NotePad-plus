declare module '@microsoft/signalr' {
    export class HubConnection {
        state: HubConnectionState;
        start(): Promise<void>;
        stop(): Promise<void>;
        on(methodName: string, callback: (...args: any[]) => void): void;
        off(methodName: string): void;
        invoke(methodName: string, ...args: any[]): Promise<any>;
    }

    export class HubConnectionBuilder {
        withUrl(url: string): HubConnectionBuilder;
        withAutomaticReconnect(): HubConnectionBuilder;
        build(): HubConnection;
    }

    export enum HubConnectionState {
        Connected = "Connected",
        Disconnected = "Disconnected",
        Connecting = "Connecting",
        Disconnecting = "Disconnecting",
        Reconnecting = "Reconnecting"
    }
} 