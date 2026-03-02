import { vi, type Mock } from 'vitest';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';


export interface MockWindowOptions {
  id?: number;
  title?: string;
  bounds?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  isVisible?: boolean;
  isMaximized?: boolean;
  isMinimized?: boolean;
  isFullScreen?: boolean;
  isFocused?: boolean;
  isDestroyed?: boolean;
}


export interface MockWebContentsOptions {
  id?: number;
  url?: string;
  title?: string;
}


export interface IPCEventOptions {
  sender?: unknown;
  returnValue?: unknown;
  reply?: Mock;
}


export interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}


export function createMockWindow(options: MockWindowOptions = {}): MockWindowLike {
  const eventEmitter = new EventEmitter();

  const mockBounds = {
    x: options.bounds?.x ?? 100,
    y: options.bounds?.y ?? 100,
    width: options.bounds?.width ?? 800,
    height: options.bounds?.height ?? 600,
  };

  let title = options.title ?? 'Test Window';
  let isVisible = options.isVisible ?? true;
  let isMaximized = options.isMaximized ?? false;
  let isMinimized = options.isMinimized ?? false;
  let isFullScreen = options.isFullScreen ?? false;
  let isFocused = options.isFocused ?? true;
  let isDestroyed = options.isDestroyed ?? false;

  const webContents = createMockWebContents({
    id: options.id ?? 1,
    title,
  });

  const mockWindow: MockWindowLike = {
    id: options.id ?? 1,
    webContents,


    on: vi.fn((event, listener) => {
      eventEmitter.on(event, listener);
      return mockWindow;
    }),
    once: vi.fn((event, listener) => {
      eventEmitter.once(event, listener);
      return mockWindow;
    }),
    off: vi.fn((event, listener) => {
      eventEmitter.off(event, listener);
      return mockWindow;
    }),
    emit: vi.fn((event, ...args) => eventEmitter.emit(event, ...args)),
    removeAllListeners: vi.fn((event) => {
      eventEmitter.removeAllListeners(event);
      return mockWindow;
    }),


    show: vi.fn(() => { isVisible = true; eventEmitter.emit('show'); }),
    hide: vi.fn(() => { isVisible = false; eventEmitter.emit('hide'); }),
    close: vi.fn(() => {
      const event = { preventDefault: vi.fn() };
      eventEmitter.emit('close', event);
      if (!event.preventDefault.mock.calls.length) {
        isDestroyed = true;
        eventEmitter.emit('closed');
      }
    }),
    destroy: vi.fn(() => {
      isDestroyed = true;
      eventEmitter.emit('closed');
    }),
    focus: vi.fn(() => { isFocused = true; eventEmitter.emit('focus'); }),
    blur: vi.fn(() => { isFocused = false; eventEmitter.emit('blur'); }),


    isFocused: vi.fn(() => isFocused),
    isDestroyed: vi.fn(() => isDestroyed),
    isVisible: vi.fn(() => isVisible),
    isMinimized: vi.fn(() => isMinimized),
    isMaximized: vi.fn(() => isMaximized),
    isFullScreen: vi.fn(() => isFullScreen),


    minimize: vi.fn(() => { isMinimized = true; eventEmitter.emit('minimize'); }),
    restore: vi.fn(() => { isMinimized = false; eventEmitter.emit('restore'); }),
    maximize: vi.fn(() => { isMaximized = true; eventEmitter.emit('maximize'); }),
    unmaximize: vi.fn(() => { isMaximized = false; eventEmitter.emit('unmaximize'); }),
    setFullScreen: vi.fn((flag: boolean) => {
      isFullScreen = flag;
      eventEmitter.emit(flag ? 'enter-full-screen' : 'leave-full-screen');
    }),


    getBounds: vi.fn(() => ({ ...mockBounds })),
    setBounds: vi.fn((bounds) => {
      Object.assign(mockBounds, bounds);
      eventEmitter.emit('resize');
      eventEmitter.emit('move');
    }),
    getSize: vi.fn(() => [mockBounds.width, mockBounds.height] as [number, number]),
    setSize: vi.fn((width, height) => {
      mockBounds.width = width;
      mockBounds.height = height;
      eventEmitter.emit('resize');
    }),
    getPosition: vi.fn(() => [mockBounds.x, mockBounds.y] as [number, number]),
    setPosition: vi.fn((x, y) => {
      mockBounds.x = x;
      mockBounds.y = y;
      eventEmitter.emit('move');
    }),
    center: vi.fn(),


    getTitle: vi.fn(() => title),
    setTitle: vi.fn((newTitle) => {
      title = newTitle;
      eventEmitter.emit('page-title-updated', {}, newTitle);
    }),


    loadURL: vi.fn().mockResolvedValue(undefined),
    loadFile: vi.fn().mockResolvedValue(undefined),


    setMenu: vi.fn(),
    setProgressBar: vi.fn(),
    setOverlayIcon: vi.fn(),
    flashFrame: vi.fn(),
    setIcon: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    isAlwaysOnTop: vi.fn(() => false),


    _triggerEvent: (event: string, ...args: unknown[]) => eventEmitter.emit(event, ...args),
  };

  return mockWindow;
}


