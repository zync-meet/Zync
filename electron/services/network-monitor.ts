import { net, BrowserWindow, ipcMain } from 'electron';

export enum NetworkState {
    Online = 'online',
    Offline = 'offline',
    Unknown = 'unknown',
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

const DEFAULT_CONFIG: NetworkMonitorConfig = {
    pingInterval: 30_000,
    pingTimeout: 5_000,
    pingURL: 'https://dns.google/resolve?name=zync.dev&type=A',
    maxConsecutiveFailures: 3,
};

export class NetworkMonitor {
    private config: NetworkMonitorConfig;
    private state: NetworkState = NetworkState.Unknown;
    private stateChangedAt: number = Date.now();
    private consecutiveFailures = 0;
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private mainWindow: BrowserWindow | null = null;
    private listeners: Array<(event: NetworkStateEvent) => void> = [];
    private running = false;

    constructor(config: Partial<NetworkMonitorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async start(mainWindow?: BrowserWindow): Promise<void> {
        if (this.running) {
            console.warn('[NETWORK-MONITOR] Already running');
            return;
        }

        this.mainWindow = mainWindow ?? null;
        this.running = true;

        ipcMain.handle('network:get-state', () => ({
            state: this.state,
            timestamp: this.stateChangedAt,
        }));

        await this.checkConnectivity();

        this.pingTimer = setInterval(() => {
            this.checkConnectivity().catch((err) => {
                console.error('[NETWORK-MONITOR] Ping error:', err);
            });
        }, this.config.pingInterval);

        console.log('[NETWORK-MONITOR] Started');
    }

    stop(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }

        ipcMain.removeHandler('network:get-state');

        this.running = false;
        this.listeners = [];
        this.mainWindow = null;

        console.log('[NETWORK-MONITOR] Stopped');
    }

    private async checkConnectivity(): Promise<void> {
        const electronOnline = net.online;

        if (!electronOnline) {
            this.handleStateChange(NetworkState.Offline);
            return;
        }

        try {
            const response = await this.ping();

            if (response) {
                this.consecutiveFailures = 0;
                this.handleStateChange(NetworkState.Online);
            } else {
                this.consecutiveFailures++;

                if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
                    this.handleStateChange(NetworkState.Offline);
                }
            }
        } catch {
            this.consecutiveFailures++;

            if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
                this.handleStateChange(NetworkState.Offline);
            }
        }
    }

    private async ping(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, this.config.pingTimeout);

            try {
                const request = net.request({
                    method: 'HEAD',
                    url: this.config.pingURL,
                });

                request.on('response', (response) => {
                    clearTimeout(timeout);
                    const statusCode = response.statusCode;
                    resolve(statusCode >= 200 && statusCode < 400);
                });

                request.on('error', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });

                request.end();
            } catch {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }

    private handleStateChange(newState: NetworkState): void {
        if (newState === this.state) return;

        const now = Date.now();
        const previousStateDuration = now - this.stateChangedAt;

        const event: NetworkStateEvent = {
            state: newState,
            timestamp: now,
            previousStateDuration,
        };

        console.log(
            `[NETWORK-MONITOR] State changed: ${this.state} → ${newState}` +
            ` (previous state lasted ${Math.round(previousStateDuration / 1000)}s)`,
        );

        this.state = newState;
        this.stateChangedAt = now;

        this.notifyRenderer(event);

        for (const listener of this.listeners) {
            try {
                listener(event);
            } catch (err) {
                console.error('[NETWORK-MONITOR] Listener error:', err);
            }
        }
    }

    private notifyRenderer(event: NetworkStateEvent): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('network:state-changed', event);
        }
    }

    getState(): NetworkState {
        return this.state;
    }

    isOnline(): boolean {
        return this.state === NetworkState.Online;
    }

    onStateChange(listener: (event: NetworkStateEvent) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    async forceCheck(): Promise<NetworkState> {
        await this.checkConnectivity();
        return this.state;
    }

    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window;
    }
}

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
): Promise<T> {
    let lastError: Error | unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * delay * 0.3;
                await new Promise((resolve) => setTimeout(resolve, delay + jitter));
            }
        }
    }

    throw lastError;
}
