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

import { powerMonitor } from 'electron';
import { logger } from '../utils/logger.js';

// =============================================================================
// Types
// =============================================================================

/** Power events that can be monitored */
export type PowerEvent =
    | 'suspend'
    | 'resume'
    | 'on-ac'
    | 'on-battery'
    | 'shutdown'
    | 'lock-screen'
    | 'unlock-screen';

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

// =============================================================================
// Power Monitor Service
// =============================================================================

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
export class PowerMonitorService {
    /** Current power state */
    private state: PowerState = {
        onAC: true,
        screenLocked: false,
        suspended: false,
        idleTime: 0,
        lastEvent: null,
        lastEventTime: null,
    };

    /** Registered event callbacks */
    private callbacks: Set<PowerEventCallback> = new Set();

    /** Whether the service is running */
    private running = false;

    /** Idle check interval handle */
    private idleCheckInterval: ReturnType<typeof setInterval> | null = null;

    /** Idle check interval in milliseconds */
    private idleCheckIntervalMs: number;

    /** Logger instance */
    private log = logger;

    /**
     * Create a new PowerMonitorService.
     *
     * @param {number} [idleCheckIntervalMs=30000] - How often to check idle time (ms)
     */
    constructor(idleCheckIntervalMs = 30000) {
        this.idleCheckIntervalMs = idleCheckIntervalMs;
    }

    // =========================================================================
    // State Access
    // =========================================================================

    /**
     * Get the current power state.
     *
     * @returns {Readonly<PowerState>} Current state
     */
    getState(): Readonly<PowerState> {
        return { ...this.state };
    }

    /**
     * Get the system idle time in seconds.
     *
     * @returns {number} Idle time in seconds
     */
    getIdleTime(): number {
        return powerMonitor.getSystemIdleTime();
    }

    /**
     * Check if the system is idle (idle for more than the given threshold).
     *
     * @param {number} [thresholdSeconds=300] - Idle threshold in seconds (default: 5 min)
     * @returns {boolean} True if idle
     */
    isIdle(thresholdSeconds = 300): boolean {
        return this.getIdleTime() >= thresholdSeconds;
    }

    // =========================================================================
    // Event Handlers
    // =========================================================================

    /**
     * Register a callback for power events.
     *
     * @param {PowerEventCallback} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onEvent(callback: PowerEventCallback): () => void {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Emit a power event to all registered callbacks.
     *
     * @param {PowerEvent} event - The power event
     */
    private emit(event: PowerEvent): void {
        this.state.lastEvent = event;
        this.state.lastEventTime = Date.now();
        this.state.idleTime = this.getIdleTime();

        for (const callback of this.callbacks) {
            try {
                callback(event, { ...this.state });
            } catch (err) {
                this.log.error(`Power event callback error (${event}):`, err);
            }
        }
    }

    // =========================================================================
    // Lifecycle
    // =========================================================================

    /**
     * Start monitoring power events.
     */
    start(): void {
        if (this.running) return;

        powerMonitor.on('suspend', () => {
            this.state.suspended = true;
            this.log.info('System suspending');
            this.emit('suspend');
        });

        powerMonitor.on('resume', () => {
            this.state.suspended = false;
            this.log.info('System resumed');
            this.emit('resume');
        });

        powerMonitor.on('on-ac', () => {
            this.state.onAC = true;
            this.log.info('Switched to AC power');
            this.emit('on-ac');
        });

        powerMonitor.on('on-battery', () => {
            this.state.onAC = false;
            this.log.info('Switched to battery');
            this.emit('on-battery');
        });

        powerMonitor.on('shutdown', () => {
            this.log.info('System shutting down');
            this.emit('shutdown');
        });

        powerMonitor.on('lock-screen', () => {
            this.state.screenLocked = true;
            this.log.info('Screen locked');
            this.emit('lock-screen');
        });

        powerMonitor.on('unlock-screen', () => {
            this.state.screenLocked = false;
            this.log.info('Screen unlocked');
            this.emit('unlock-screen');
        });

        // Start periodic idle time checks
        this.idleCheckInterval = setInterval(() => {
            this.state.idleTime = this.getIdleTime();
        }, this.idleCheckIntervalMs);

        this.running = true;
        this.log.info('Power monitor service started');
    }

    /**
     * Stop monitoring power events and clean up.
     */
    stop(): void {
        if (!this.running) return;

        powerMonitor.removeAllListeners('suspend');
        powerMonitor.removeAllListeners('resume');
        powerMonitor.removeAllListeners('on-ac');
        powerMonitor.removeAllListeners('on-battery');
        powerMonitor.removeAllListeners('shutdown');
        powerMonitor.removeAllListeners('lock-screen');
        powerMonitor.removeAllListeners('unlock-screen');

        if (this.idleCheckInterval) {
            clearInterval(this.idleCheckInterval);
            this.idleCheckInterval = null;
        }

        this.running = false;
        this.log.info('Power monitor service stopped');
    }

    /**
     * Dispose of the service.
     */
    dispose(): void {
        this.stop();
        this.callbacks.clear();
        this.log.info('Power monitor service disposed');
    }
}