export interface MockWindowLike {
  id: number;
  webContents: MockWebContentsLike;
  on: Mock;
  once: Mock;
  off: Mock;
  emit: Mock;
  removeAllListeners: Mock;
  show: Mock;
  hide: Mock;
  close: Mock;
  destroy: Mock;
  focus: Mock;
  blur: Mock;
  isFocused: Mock;
  isDestroyed: Mock;
  isVisible: Mock;
  isMinimized: Mock;
  isMaximized: Mock;
  isFullScreen: Mock;
  minimize: Mock;
  restore: Mock;
  maximize: Mock;
  unmaximize: Mock;
  setFullScreen: Mock;
  getBounds: Mock;
  setBounds: Mock;
  getSize: Mock;
  setSize: Mock;
  getPosition: Mock;
  setPosition: Mock;
  center: Mock;
  getTitle: Mock;
  setTitle: Mock;
  loadURL: Mock;
  loadFile: Mock;
  setMenu: Mock;
  setProgressBar: Mock;
  setOverlayIcon: Mock;
  flashFrame: Mock;
  setIcon: Mock;
  setAlwaysOnTop: Mock;
  isAlwaysOnTop: Mock;
  _triggerEvent: (event: string, ...args: unknown[]) => boolean;
}


export function createMockWebContents(options: MockWebContentsOptions = {}): MockWebContentsLike {
  const eventEmitter = new EventEmitter();

  let url = options.url ?? 'https://zync.app';
  let title = options.title ?? 'Test Page';

  const mockWebContents: MockWebContentsLike = {
    id: options.id ?? 1,


    on: vi.fn((event, listener) => {
      eventEmitter.on(event, listener);
      return mockWebContents;
    }),
    once: vi.fn((event, listener) => {
      eventEmitter.once(event, listener);
      return mockWebContents;
    }),
    off: vi.fn((event, listener) => {
      eventEmitter.off(event, listener);
      return mockWebContents;
    }),
    emit: vi.fn((event, ...args) => eventEmitter.emit(event, ...args)),


    loadURL: vi.fn((newUrl) => {
      url = newUrl;
      eventEmitter.emit('did-start-loading');
      eventEmitter.emit('did-finish-load');
      return Promise.resolve();
    }),
    loadFile: vi.fn((filePath) => {
      url = `file://${filePath}`;
      eventEmitter.emit('did-start-loading');
      eventEmitter.emit('did-finish-load');
      return Promise.resolve();
    }),


    getURL: vi.fn(() => url),
    getTitle: vi.fn(() => title),


    send: vi.fn(),
    sendSync: vi.fn(),


    openDevTools: vi.fn(),
    closeDevTools: vi.fn(),
    isDevToolsOpened: vi.fn(() => false),
    toggleDevTools: vi.fn(),


    canGoBack: vi.fn(() => false),
    canGoForward: vi.fn(() => false),
    goBack: vi.fn(),
    goForward: vi.fn(),
    reload: vi.fn(),


    setZoomFactor: vi.fn(),
    getZoomFactor: vi.fn(() => 1),
    setZoomLevel: vi.fn(),
    getZoomLevel: vi.fn(() => 0),


    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn(),
    selectAll: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),


    executeJavaScript: vi.fn().mockResolvedValue(undefined),
    insertCSS: vi.fn().mockResolvedValue(''),


    _triggerEvent: (event: string, ...args: unknown[]) => eventEmitter.emit(event, ...args),
    _setTitle: (newTitle: string) => { title = newTitle; },
    _setURL: (newUrl: string) => { url = newUrl; },
  };

  return mockWebContents;
}


