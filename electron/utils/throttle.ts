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

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Throttle
// =============================================================================

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
export function throttle<T extends AnyFunction>(
    func: T,
    wait: number,
    options: ThrottleOptions = {},
): ThrottledFunction<T> {
    const { leading = true, trailing = true } = options;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    let lastCallTime = 0;
    let lastArgs: Parameters<T> | null = null;
    let lastResult: ReturnType<T> | undefined;

    function invokeFunc(args: Parameters<T>): ReturnType<T> {
        lastCallTime = Date.now();
        lastResult = func(...args) as ReturnType<T>;
        lastArgs = null;
        return lastResult;
    }

    function startTimer(): void {
        const elapsed = Date.now() - lastCallTime;
        const remaining = Math.max(0, wait - elapsed);

        timeout = setTimeout(() => {
            timeout = null;
            if (trailing && lastArgs) {
                invokeFunc(lastArgs);
                startTimer();
            }
        }, remaining);
    }

    const throttled = function (this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
        const now = Date.now();
        const elapsed = now - lastCallTime;

        lastArgs = args;

        if (elapsed >= wait || lastCallTime === 0) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            if (leading) {
                return invokeFunc(args);
            }
        }

        if (!timeout && trailing) {
            startTimer();
        }

        return lastResult;
    } as ThrottledFunction<T>;

    throttled.cancel = (): void => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        lastCallTime = 0;
        lastArgs = null;
    };

    throttled.flush = (): ReturnType<T> | undefined => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        if (lastArgs) {
            return invokeFunc(lastArgs);
        }
        return lastResult;
    };

    Object.defineProperty(throttled, 'pending', {
        get: () => timeout !== null,
    });

    return throttled;
}

// =============================================================================
// Debounce
// =============================================================================

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
export function debounce<T extends AnyFunction>(
    func: T,
    wait: number,
    options: DebounceOptions = {},
): ThrottledFunction<T> {
    const { leading = false, maxWait } = options;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    let maxTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastResult: ReturnType<T> | undefined;
    let lastArgs: Parameters<T> | null = null;
    let lastCallTime = 0;

    function invokeFunc(args: Parameters<T>): ReturnType<T> {
        lastResult = func(...args) as ReturnType<T>;
        lastArgs = null;
        lastCallTime = Date.now();

        if (maxTimeout) {
            clearTimeout(maxTimeout);
            maxTimeout = null;
        }

        return lastResult;
    }

    const debounced = function (this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
        lastArgs = args;

        if (timeout) {
            clearTimeout(timeout);
        }

        // Leading edge invocation
        if (leading && !timeout) {
            invokeFunc(args);
        }

        // Set the trailing edge timer
        timeout = setTimeout(() => {
            timeout = null;
            if (!leading && lastArgs) {
                invokeFunc(lastArgs);
            }
        }, wait);

        // Set maxWait timer if configured and not already running
        if (maxWait !== undefined && !maxTimeout && !leading) {
            maxTimeout = setTimeout(() => {
                maxTimeout = null;
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                if (lastArgs) {
                    invokeFunc(lastArgs);
                }
            }, maxWait);
        }

        return lastResult;
    } as ThrottledFunction<T>;

    debounced.cancel = (): void => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        if (maxTimeout) {
            clearTimeout(maxTimeout);
            maxTimeout = null;
        }
        lastArgs = null;
    };

    debounced.flush = (): ReturnType<T> | undefined => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        if (maxTimeout) {
            clearTimeout(maxTimeout);
            maxTimeout = null;
        }
        if (lastArgs) {
            return invokeFunc(lastArgs);
        }
        return lastResult;
    };

    Object.defineProperty(debounced, 'pending', {
        get: () => timeout !== null,
    });

    return debounced;
}

// =============================================================================
// Rate Limiter
// =============================================================================

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
export function createRateLimiter(maxCalls: number, windowMs: number): RateLimiter {
    let calls: number[] = [];

    function cleanup(): void {
        const now = Date.now();
        calls = calls.filter((time) => now - time < windowMs);
    }

    const limiter: RateLimiter = {
        tryAcquire(): boolean {
            cleanup();
            if (calls.length >= maxCalls) {
                return false;
            }
            calls.push(Date.now());
            return true;
        },

        reset(): void {
            calls = [];
        },

        get remaining(): number {
            cleanup();
            return Math.max(0, maxCalls - calls.length);
        },
    };

    return limiter;
}
