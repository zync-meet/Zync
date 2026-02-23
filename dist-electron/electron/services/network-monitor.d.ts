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
import { BrowserWindow } from 'electron';
/** Network connectivity states */
export declare enum NetworkState {
    /** Confirmed online (reachability check passed) */
    Online = "online",
    /** Confirmed offline or reachability check failed */
    Offline = "offline",
    /** Initial state before first check */
    Unknown = "unknown"
}
/** Network state change event */
export interface NetworkStateEvent {
    /** Current network state */
    state: NetworkState;
    /** Timestamp of the state change */
    timestamp: number;
    /** Duration of the previous state in milliseconds */
    previousStateDuration: number;
}
/** Network monitor configuration */
export interface NetworkMonitorConfig {
    /** Interval between reachability pings in milliseconds */
    pingInterval: number;
    /** Timeout for reachability pings in milliseconds */
    pingTimeout: number;
    /** URL to ping for reachability (should return 2xx) */
    pingURL: string;
    /** Maximum number of consecutive failures before declaring offline */
    maxConsecutiveFailures: number;
}
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
export declare class NetworkMonitor {
    /** Configuration */
    private config;
    /** Current network state */
    private state;
    /** Timestamp of last state change */
    private stateChangedAt;
    /** Number of consecutive ping failures */
    private consecutiveFailures;
    /** Ping interval timer */
    private pingTimer;
    /** Reference to the main window for IPC */
    private mainWindow;
    /** State change listeners */
    private listeners;
    /** Whether the monitor is running */
    private running;
    constructor(config?: Partial<NetworkMonitorConfig>);
    /**
     * Start the network monitor.
     *
     * @param mainWindow — Optional BrowserWindow for IPC notifications
     */
    start(mainWindow?: BrowserWindow): Promise<void>;
    /**
     * Stop the network monitor and clean up resources.
     */
    stop(): void;
    /**
     * Check network connectivity using Electron's net module.
     *
     * Uses `net.online` as a fast check, then optionally pings a URL
     * for reachability confirmation.
     */
    private checkConnectivity;
    /**
     * Perform a reachability ping.
     *
     * @returns true if the ping succeeded (2xx response)
     */
    private ping;
    /**
     * Handle a state transition.
     *
     * @param newState — The new network state
     */
    private handleStateChange;
    /**
     * Send state change to the renderer via IPC.
     */
    private notifyRenderer;
    /**
     * Get the current network state.
     */
    getState(): NetworkState;
    /**
     * Check if currently online.
     */
    isOnline(): boolean;
    /**
     * Register a state change listener.
     *
     * @param listener — Callback for state changes
     * @returns Unsubscribe function
     */
    onStateChange(listener: (event: NetworkStateEvent) => void): () => void;
    /**
     * Force an immediate connectivity check.
     */
    forceCheck(): Promise<NetworkState>;
    /**
     * Set the main window reference.
     */
    setMainWindow(window: BrowserWindow): void;
}
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
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
