export type PowerEvent = 'suspend' | 'resume' | 'on-ac' | 'on-battery' | 'shutdown' | 'lock-screen' | 'unlock-screen';
export interface PowerState {
    onAC: boolean;
    screenLocked: boolean;
    suspended: boolean;
    idleTime: number;
    lastEvent: PowerEvent | null;
    lastEventTime: number | null;
}
export type PowerEventCallback = (event: PowerEvent, state: PowerState) => void;
export declare class PowerMonitorService {
    private state;
    private callbacks;
    private running;
    private idleCheckInterval;
    private idleCheckIntervalMs;
    private log;
    constructor(idleCheckIntervalMs?: number);
    getState(): Readonly<PowerState>;
    getIdleTime(): number;
    isIdle(thresholdSeconds?: number): boolean;
    onEvent(callback: PowerEventCallback): () => void;
    private emit;
    start(): void;
    stop(): void;
    dispose(): void;
}
