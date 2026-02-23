/**
 * =============================================================================
 * Power Monitor Service — ZYNC Desktop
 * =============================================================================
 *
 * Monitors system power events (suspend, resume, lock, unlock, shutdown)
 * and provides hooks for the application to respond appropriately.
 *
 * Use cases:
 * - Pause/resume network connections on sleep/wake
 * - Save state before system shutdown
 * - Adjust auto-update behavior based on battery level
 * - Lock the app when the screen locks
 *
 * @module electron/services/power-monitor
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/** Power events that can be monitored */
export type PowerEvent = 'suspend' | 'resume' | 'on-ac' | 'on-battery' | 'shutdown' | 'lock-screen' | 'unlock-screen';
/** Power state of the system */
export interface PowerState {
    /** Whether the system is on AC power */
    onAC: boolean;
    /** Whether the screen is locked */
    screenLocked: boolean;
    /** Whether the system is suspended/sleeping */
    suspended: boolean;
    /** System idle time in seconds */
    idleTime: number;
    /** Last event that occurred */
    lastEvent: PowerEvent | null;
    /** Timestamp of the last event */
    lastEventTime: number | null;
}
/** Power event callback */
export type PowerEventCallback = (event: PowerEvent, state: PowerState) => void;
/**
 * PowerMonitorService wraps Electron's powerMonitor API with state tracking,
 * callback registration, and idle detection.
 *
 * @example
 * ```typescript
 * const monitor = new PowerMonitorService();
 * monitor.start();
 *
 * monitor.onEvent((event, state) => {
 *   if (event === 'suspend') {
 *     // Save application state
 *   }
 *   if (event === 'resume') {
 *     // Reconnect websockets
 *   }
 * });
 * ```
 */
export declare class PowerMonitorService {
    /** Current power state */
    private state;
    /** Registered event callbacks */
    private callbacks;
    /** Whether the service is running */
    private running;
    /** Idle check interval handle */
    private idleCheckInterval;
    /** Idle check interval in milliseconds */
    private idleCheckIntervalMs;
    /** Logger instance */
    private log;
    /**
     * Create a new PowerMonitorService.
     *
     * @param {number} [idleCheckIntervalMs=30000] - How often to check idle time (ms)
     */
    constructor(idleCheckIntervalMs?: number);
    /**
     * Get the current power state.
     *
     * @returns {Readonly<PowerState>} Current state
     */
    getState(): Readonly<PowerState>;
    /**
     * Get the system idle time in seconds.
     *
     * @returns {number} Idle time in seconds
     */
    getIdleTime(): number;
    /**
     * Check if the system is idle (idle for more than the given threshold).
     *
     * @param {number} [thresholdSeconds=300] - Idle threshold in seconds (default: 5 min)
     * @returns {boolean} True if idle
     */
    isIdle(thresholdSeconds?: number): boolean;
    /**
     * Register a callback for power events.
     *
     * @param {PowerEventCallback} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onEvent(callback: PowerEventCallback): () => void;
    /**
     * Emit a power event to all registered callbacks.
     *
     * @param {PowerEvent} event - The power event
     */
    private emit;
    /**
     * Start monitoring power events.
     */
    start(): void;
    /**
     * Stop monitoring power events and clean up.
     */
    stop(): void;
    /**
     * Dispose of the service.
     */
    dispose(): void;
}
