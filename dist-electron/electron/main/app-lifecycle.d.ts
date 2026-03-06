export type LifecyclePhase = 'pre-ready' | 'ready' | 'window-created' | 'window-ready' | 'pre-quit' | 'will-quit';
export type LifecycleHook = () => void | Promise<void>;
export interface LifecycleHookEntry {
    name: string;
    phase: LifecyclePhase;
    handler: LifecycleHook;
    priority: number;
}
export declare class AppLifecycleManager {
    private hooks;
    private executedPhases;
    private log;
    constructor();
    private initializePhases;
    register(entry: Omit<LifecycleHookEntry, 'priority'> & {
        priority?: number;
    }): () => void;
    executePhase(phase: LifecyclePhase): Promise<void>;
    hasExecuted(phase: LifecyclePhase): boolean;
    getHookNames(phase: LifecyclePhase): string[];
    getSummary(): Record<string, string[]>;
    dispose(): void;
}
export declare function getLifecycleManager(): AppLifecycleManager;
