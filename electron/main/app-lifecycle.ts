import { app, BrowserWindow } from 'electron';
import { logger } from '../utils/logger.js';


export type LifecyclePhase =
    | 'pre-ready'
    | 'ready'
    | 'window-created'
    | 'window-ready'
    | 'pre-quit'
    | 'will-quit';


export type LifecycleHook = () => void | Promise<void>;


export interface LifecycleHookEntry {

    name: string;

    phase: LifecyclePhase;

    handler: LifecycleHook;

    priority: number;
}


export class AppLifecycleManager {

    private hooks: Map<LifecyclePhase, LifecycleHookEntry[]> = new Map();


    private executedPhases: Set<LifecyclePhase> = new Set();


    private log = logger;

    constructor() {
        this.initializePhases();
    }


    private initializePhases(): void {
        const phases: LifecyclePhase[] = [
            'pre-ready', 'ready', 'window-created',
            'window-ready', 'pre-quit', 'will-quit',
        ];
        for (const phase of phases) {
            this.hooks.set(phase, []);
        }
    }


    register(entry: Omit<LifecycleHookEntry, 'priority'> & { priority?: number }): () => void {
        const fullEntry: LifecycleHookEntry = {
            ...entry,
            priority: entry.priority ?? 100,
        };

        const phaseHooks = this.hooks.get(fullEntry.phase);
        if (!phaseHooks) {
            this.log.error(`Unknown lifecycle phase: ${fullEntry.phase}`);
            return () => {};
        }


        if (this.executedPhases.has(fullEntry.phase)) {
            this.log.warn(
                `Phase "${fullEntry.phase}" already executed. ` +
                `Hook "${fullEntry.name}" will not run.`,
            );
        }

        phaseHooks.push(fullEntry);


        phaseHooks.sort((a, b) => a.priority - b.priority);

        this.log.info(
            `Lifecycle hook registered: "${fullEntry.name}" ` +
            `(phase: ${fullEntry.phase}, priority: ${fullEntry.priority})`,
        );

        return () => {
            const idx = phaseHooks.indexOf(fullEntry);
            if (idx !== -1) {
                phaseHooks.splice(idx, 1);
            }
        };
    }


    async executePhase(phase: LifecyclePhase): Promise<void> {
        const phaseHooks = this.hooks.get(phase);
        if (!phaseHooks || phaseHooks.length === 0) {
            this.log.info(`Lifecycle phase "${phase}": no hooks registered`);
            this.executedPhases.add(phase);
            return;
        }

        this.log.info(`Lifecycle phase "${phase}": executing ${phaseHooks.length} hooks`);
        const startTime = Date.now();

        for (const hook of phaseHooks) {
            try {
                this.log.info(`  → Running hook: "${hook.name}"`);
                const result = hook.handler();
                if (result instanceof Promise) {
                    await result;
                }
            } catch (err) {
                this.log.error(`Lifecycle hook "${hook.name}" failed:`, err);

            }
        }

        this.executedPhases.add(phase);
        const elapsed = Date.now() - startTime;
        this.log.info(`Lifecycle phase "${phase}" completed in ${elapsed}ms`);
    }


    hasExecuted(phase: LifecyclePhase): boolean {
        return this.executedPhases.has(phase);
    }


    getHookNames(phase: LifecyclePhase): string[] {
        const phaseHooks = this.hooks.get(phase);
        return phaseHooks ? phaseHooks.map((h) => h.name) : [];
    }


    getSummary(): Record<string, string[]> {
        const summary: Record<string, string[]> = {};
        for (const [phase, hooks] of this.hooks) {
            summary[phase] = hooks.map((h) => `${h.name} (p:${h.priority})`);
        }
        return summary;
    }


    dispose(): void {
        this.hooks.clear();
        this.executedPhases.clear();
        this.initializePhases();
        this.log.info('Lifecycle manager disposed');
    }
}


let lifecycleInstance: AppLifecycleManager | null = null;


export function getLifecycleManager(): AppLifecycleManager {
    if (!lifecycleInstance) {
        lifecycleInstance = new AppLifecycleManager();
    }
    return lifecycleInstance;
}
