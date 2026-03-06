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
        if (leading && !timeout) {
            invokeFunc(args);
        }
        timeout = setTimeout(() => {
            timeout = null;
            if (!leading && lastArgs) {
                invokeFunc(lastArgs);
            }
        }, wait);
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