export interface MockWebContentsLike {
  id: number;
  on: Mock;
  once: Mock;
  off: Mock;
  emit: Mock;
  loadURL: Mock;
  loadFile: Mock;
  getURL: Mock;
  getTitle: Mock;
  send: Mock;
  sendSync: Mock;
  openDevTools: Mock;
  closeDevTools: Mock;
  isDevToolsOpened: Mock;
  toggleDevTools: Mock;
  canGoBack: Mock;
  canGoForward: Mock;
  goBack: Mock;
  goForward: Mock;
  reload: Mock;
  setZoomFactor: Mock;
  getZoomFactor: Mock;
  setZoomLevel: Mock;
  getZoomLevel: Mock;
  copy: Mock;
  cut: Mock;
  paste: Mock;
  selectAll: Mock;
  undo: Mock;
  redo: Mock;
  executeJavaScript: Mock;
  insertCSS: Mock;
  _triggerEvent: (event: string, ...args: unknown[]) => boolean;
  _setTitle: (title: string) => void;
  _setURL: (url: string) => void;
}


export function createMockTray(icon?: unknown): MockTrayLike {
  const eventEmitter = new EventEmitter();

  let tooltip = '';
  let title = '';
  let isDestroyed = false;

  const mockTray: MockTrayLike = {

    on: vi.fn((event, listener) => {
      eventEmitter.on(event, listener);
      return mockTray;
    }),
    once: vi.fn((event, listener) => {
      eventEmitter.once(event, listener);
      return mockTray;
    }),
    off: vi.fn((event, listener) => {
      eventEmitter.off(event, listener);
      return mockTray;
    }),
    emit: vi.fn((event, ...args) => eventEmitter.emit(event, ...args)),


    setImage: vi.fn(),
    setTitle: vi.fn((newTitle) => { title = newTitle; }),
    getTitle: vi.fn(() => title),
    setToolTip: vi.fn((tip) => { tooltip = tip; }),
    getToolTip: vi.fn(() => tooltip),
    setContextMenu: vi.fn(),
    getBounds: vi.fn(() => ({ x: 0, y: 0, width: 16, height: 16 })),
    destroy: vi.fn(() => { isDestroyed = true; }),
    isDestroyed: vi.fn(() => isDestroyed),
    popUpContextMenu: vi.fn(),
    displayBalloon: vi.fn(),
    removeBalloon: vi.fn(),
    focus: vi.fn(),


    _triggerEvent: (event: string, ...args: unknown[]) => eventEmitter.emit(event, ...args),
  };

  return mockTray;
}


export interface MockTrayLike {
  on: Mock;
  once: Mock;
  off: Mock;
  emit: Mock;
  setImage: Mock;
  setTitle: Mock;
  getTitle: Mock;
  setToolTip: Mock;
  getToolTip: Mock;
  setContextMenu: Mock;
  getBounds: Mock;
  destroy: Mock;
  isDestroyed: Mock;
  popUpContextMenu: Mock;
  displayBalloon: Mock;
  removeBalloon: Mock;
  focus: Mock;
  _triggerEvent: (event: string, ...args: unknown[]) => boolean;
}


