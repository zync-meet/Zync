/**
 * =============================================================================
 * Throttle & Debounce Utilities — ZYNC Desktop
 * =============================================================================
 *
 * Provides throttle and debounce functions for rate-limiting event handlers
 * in the main process. Useful for window resize/move events, search input,
 * and other high-frequency operations.
 *
 * @module electron/utils/throttle
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/** Generic function type for callbacks */
type AnyFunction = (...args: unknown[]) => unknown;
/** Options for the throttle function */
export interface ThrottleOptions {
    /** Call the function on the leading edge of the timeout (default: true) */
    leading?: boolean;
    /** Call the function on the trailing edge of the timeout (default: true) */
    trailing?: boolean;
}
/** Options for the debounce function */
export interface DebounceOptions {
    /** Call the function on the leading edge instead of trailing (default: false) */
    leading?: boolean;
    /** Maximum time to wait before forcing execution (default: none) */
    maxWait?: number;
}
/** Return type for throttled/debounced functions */
export interface ThrottledFunction<T extends AnyFunction> {
    /** Call the throttled function */
    (...args: Parameters<T>): ReturnType<T> | undefined;
    /** Cancel any pending invocation */
    cancel(): void;
    /** Immediately invoke a pending invocation */
    flush(): ReturnType<T> | undefined;
    /** Check if there is a pending invocation */
    readonly pending: boolean;
}
/**
 * Creates a throttled version of a function that only invokes the original
 * function at most once per every `wait` milliseconds.
 *
 * Useful for rate-limiting window resize/move events and periodic auto-saves.
 *
 * @template T - The function type
 * @param {T} func - The function to throttle
 * @param {number} wait - Minimum milliseconds between invocations
 * @param {ThrottleOptions} [options] - Throttle options
 * @returns {ThrottledFunction<T>} The throttled function
 *
 * @example
 * ```typescript
 * const throttledResize = throttle(() => {
 *   saveWindowBounds();
 * }, 250);
 *
 * mainWindow.on('resize', throttledResize);
 * ```
 */
export declare function throttle<T extends AnyFunction>(func: T, wait: number, options?: ThrottleOptions): ThrottledFunction<T>;
/**
 * Creates a debounced version of a function that delays invocation until
 * after `wait` milliseconds have elapsed since the last invocation.
 *
 * Useful for search input handlers, auto-save after editing, and similar
 * patterns where you want to wait for the user to stop an action.
 *
 * @template T - The function type
 * @param {T} func - The function to debounce
 * @param {number} wait - Milliseconds to wait after last invocation
 * @param {DebounceOptions} [options] - Debounce options
 * @returns {ThrottledFunction<T>} The debounced function
 *
 * @example
 * ```typescript
 * const debouncedSave = debounce(async () => {
 *   await saveSettings();
 * }, 500);
 *
 * settingsStore.onDidChange('*', debouncedSave);
 * ```
 */
export declare function debounce<T extends AnyFunction>(func: T, wait: number, options?: DebounceOptions): ThrottledFunction<T>;
/**
 * A simple rate limiter that allows at most `maxCalls` invocations
 * within a `windowMs` time window. Useful for IPC rate limiting.
 *
 * @example
 * ```typescript
 * const limiter = createRateLimiter(10, 1000); // 10 calls per second
 *
 * ipcMain.handle('api-call', (event, data) => {
 *   if (!limiter.tryAcquire()) {
 *     throw new Error('Rate limit exceeded');
 *   }
 *   return processApiCall(data);
 * });
 * ```
 */
export interface RateLimiter {
    /** Try to acquire a permit. Returns true if allowed, false if rate limited. */
    tryAcquire(): boolean;
    /** Reset the rate limiter state */
    reset(): void;
    /** Get the number of remaining permits in the current window */
    readonly remaining: number;
}
/**
 * Creates a rate limiter.
 *
 * @param {number} maxCalls - Maximum number of calls allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {RateLimiter} Rate limiter instance
 */
export declare function createRateLimiter(maxCalls: number, windowMs: number): RateLimiter;
export {};
