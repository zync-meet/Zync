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
import { logger } from '../utils/logger.js';
// =============================================================================
// Lifecycle Manager
// =============================================================================
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
export class AppLifecycleManager {
    /** Registered hooks by phase */
    hooks = new Map();
    /** Phases that have already been executed */
    executedPhases = new Set();
    /** Logger instance */
    log = logger;
    constructor() {
        this.initializePhases();
    }
    /**
     * Initialize the hook maps for all phases.
     */
    initializePhases() {
        const phases = [
            'pre-ready', 'ready', 'window-created',
            'window-ready', 'pre-quit', 'will-quit',
        ];
        for (const phase of phases) {
            this.hooks.set(phase, []);
        }
    }
    // =========================================================================
    // Registration
    // =========================================================================
    /**
     * Register a lifecycle hook.
     *
     * @param {Omit<LifecycleHookEntry, 'priority'> & { priority?: number }} entry - Hook entry
     * @returns {() => void} Unregister function
     */
    register(entry) {
        const fullEntry = {
            ...entry,
            priority: entry.priority ?? 100,
        };
        const phaseHooks = this.hooks.get(fullEntry.phase);
        if (!phaseHooks) {
            this.log.error(`Unknown lifecycle phase: ${fullEntry.phase}`);
            return () => { };
        }
        // Check for phase already executed
        if (this.executedPhases.has(fullEntry.phase)) {
            this.log.warn(`Phase "${fullEntry.phase}" already executed. ` +
                `Hook "${fullEntry.name}" will not run.`);
        }
        phaseHooks.push(fullEntry);
        // Sort by priority after each insertion
        phaseHooks.sort((a, b) => a.priority - b.priority);
        this.log.info(`Lifecycle hook registered: "${fullEntry.name}" ` +
            `(phase: ${fullEntry.phase}, priority: ${fullEntry.priority})`);
        return () => {
            const idx = phaseHooks.indexOf(fullEntry);
            if (idx !== -1) {
                phaseHooks.splice(idx, 1);
            }
        };
    }
    // =========================================================================
    // Execution
    // =========================================================================
    /**
     * Execute all hooks for a given phase.
     *
     * Hooks are executed in priority order (lower = first). If a hook
     * returns a Promise, it is awaited before the next hook runs.
     *
     * @param {LifecyclePhase} phase - Phase to execute
     */
    async executePhase(phase) {
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
            }
            catch (err) {
                this.log.error(`Lifecycle hook "${hook.name}" failed:`, err);
                // Continue with remaining hooks despite errors
            }
        }
        this.executedPhases.add(phase);
        const elapsed = Date.now() - startTime;
        this.log.info(`Lifecycle phase "${phase}" completed in ${elapsed}ms`);
    }
    // =========================================================================
    // Query
    // =========================================================================
    /**
     * Check if a phase has been executed.
     *
     * @param {LifecyclePhase} phase - Phase to check
     * @returns {boolean} True if executed
     */
    hasExecuted(phase) {
        return this.executedPhases.has(phase);
    }
    /**
     * Get the names of all registered hooks for a phase.
     *
     * @param {LifecyclePhase} phase - Phase to query
     * @returns {string[]} Hook names in execution order
     */
    getHookNames(phase) {
        const phaseHooks = this.hooks.get(phase);
        return phaseHooks ? phaseHooks.map((h) => h.name) : [];
    }
    /**
     * Get a summary of all registered hooks across all phases.
     *
     * @returns {Record<string, string[]>} Map of phase → hook names
     */
    getSummary() {
        const summary = {};
        for (const [phase, hooks] of this.hooks) {
            summary[phase] = hooks.map((h) => `${h.name} (p:${h.priority})`);
        }
        return summary;
    }
    // =========================================================================
    // Cleanup
    // =========================================================================
    /**
     * Dispose of the lifecycle manager.
     */
    dispose() {
        this.hooks.clear();
        this.executedPhases.clear();
        this.initializePhases();
        this.log.info('Lifecycle manager disposed');
    }
}
// =============================================================================
// Singleton
// =============================================================================
let lifecycleInstance = null;
/**
 * Get the singleton AppLifecycleManager instance.
 *
 * @returns {AppLifecycleManager} The singleton instance
 */
export function getLifecycleManager() {
    if (!lifecycleInstance) {
        lifecycleInstance = new AppLifecycleManager();
    }
    return lifecycleInstance;
}
//# sourceMappingURL=app-lifecycle.js.map