import { vi, beforeEach, afterEach, beforeAll, afterAll, expect } from 'vitest';
/**
 * Helper function to wait for a condition to be true.
 * Useful for testing async operations with timeouts.
 *
 * @param condition - Function that returns true when the condition is met
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Interval between checks in milliseconds
 * @returns Promise that resolves when condition is met or rejects on timeout
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Helper function to create a deferred promise.
 * Useful for testing async flows where you control when the promise resolves.
 *
 * @returns Object with promise, resolve, and reject functions
 */
export declare function createDeferredPromise<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
};
/**
 * Helper function to create a temporary directory for tests.
 * The directory is automatically cleaned up after tests.
 *
 * @param prefix - Prefix for the directory name
 * @returns Path to the created directory
 */
export declare function createTempDir(prefix?: string): string;
/**
 * Helper function to create a temporary file for tests.
 *
 * @param filename - Name of the file
 * @param content - Content to write to the file
 * @param dir - Directory to create the file in (default: temp directory)
 * @returns Path to the created file
 */
export declare function createTempFile(filename: string, content: string, dir?: string): string;
/**
 * Helper function to clean up a directory recursively.
 *
 * @param dirPath - Path to the directory to clean up
 */
export declare function cleanupDir(dirPath: string): void;
/**
 * Extend the global namespace with custom test types.
 */
declare global {
    namespace Vi {
        interface Assertion {
            toExist(): void;
            toBeUUID(): void;
            toHaveErrorCode(code: string): void;
            toBeWithinRange(floor: number, ceiling: number): void;
        }
        interface AsymmetricMatchersContaining {
            toExist(): void;
            toBeUUID(): void;
            toHaveErrorCode(code: string): void;
            toBeWithinRange(floor: number, ceiling: number): void;
        }
    }
}
export { vi, expect, beforeEach, afterEach, beforeAll, afterAll, };
