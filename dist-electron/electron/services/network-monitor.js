import { net, ipcMain } from 'electron';
export var NetworkState;
(function (NetworkState) {
    NetworkState["Online"] = "online";
    NetworkState["Offline"] = "offline";
    NetworkState["Unknown"] = "unknown";
})(NetworkState || (NetworkState = {}));
const DEFAULT_CONFIG = {
    pingInterval: 30_000,
    pingTimeout: 5_000,
    pingURL: 'https://dns.google/resolve?name=zync.dev&type=A',
    maxConsecutiveFailures: 3,
};
export class NetworkMonitor {
    config;
    state = NetworkState.Unknown;
    stateChangedAt = Date.now();
    consecutiveFailures = 0;
    pingTimer = null;
    mainWindow = null;
    listeners = [];
    running = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async start(mainWindow) {
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
    stop() {
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
    async checkConnectivity() {
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
            }
            else {
                this.consecutiveFailures++;
                if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
                    this.handleStateChange(NetworkState.Offline);
                }
            }
        }
        catch {
            this.consecutiveFailures++;
            if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
                this.handleStateChange(NetworkState.Offline);
            }
        }
    }
    async ping() {
        return new Promise((resolve) => {
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
            }
            catch {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }
    handleStateChange(newState) {
        if (newState === this.state)
            return;
        const now = Date.now();
        const previousStateDuration = now - this.stateChangedAt;
        const event = {
            state: newState,
            timestamp: now,
            previousStateDuration,
        };
        console.log(`[NETWORK-MONITOR] State changed: ${this.state} → ${newState}` +
            ` (previous state lasted ${Math.round(previousStateDuration / 1000)}s)`);
        this.state = newState;
        this.stateChangedAt = now;
        this.notifyRenderer(event);
        for (const listener of this.listeners) {
            try {
                listener(event);
            }
            catch (err) {
                console.error('[NETWORK-MONITOR] Listener error:', err);
            }
        }
    }
    notifyRenderer(event) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('network:state-changed', event);
        }
    }
    getState() {
        return this.state;
    }
    isOnline() {
        return this.state === NetworkState.Online;
    }
    onStateChange(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    async forceCheck() {
        await this.checkConnectivity();
        return this.state;
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
}
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
//# sourceMappingURL=network-monitor.js.map