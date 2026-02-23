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
export function throttle(func, wait, options = {}) {
    const { leading = true, trailing = true } = options;
    let timeout = null;
    let lastCallTime = 0;
    let lastArgs = null;
    let lastResult;
    function invokeFunc(args) {
        lastCallTime = Date.now();
        lastResult = func(...args);
        lastArgs = null;
        return lastResult;
    }
    function startTimer() {
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
    const throttled = function (...args) {
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
    };
    throttled.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        lastCallTime = 0;
        lastArgs = null;
    };
    throttled.flush = () => {
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
export function debounce(func, wait, options = {}) {
    const { leading = false, maxWait } = options;
    let timeout = null;
    let maxTimeout = null;
    let lastResult;
    let lastArgs = null;
    let lastCallTime = 0;
    function invokeFunc(args) {
        lastResult = func(...args);
        lastArgs = null;
        lastCallTime = Date.now();
        if (maxTimeout) {
            clearTimeout(maxTimeout);
            maxTimeout = null;
        }
        return lastResult;
    }
    const debounced = function (...args) {
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
    };
    debounced.cancel = () => {
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
    debounced.flush = () => {
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
/**
 * Creates a rate limiter.
 *
 * @param {number} maxCalls - Maximum number of calls allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {RateLimiter} Rate limiter instance
 */
export function createRateLimiter(maxCalls, windowMs) {
    let calls = [];
    function cleanup() {
        const now = Date.now();
        calls = calls.filter((time) => now - time < windowMs);
    }
    const limiter = {
        tryAcquire() {
            cleanup();
            if (calls.length >= maxCalls) {
                return false;
            }
            calls.push(Date.now());
            return true;
        },
        reset() {
            calls = [];
        },
        get remaining() {
            cleanup();
            return Math.max(0, maxCalls - calls.length);
        },
    };
    return limiter;
}
//# sourceMappingURL=throttle.js.map