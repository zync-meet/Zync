import { powerMonitor } from 'electron';
import { logger } from '../utils/logger.js';
export class PowerMonitorService {
    state = {
        onAC: true,
        screenLocked: false,
        suspended: false,
        idleTime: 0,
        lastEvent: null,
        lastEventTime: null,
    };
    callbacks = new Set();
    running = false;
    idleCheckInterval = null;
    idleCheckIntervalMs;
    log = logger;
    constructor(idleCheckIntervalMs = 30000) {
        this.idleCheckIntervalMs = idleCheckIntervalMs;
    }
    getState() {
        return { ...this.state };
    }
    getIdleTime() {
        return powerMonitor.getSystemIdleTime();
    }
    isIdle(thresholdSeconds = 300) {
        return this.getIdleTime() >= thresholdSeconds;
    }
    onEvent(callback) {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }
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
        this.idleCheckInterval = setInterval(() => {
            this.state.idleTime = this.getIdleTime();
        }, this.idleCheckIntervalMs);
        this.running = true;
        this.log.info('Power monitor service started');
    }
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
    dispose() {
        this.stop();
        this.callbacks.clear();
        this.log.info('Power monitor service disposed');
    }
}
//# sourceMappingURL=power-monitor.js.map