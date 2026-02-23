/**
 * =============================================================================
 * Network Monitor Service — ZYNC Desktop
 * =============================================================================
 *
 * Detects online/offline state transitions and notifies the renderer.
 * Provides retry-with-backoff utilities for network requests during
 * connectivity fluctuations.
 *
 * Uses Electron's net.online flag and periodic reachability pings.
 *
 * @module electron/services/network-monitor
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { net, ipcMain } from 'electron';
// =============================================================================
// Types
// =============================================================================
/** Network connectivity states */
export var NetworkState;
(function (NetworkState) {
    /** Confirmed online (reachability check passed) */
    NetworkState["Online"] = "online";
    /** Confirmed offline or reachability check failed */
    NetworkState["Offline"] = "offline";
    /** Initial state before first check */
    NetworkState["Unknown"] = "unknown";
})(NetworkState || (NetworkState = {}));
// =============================================================================
// Constants
// =============================================================================
const DEFAULT_CONFIG = {
    pingInterval: 30_000, // 30 seconds
    pingTimeout: 5_000, // 5 seconds
    pingURL: 'https://dns.google/resolve?name=zync.dev&type=A',
    maxConsecutiveFailures: 3,
};
// =============================================================================
// Network Monitor
// =============================================================================
/**
 * Network Monitor service.
 *
 * Monitors network connectivity using Electron's net module and periodic
 * reachability pings. Emits state change events via IPC.
 *
 * @example
 * ```ts
 * const monitor = new NetworkMonitor();
 * await monitor.start(mainWindow);
 * // Later:
 * monitor.stop();
 * ```
 */
export class NetworkMonitor {
    // =========================================================================
    // Properties
    // =========================================================================
    /** Configuration */
    config;
    /** Current network state */
    state = NetworkState.Unknown;
    /** Timestamp of last state change */
    stateChangedAt = Date.now();
    /** Number of consecutive ping failures */
    consecutiveFailures = 0;
    /** Ping interval timer */
    pingTimer = null;
    /** Reference to the main window for IPC */
    mainWindow = null;
    /** State change listeners */
    listeners = [];
    /** Whether the monitor is running */
    running = false;
    // =========================================================================
    // Constructor
    // =========================================================================
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    // =========================================================================
    // Lifecycle
    // =========================================================================
    /**
     * Start the network monitor.
     *
     * @param mainWindow — Optional BrowserWindow for IPC notifications
     */
    async start(mainWindow) {
        if (this.running) {
            console.warn('[NETWORK-MONITOR] Already running');
            return;
        }
        this.mainWindow = mainWindow ?? null;
        this.running = true;
        // Register IPC handler
        ipcMain.handle('network:get-state', () => ({
            state: this.state,
            timestamp: this.stateChangedAt,
        }));
        // Initial check
        await this.checkConnectivity();
        // Start periodic pings
        this.pingTimer = setInterval(() => {
            this.checkConnectivity().catch((err) => {
                console.error('[NETWORK-MONITOR] Ping error:', err);
            });
        }, this.config.pingInterval);
        console.log('[NETWORK-MONITOR] Started');
    }
    /**
     * Stop the network monitor and clean up resources.
     */
    stop() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
        // Remove IPC handler
        ipcMain.removeHandler('network:get-state');
        this.running = false;
        this.listeners = [];
        this.mainWindow = null;
        console.log('[NETWORK-MONITOR] Stopped');
    }
    // =========================================================================
    // Connectivity Check
    // =========================================================================
    /**
     * Check network connectivity using Electron's net module.
     *
     * Uses `net.online` as a fast check, then optionally pings a URL
     * for reachability confirmation.
     */
    async checkConnectivity() {
        // Fast check: Electron's built-in online status
        const electronOnline = net.online;
        if (!electronOnline) {
            this.handleStateChange(NetworkState.Offline);
            return;
        }
        // Deep check: HTTP reachability ping
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
    /**
     * Perform a reachability ping.
     *
     * @returns true if the ping succeeded (2xx response)
     */
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
    // =========================================================================
    // State Management
    // =========================================================================
    /**
     * Handle a state transition.
     *
     * @param newState — The new network state
     */
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
        // Notify IPC
        this.notifyRenderer(event);
        // Notify listeners
        for (const listener of this.listeners) {
            try {
                listener(event);
            }
            catch (err) {
                console.error('[NETWORK-MONITOR] Listener error:', err);
            }
        }
    }
    /**
     * Send state change to the renderer via IPC.
     */
    notifyRenderer(event) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('network:state-changed', event);
        }
    }
    // =========================================================================
    // Public API
    // =========================================================================
    /**
     * Get the current network state.
     */
    getState() {
        return this.state;
    }
    /**
     * Check if currently online.
     */
    isOnline() {
        return this.state === NetworkState.Online;
    }
    /**
     * Register a state change listener.
     *
     * @param listener — Callback for state changes
     * @returns Unsubscribe function
     */
    onStateChange(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    /**
     * Force an immediate connectivity check.
     */
    async forceCheck() {
        await this.checkConnectivity();
        return this.state;
    }
    /**
     * Set the main window reference.
     */
    setMainWindow(window) {
        this.mainWindow = window;
    }
}
// =============================================================================
// Retry Helper
// =============================================================================
/**
 * Retry a function with exponential backoff.
 * Useful for network requests during connectivity fluctuations.
 *
 * @param fn — Async function to retry
 * @param maxRetries — Maximum number of retry attempts (default: 3)
 * @param baseDelay — Base delay in milliseconds (default: 1000)
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
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