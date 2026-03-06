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
export declare function throttle<T extends AnyFunction>(func: T, wait: number, options?: ThrottleOptions): ThrottledFunction<T>;
export declare function debounce<T extends AnyFunction>(func: T, wait: number, options?: DebounceOptions): ThrottledFunction<T>;
export interface RateLimiter {
    tryAcquire(): boolean;
    reset(): void;
    readonly remaining: number;
}
export declare function createRateLimiter(maxCalls: number, windowMs: number): RateLimiter;
export {};
