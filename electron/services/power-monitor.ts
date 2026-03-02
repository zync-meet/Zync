import { powerMonitor } from 'electron';
import { logger } from '../utils/logger.js';


export type PowerEvent =
    | 'suspend'
    | 'resume'
    | 'on-ac'
    | 'on-battery'
    | 'shutdown'
    | 'lock-screen'
    | 'unlock-screen';


export interface PowerState {

    onAC: boolean;

    screenLocked: boolean;

    suspended: boolean;

    idleTime: number;

    lastEvent: PowerEvent | null;

    lastEventTime: number | null;
}


export type PowerEventCallback = (event: PowerEvent, state: PowerState) => void;


export class PowerMonitorService {

    private state: PowerState = {
        onAC: true,
        screenLocked: false,
        suspended: false,
        idleTime: 0,
        lastEvent: null,
        lastEventTime: null,
    };


    private callbacks: Set<PowerEventCallback> = new Set();


    private running = false;


    private idleCheckInterval: ReturnType<typeof setInterval> | null = null;


    private idleCheckIntervalMs: number;


    private log = logger;


    constructor(idleCheckIntervalMs = 30000) {
        this.idleCheckIntervalMs = idleCheckIntervalMs;
    }


    getState(): Readonly<PowerState> {
        return { ...this.state };
    }


    getIdleTime(): number {
        return powerMonitor.getSystemIdleTime();
    }


    isIdle(thresholdSeconds = 300): boolean {
        return this.getIdleTime() >= thresholdSeconds;
    }


    onEvent(callback: PowerEventCallback): () => void {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }


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


        this.idleCheckInterval = setInterval(() => {
            this.state.idleTime = this.getIdleTime();
        }, this.idleCheckIntervalMs);

        this.running = true;
        this.log.info('Power monitor service started');
    }


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


    dispose(): void {
        this.stop();
        this.callbacks.clear();
        this.log.info('Power monitor service disposed');
    }
}
