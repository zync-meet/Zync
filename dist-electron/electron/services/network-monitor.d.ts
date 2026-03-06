import { BrowserWindow } from 'electron';
export declare enum NetworkState {
    Online = "online",
    Offline = "offline",
    Unknown = "unknown"
}
export interface NetworkStateEvent {
    state: NetworkState;
    timestamp: number;
    previousStateDuration: number;
}
export interface NetworkMonitorConfig {
    pingInterval: number;
    pingTimeout: number;
    pingURL: string;
    maxConsecutiveFailures: number;
}
export declare class NetworkMonitor {
    private config;
    private state;
    private stateChangedAt;
    private consecutiveFailures;
    private pingTimer;
    private mainWindow;
    private listeners;
    private running;
    constructor(config?: Partial<NetworkMonitorConfig>);
    start(mainWindow?: BrowserWindow): Promise<void>;
    stop(): void;
    private checkConnectivity;
    private ping;
    private handleStateChange;
    private notifyRenderer;
    getState(): NetworkState;
    isOnline(): boolean;
    onStateChange(listener: (event: NetworkStateEvent) => void): () => void;
    forceCheck(): Promise<NetworkState>;
    setMainWindow(window: BrowserWindow): void;
}
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
