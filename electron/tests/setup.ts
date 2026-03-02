import { vi, beforeEach, afterEach, beforeAll, afterAll, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';


function setupTestEnvironment(): void {

  process.env.NODE_ENV = 'test';


  process.env.DISABLE_TELEMETRY = 'true';
  process.env.DISABLE_ANALYTICS = 'true';


  process.env.npm_package_version = '1.0.0-test';


  process.env.ZYNC_TEST_MODE = 'true';
  process.env.ZYNC_CONFIG_DIR = path.join(os.tmpdir(), 'zync-test-config');
  process.env.ZYNC_DATA_DIR = path.join(os.tmpdir(), 'zync-test-data');
  process.env.ZYNC_LOG_DIR = path.join(os.tmpdir(), 'zync-test-logs');


  process.env.DISABLE_AUTO_UPDATE = 'true';


  process.env.APP_URL = 'http://localhost:8081';


}


function setupConsoleMocks(): void {

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };


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


function setupProcessMocks(): void {

  vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
    throw new Error(`process.exit called with code: ${code}`);
  });
}


function setupTimerMocks(): void {


}


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


export function createTempDir(prefix: string = 'zync-test'): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));


  tempDirsToCleanup.push(tempDir);

  return tempDir;
}


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


export function cleanupDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}


const tempDirsToCleanup: string[] = [];


expect.extend({

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


beforeAll(() => {

  setupTestEnvironment();


  setupConsoleMocks();
  setupProcessMocks();
  setupTimerMocks();


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


beforeEach(() => {

  vi.clearAllMocks();
});


afterEach(() => {

  vi.restoreAllMocks();


  vi.useRealTimers();
});


afterAll(() => {

  tempDirsToCleanup.forEach(dir => {
    try {
      cleanupDir(dir);
    } catch {

    }
  });


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

      }
    }
  });
});


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


export {
  vi,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
};
