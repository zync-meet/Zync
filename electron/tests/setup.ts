/**
 * =============================================================================
 * ZYNC Desktop Application - Test Setup File
 * =============================================================================
 *
 * This file runs before each test file and sets up the testing environment.
 * It configures global mocks, utilities, and test fixtures that are commonly
 * needed across all Electron tests.
 *
 * This file is referenced in vitest.config.ts under `setupFiles`.
 *
 * =============================================================================
 * What This File Does
 * =============================================================================
 *
 * 1. Sets up Electron API mocks
 * 2. Configures global test utilities
 * 3. Sets up environment variables for testing
 * 4. Provides common matchers and assertions
 * 5. Handles cleanup between tests
 *
 * =============================================================================
 */

import { vi, beforeEach, afterEach, beforeAll, afterAll, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

// =============================================================================
// Environment Setup
// =============================================================================

/**
 * Set up environment variables for testing.
 * These override any existing environment variables for consistent test behavior.
 */
function setupTestEnvironment(): void {
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
  
  // Disable telemetry and analytics during tests
  process.env.DISABLE_TELEMETRY = 'true';
  process.env.DISABLE_ANALYTICS = 'true';
  
  // Set a consistent app version for tests
  process.env.npm_package_version = '1.0.0-test';
  
  // Set test-specific paths
  process.env.ZYNC_TEST_MODE = 'true';
  process.env.ZYNC_CONFIG_DIR = path.join(os.tmpdir(), 'zync-test-config');
  process.env.ZYNC_DATA_DIR = path.join(os.tmpdir(), 'zync-test-data');
  process.env.ZYNC_LOG_DIR = path.join(os.tmpdir(), 'zync-test-logs');
  
  // Disable auto-updater during tests
  process.env.DISABLE_AUTO_UPDATE = 'true';
  
  // Set test URLs
  process.env.APP_URL = 'http://localhost:5173';
  
  // Suppress console output during tests (optional)
  // process.env.SUPPRESS_CONSOLE = 'true';
}

// =============================================================================
// Global Mocks
// =============================================================================

/**
 * Mock console methods to track and optionally suppress output.
 */
function setupConsoleMocks(): void {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };
  
  // Replace with spied versions
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    if (process.env.SUPPRESS_CONSOLE !== 'true') {
      originalConsole.log(...args);
    }
  });
  
  vi.spyOn(console, 'warn').mockImplementation((...args) => {
    if (process.env.SUPPRESS_CONSOLE !== 'true') {
      originalConsole.warn(...args);
    }
  });
  
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    if (process.env.SUPPRESS_CONSOLE !== 'true') {
      originalConsole.error(...args);
    }
  });
  
  vi.spyOn(console, 'info').mockImplementation((...args) => {
    if (process.env.SUPPRESS_CONSOLE !== 'true') {
      originalConsole.info(...args);
    }
  });
  
  vi.spyOn(console, 'debug').mockImplementation((...args) => {
    if (process.env.SUPPRESS_CONSOLE !== 'true') {
      originalConsole.debug(...args);
    }
  });
}

/**
 * Mock Node.js process methods that might cause issues in tests.
 */
function setupProcessMocks(): void {
  // Mock process.exit to prevent tests from actually exiting
  vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
    throw new Error(`process.exit called with code: ${code}`);
  });
}

/**
 * Mock timers for tests that need controlled time.
 */
function setupTimerMocks(): void {
  // Optional: Use fake timers by default
  // vi.useFakeTimers();
}

// =============================================================================
// Test Helpers - Exposed Globally
// =============================================================================

/**
 * Helper function to wait for a condition to be true.
 * Useful for testing async operations with timeouts.
 *
 * @param condition - Function that returns true when the condition is met
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Interval between checks in milliseconds
 * @returns Promise that resolves when condition is met or rejects on timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Helper function to create a deferred promise.
 * Useful for testing async flows where you control when the promise resolves.
 *
 * @returns Object with promise, resolve, and reject functions
 */
export function createDeferredPromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Helper function to create a temporary directory for tests.
 * The directory is automatically cleaned up after tests.
 *
 * @param prefix - Prefix for the directory name
 * @returns Path to the created directory
 */
export function createTempDir(prefix: string = 'zync-test'): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  
  // Register for cleanup
  tempDirsToCleanup.push(tempDir);
  
  return tempDir;
}

