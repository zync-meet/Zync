/**
 * =============================================================================
 * App Lifecycle Manager — ZYNC Desktop
 * =============================================================================
 *
 * Provides structured lifecycle hooks for app startup, ready, window-ready,
 * and shutdown phases. Modules can register callbacks for each phase.
 *
 * @module electron/main/app-lifecycle
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/** App lifecycle phases */
export type LifecyclePhase = 'pre-ready' | 'ready' | 'window-created' | 'window-ready' | 'pre-quit' | 'will-quit';
/** Lifecycle hook callback */
export type LifecycleHook = () => void | Promise<void>;
/** Named lifecycle hook with priority ordering */
export interface LifecycleHookEntry {
    /** Unique name for the hook */
    name: string;
    /** Phase to execute in */
    phase: LifecyclePhase;
    /** Callback function */
    handler: LifecycleHook;
    /** Priority (lower = earlier execution, default: 100) */
    priority: number;
}
/**
 * AppLifecycleManager coordinates the execution of startup and shutdown
 * hooks across all modules, ensuring proper initialization order.
 *
 * @example
 * ```typescript
 * const lifecycle = new AppLifecycleManager();
 *
 * lifecycle.register({
 *   name: 'init-database',
 *   phase: 'ready',
 *   handler: async () => { await initDatabase(); },
 *   priority: 10, // Run early
 * });
 *
 * lifecycle.register({
 *   name: 'cleanup-temp',
 *   phase: 'will-quit',
 *   handler: () => { cleanupTempFiles(); },
 *   priority: 100,
 * });
 * ```
 */
export declare class AppLifecycleManager {
    /** Registered hooks by phase */
    private hooks;
    /** Phases that have already been executed */
    private executedPhases;
    /** Logger instance */
    private log;
    constructor();
    /**
     * Initialize the hook maps for all phases.
     */
    private initializePhases;
    /**
     * Register a lifecycle hook.
     *
     * @param {Omit<LifecycleHookEntry, 'priority'> & { priority?: number }} entry - Hook entry
     * @returns {() => void} Unregister function
     */
    register(entry: Omit<LifecycleHookEntry, 'priority'> & {
        priority?: number;
    }): () => void;
    /**
     * Execute all hooks for a given phase.
     *
     * Hooks are executed in priority order (lower = first). If a hook
     * returns a Promise, it is awaited before the next hook runs.
     *
     * @param {LifecyclePhase} phase - Phase to execute
     */
    executePhase(phase: LifecyclePhase): Promise<void>;
    /**
     * Check if a phase has been executed.
     *
     * @param {LifecyclePhase} phase - Phase to check
     * @returns {boolean} True if executed
     */
    hasExecuted(phase: LifecyclePhase): boolean;
    /**
     * Get the names of all registered hooks for a phase.
     *
     * @param {LifecyclePhase} phase - Phase to query
     * @returns {string[]} Hook names in execution order
     */
    getHookNames(phase: LifecyclePhase): string[];
    /**
     * Get a summary of all registered hooks across all phases.
     *
     * @returns {Record<string, string[]>} Map of phase → hook names
     */
    getSummary(): Record<string, string[]>;
    /**
     * Dispose of the lifecycle manager.
     */
    dispose(): void;
}
/**
 * Get the singleton AppLifecycleManager instance.
 *
 * @returns {AppLifecycleManager} The singleton instance
 */
export declare function getLifecycleManager(): AppLifecycleManager;