export function waitForEvent<T = unknown[]>(
  emitter: EventEmitter | { on: (...args: unknown[]) => unknown },
  event: string,
  timeout: number = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event '${event}' after ${timeout}ms`));
    }, timeout);

    const handler = (...args: unknown[]): void => {
      clearTimeout(timer);
      resolve(args as T);
    };

    if ('on' in emitter && typeof emitter.on === 'function') {
      emitter.on(event, handler);
    }
  });
}


export function createEventSpy(emitter: EventEmitter): EventSpy {
  const events: Array<{ name: string; args: unknown[] }> = [];

  const originalEmit = emitter.emit.bind(emitter);
  emitter.emit = (event: string, ...args: unknown[]): boolean => {
    events.push({ name: event, args });
    return originalEmit(event, ...args);
  };

  return {
    get emittedEvents(): Array<{ name: string; args: unknown[] }> {
      return [...events];
    },

    wasEmitted(eventName: string): boolean {
      return events.some(e => e.name === eventName);
    },

    getEmittedCount(eventName: string): number {
      return events.filter(e => e.name === eventName).length;
    },

    getEmittedArgs(eventName: string): unknown[][] {
      return events.filter(e => e.name === eventName).map(e => e.args);
    },

    clear(): void {
      events.length = 0;
    },

    restore(): void {
      emitter.emit = originalEmit;
    },
  };
}


export interface EventSpy {
  emittedEvents: Array<{ name: string; args: unknown[] }>;
  wasEmitted(eventName: string): boolean;
  getEmittedCount(eventName: string): number;
  getEmittedArgs(eventName: string): unknown[][];
  clear(): void;
  restore(): void;
}


export function createTempDirectory(prefix: string = 'zync-test'): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  return tempDir;
}


export function createTempFile(
  content: string,
  options: { dir?: string; prefix?: string; suffix?: string } = {},
): string {
  const dir = options.dir ?? os.tmpdir();
  const prefix = options.prefix ?? 'zync-test-';
  const suffix = options.suffix ?? '.tmp';

  const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}${suffix}`;
  const filePath = path.join(dir, fileName);

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}


export function createTempJsonFile(
  data: unknown,
  options: { dir?: string; prefix?: string } = {},
): string {
  const suffix = '.json';
  const content = JSON.stringify(data, null, 2);
  return createTempFile(content, { ...options, suffix });
}


export function cleanupTempDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}


export function cleanupTempFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}


export function createMockIPCEvent(options: IPCEventOptions = {}): MockIPCEvent {
  return {
    sender: options.sender ?? createMockWebContents(),
    returnValue: options.returnValue,
    reply: options.reply ?? vi.fn(),
    preventDefault: vi.fn(),
    frameId: 1,
    processId: 1,
    senderFrame: null as unknown,
  };
}


export interface MockIPCEvent {
  sender: unknown;
  returnValue: unknown;
  reply: Mock;
  preventDefault: Mock;
  frameId: number;
  processId: number;
  senderFrame: unknown;
}


