type AnyFunction = (...args: unknown[]) => unknown;


export interface ThrottleOptions {

    leading?: boolean;

    trailing?: boolean;
}


export interface DebounceOptions {

    leading?: boolean;

    maxWait?: number;
}


export interface ThrottledFunction<T extends AnyFunction> {

    (...args: Parameters<T>): ReturnType<T> | undefined;

    cancel(): void;

    flush(): ReturnType<T> | undefined;

    readonly pending: boolean;
}


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


export interface RateLimiter {

    tryAcquire(): boolean;

    reset(): void;

    readonly remaining: number;
}


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