/**
 * Helper function to create a temporary file for tests.
 *
 * @param filename - Name of the file
 * @param content - Content to write to the file
 * @param dir - Directory to create the file in (default: temp directory)
 * @returns Path to the created file
 */
export function createTempFile(
  filename: string,
  content: string,
  dir?: string
): string {
  const tempDir = dir || createTempDir();
  const filePath = path.join(tempDir, filename);
  
  fs.writeFileSync(filePath, content, 'utf-8');
  
  return filePath;
}

/**
 * Helper function to clean up a directory recursively.
 *
 * @param dirPath - Path to the directory to clean up
 */
export function cleanupDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Track temp directories for cleanup
const tempDirsToCleanup: string[] = [];

// =============================================================================
// Custom Matchers
// =============================================================================

/**
 * Extend Vitest's expect with custom matchers.
 */
expect.extend({
  /**
   * Check if a path exists on the file system.
   */
  toExist(received: string) {
    const exists = fs.existsSync(received);
    
    return {
      pass: exists,
      message: () =>
        exists
          ? `expected ${received} not to exist`
          : `expected ${received} to exist`,
    };
  },
  
  /**
   * Check if a value is a valid UUID v4.
   */
  toBeUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = typeof received === 'string' && uuidRegex.test(received);
    
    return {
      pass: isUUID,
      message: () =>
        isUUID
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },
  
  /**
   * Check if an error has a specific code.
   */
  toHaveErrorCode(received: Error & { code?: string }, code: string) {
    const hasCode = 'code' in received && received.code === code;
    
    return {
      pass: hasCode,
      message: () =>
        hasCode
          ? `expected error not to have code ${code}`
          : `expected error to have code ${code}, but got ${received.code}`,
    };
  },
  
  /**
   * Check if a value is within a range.
   */
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});

// =============================================================================
// Test Lifecycle Hooks
// =============================================================================

/**
 * Run once before all tests in all files.
 */
beforeAll(() => {
  // Set up environment
  setupTestEnvironment();
  
  // Set up mocks
  setupConsoleMocks();
  setupProcessMocks();
  setupTimerMocks();
  
  // Create test directories if they don't exist
  const testDirs = [
    process.env.ZYNC_CONFIG_DIR,
    process.env.ZYNC_DATA_DIR,
    process.env.ZYNC_LOG_DIR,
  ];
  
  testDirs.forEach(dir => {
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

/**
 * Run before each test.
 */
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

/**
 * Run after each test.
 */
afterEach(() => {
  // Restore all mocks after each test
  vi.restoreAllMocks();
  
  // Reset fake timers if they were used
  vi.useRealTimers();
});

/**
 * Run once after all tests in all files.
 */
afterAll(() => {
  // Clean up temp directories
  tempDirsToCleanup.forEach(dir => {
    try {
      cleanupDir(dir);
    } catch {
      // Ignore cleanup errors
    }
  });
  
  // Clean up test directories
  const testDirs = [
    process.env.ZYNC_CONFIG_DIR,
    process.env.ZYNC_DATA_DIR,
    process.env.ZYNC_LOG_DIR,
  ];
  
  testDirs.forEach(dir => {
    if (dir) {
      try {
        cleanupDir(dir);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
});

// =============================================================================
// Type Declarations
// =============================================================================

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

// =============================================================================
// Module Exports
// =============================================================================

export {
  vi,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
};

// =============================================================================
// Setup Documentation
// =============================================================================
//
// This setup file provides:
//
// 1. **Environment Variables**: Consistent test environment configuration
// 2. **Console Mocks**: Track console output and optionally suppress it
// 3. **Process Mocks**: Prevent process.exit from killing test runner
// 4. **Helper Functions**: Common utilities for test files
// 5. **Custom Matchers**: Extended assertions for better test readability
// 6. **Lifecycle Hooks**: Automatic setup and cleanup
//
// Usage in test files:
//
//   import { waitFor, createTempDir, createTempFile } from './setup';
//
//   describe('MyModule', () => {
//     it('should do something', async () => {
//       await waitFor(() => someCondition);
//       expect(somePath).toExist();
//     });
//   });
//
// =============================================================================
//
// Last Updated: 2026-02-10
// Maintained by: ZYNC Electron Team
//
// =============================================================================
