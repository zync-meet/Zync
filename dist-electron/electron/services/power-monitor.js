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
    state = {
        onAC: true,
        screenLocked: false,
        suspended: false,
        idleTime: 0,
        lastEvent: null,
        lastEventTime: null,
    };
    /** Registered event callbacks */
    callbacks = new Set();
    /** Whether the service is running */
    running = false;
    /** Idle check interval handle */
    idleCheckInterval = null;
    /** Idle check interval in milliseconds */
    idleCheckIntervalMs;
    /** Logger instance */
    log = logger;
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
    getState() {
        return { ...this.state };
    }
    /**
     * Get the system idle time in seconds.
     *
     * @returns {number} Idle time in seconds
     */
    getIdleTime() {
        return powerMonitor.getSystemIdleTime();
    }
    /**
     * Check if the system is idle (idle for more than the given threshold).
     *
     * @param {number} [thresholdSeconds=300] - Idle threshold in seconds (default: 5 min)
     * @returns {boolean} True if idle
     */
    isIdle(thresholdSeconds = 300) {
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
    onEvent(callback) {
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
    emit(event) {
        this.state.lastEvent = event;
        this.state.lastEventTime = Date.now();
        this.state.idleTime = this.getIdleTime();
        for (const callback of this.callbacks) {
            try {
                callback(event, { ...this.state });
            }
            catch (err) {
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
    start() {
        if (this.running)
            return;
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
    stop() {
        if (!this.running)
            return;
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
    dispose() {
        this.stop();
        this.callbacks.clear();
        this.log.info('Power monitor service disposed');
    }
}
//# sourceMappingURL=power-monitor.js.map