export function createIPCMainTestDouble(): IPCMainTestDouble {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      handleOnce: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        const wrappedHandler = (...args: unknown[]) => {
          handlers.delete(channel);
          return handler(...args);
        };
        handlers.set(channel, wrappedHandler);
      }),
      removeHandler: vi.fn((channel: string) => {
        handlers.delete(channel);
      }),
      on: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
        if (!listeners.has(channel)) {
          listeners.set(channel, new Set());
        }
        listeners.get(channel)!.add(listener);
      }),
      once: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
        const wrappedListener = (...args: unknown[]) => {
          listeners.get(channel)?.delete(wrappedListener);
          listener(...args);
        };
        if (!listeners.has(channel)) {
          listeners.set(channel, new Set());
        }
        listeners.get(channel)!.add(wrappedListener);
      }),
      removeListener: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
        listeners.get(channel)?.delete(listener);
      }),
      removeAllListeners: vi.fn((channel?: string) => {
        if (channel) {
          listeners.delete(channel);
        } else {
          listeners.clear();
        }
      }),
    },

    hasHandler(channel: string): boolean {
      return handlers.has(channel);
    },

    async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
      const handler = handlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for channel '${channel}'`);
      }
      const event = createMockIPCEvent();
      return handler(event, ...args);
    },

    emit(channel: string, ...args: unknown[]): void {
      const channelListeners = listeners.get(channel);
      if (channelListeners) {
        const event = createMockIPCEvent();
        channelListeners.forEach(listener => listener(event, ...args));
      }
    },

    getHandlerChannels(): string[] {
      return Array.from(handlers.keys());
    },

    getListenerChannels(): string[] {
      return Array.from(listeners.keys());
    },

    clear(): void {
      handlers.clear();
      listeners.clear();
    },
  };
}


export interface IPCMainTestDouble {
  ipcMain: {
    handle: Mock;
    handleOnce: Mock;
    removeHandler: Mock;
    on: Mock;
    once: Mock;
    removeListener: Mock;
    removeAllListeners: Mock;
  };
  hasHandler(channel: string): boolean;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  emit(channel: string, ...args: unknown[]): void;
  getHandlerChannels(): string[];
  getListenerChannels(): string[];
  clear(): void;
}


export async function advanceTimersAndFlush(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await vi.runAllTimersAsync();

  await new Promise(resolve => setImmediate(resolve));
}


export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export function createDeferredPromise<T = void>(): DeferredPromise<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}


export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const timeout = options.timeout ?? 5000;
  const interval = options.interval ?? 50;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}


export function assertCalledWith(mock: Mock, ...args: unknown[]): void {
  const calls = mock.mock.calls;
  const found = calls.some(call =>
    args.every((arg, index) => {
      if (typeof arg === 'object' && arg !== null) {
        return JSON.stringify(call[index]) === JSON.stringify(arg);
      }
      return call[index] === arg;
    }),
  );

  if (!found) {
    throw new Error(
      `Expected mock to be called with ${JSON.stringify(args)}, but calls were: ${JSON.stringify(calls)}`,
    );
  }
}


export function assertCallCount(mock: Mock, times: number): void {
  const actual = mock.mock.calls.length;
  if (actual !== times) {
    throw new Error(
      `Expected mock to be called ${times} times, but was called ${actual} times`,
    );
  }
}


export function captureConsole(): ConsoleSpy {
  const captured: {
    log: string[];
    info: string[];
    warn: string[];
    error: string[];
  } = {
    log: [],
    info: [],
    warn: [],
    error: [],
  };

  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  console.log = (...args: unknown[]) => {
    captured.log.push(args.map(String).join(' '));
  };
  console.info = (...args: unknown[]) => {
    captured.info.push(args.map(String).join(' '));
  };
  console.warn = (...args: unknown[]) => {
    captured.warn.push(args.map(String).join(' '));
  };
  console.error = (...args: unknown[]) => {
    captured.error.push(args.map(String).join(' '));
  };

  return {
    get log(): readonly string[] {
      return captured.log;
    },
    get info(): readonly string[] {
      return captured.info;
    },
    get warn(): readonly string[] {
      return captured.warn;
    },
    get error(): readonly string[] {
      return captured.error;
    },

    hasLog(pattern: string | RegExp): boolean {
      return captured.log.some(msg =>
        typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg),
      );
    },

    hasInfo(pattern: string | RegExp): boolean {
      return captured.info.some(msg =>
        typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg),
      );
    },

    hasWarn(pattern: string | RegExp): boolean {
      return captured.warn.some(msg =>
        typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg),
      );
    },

    hasError(pattern: string | RegExp): boolean {
      return captured.error.some(msg =>
        typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg),
      );
    },

    clear(): void {
      captured.log = [];
      captured.info = [];
      captured.warn = [];
      captured.error = [];
    },

    restore(): void {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    },
  };
}


export interface ConsoleSpy {
  readonly log: readonly string[];
  readonly info: readonly string[];
  readonly warn: readonly string[];
  readonly error: readonly string[];
  hasLog(pattern: string | RegExp): boolean;
  hasInfo(pattern: string | RegExp): boolean;
  hasWarn(pattern: string | RegExp): boolean;
  hasError(pattern: string | RegExp): boolean;
  clear(): void;
  restore(): void;
}
