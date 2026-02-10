/**
 * =============================================================================
 * ZYNC Desktop Application - Test Helpers
 * =============================================================================
 *
 * This file provides shared test helper functions and utilities that are used
 * across multiple test files. These helpers simplify common testing patterns
 * and provide consistent behavior.
 *
 * =============================================================================
 * Contents
 * =============================================================================
 *
 * 1. Mock Factories - Create pre-configured mock objects
 * 2. Event Helpers - Simulate and wait for events
 * 3. File System Helpers - Manage temporary test files
 * 4. IPC Helpers - Test IPC communication
 * 5. Window Helpers - Create and manage test windows
 * 6. Time Helpers - Control time-based operations
 *
 * =============================================================================
 */
import { type Mock } from 'vitest';
import { EventEmitter } from 'node:events';
/**
 * Options for creating a mock BrowserWindow.
 */
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
/**
 * Options for creating a mock WebContents.
 */
export interface MockWebContentsOptions {
    id?: number;
    url?: string;
    title?: string;
}
/**
 * Options for simulating IPC events.
 */
export interface IPCEventOptions {
    sender?: unknown;
    returnValue?: unknown;
    reply?: Mock;
}
/**
 * Deferred promise that can be resolved/rejected externally.
 */
export interface DeferredPromise<T> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
}
/**
 * Creates a mock BrowserWindow with configurable options.
 *
 * @param options - Configuration options for the mock window
 * @returns A mock BrowserWindow object
 *
 * @example
 * ```typescript
 * const win = createMockWindow({ title: 'Test Window', isVisible: true });
 * expect(win.getTitle()).toBe('Test Window');
 * ```
 */
export declare function createMockWindow(options?: MockWindowOptions): MockWindowLike;
/**
 * Interface for mock window that includes test helper methods.
 */
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
/**
 * Creates a mock WebContents with configurable options.
 *
 * @param options - Configuration options for the mock web contents
 * @returns A mock WebContents object
 */
export declare function createMockWebContents(options?: MockWebContentsOptions): MockWebContentsLike;
/**
 * Interface for mock WebContents that includes test helper methods.
 */
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
/**
 * Creates a mock Tray instance.
 *
 * @param icon - The icon for the tray (optional)
 * @returns A mock Tray object
 */
export declare function createMockTray(icon?: unknown): MockTrayLike;
/**
 * Interface for mock Tray that includes test helper methods.
 */
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
/**
 * Waits for a specific event to be emitted on an EventEmitter.
 *
 * @param emitter - The event emitter to listen on
 * @param event - The event name to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns A promise that resolves with the event arguments
 *
 * @example
 * ```typescript
 * const args = await waitForEvent(window, 'close', 1000);
 * ```
 */
export declare function waitForEvent<T = unknown[]>(emitter: EventEmitter | {
    on: (...args: unknown[]) => unknown;
}, event: string, timeout?: number): Promise<T>;
/**
 * Creates a spy that tracks all events emitted on an EventEmitter.
 *
 * @param emitter - The event emitter to spy on
 * @returns An object with methods to query emitted events
 *
 * @example
 * ```typescript
 * const spy = createEventSpy(window);
 * window.emit('close');
 * expect(spy.wasEmitted('close')).toBe(true);
 * ```
 */
export declare function createEventSpy(emitter: EventEmitter): EventSpy;
/**
 * Interface for event spy functionality.
 */
export interface EventSpy {
    emittedEvents: Array<{
        name: string;
        args: unknown[];
    }>;
    wasEmitted(eventName: string): boolean;
    getEmittedCount(eventName: string): number;
    getEmittedArgs(eventName: string): unknown[][];
    clear(): void;
    restore(): void;
}
/**
 * Creates a temporary directory for test files.
 *
 * @param prefix - A prefix for the directory name (default: 'zync-test')
 * @returns The path to the created directory
 */
export declare function createTempDirectory(prefix?: string): string;
/**
 * Creates a temporary file with the specified content.
 *
 * @param content - The content to write to the file
 * @param options - Options for file creation
 * @returns The path to the created file
 */
export declare function createTempFile(content: string, options?: {
    dir?: string;
    prefix?: string;
    suffix?: string;
}): string;
/**
 * Creates a temporary JSON file.
 *
 * @param data - The data to write as JSON
 * @param options - Options for file creation
 * @returns The path to the created file
 */
export declare function createTempJsonFile(data: unknown, options?: {
    dir?: string;
    prefix?: string;
}): string;
/**
 * Cleans up a temporary directory and all its contents.
 *
 * @param dirPath - The path to the directory to clean up
 */
export declare function cleanupTempDirectory(dirPath: string): void;
/**
 * Cleans up a temporary file.
 *
 * @param filePath - The path to the file to clean up
 */
export declare function cleanupTempFile(filePath: string): void;
/**
 * Creates a mock IPC event object.
 *
 * @param options - Options for the mock event
 * @returns A mock IPC event object
 */
export declare function createMockIPCEvent(options?: IPCEventOptions): MockIPCEvent;
/**
 * Interface for mock IPC event.
 */
export interface MockIPCEvent {
    sender: unknown;
    returnValue: unknown;
    reply: Mock;
    preventDefault: Mock;
    frameId: number;
    processId: number;
    senderFrame: unknown;
}
/**
 * Creates a test double for ipcMain that captures registered handlers.
 *
 * @returns An object with ipcMain mock and helper methods
 */
export declare function createIPCMainTestDouble(): IPCMainTestDouble;
/**
 * Interface for IPC main test double.
 */
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
/**
 * Advances fake timers and flushes all pending promises.
 *
 * @param ms - The amount of time to advance in milliseconds
 */
export declare function advanceTimersAndFlush(ms: number): Promise<void>;
/**
 * Creates a promise that resolves after a specified delay.
 * Works with both real and fake timers.
 *
 * @param ms - The delay in milliseconds
 * @returns A promise that resolves after the delay
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Creates a deferred promise that can be resolved or rejected externally.
 *
 * @returns A deferred promise object with resolve and reject methods
 *
 * @example
 * ```typescript
 * const deferred = createDeferredPromise<string>();
 * someAsyncOperation(deferred.resolve);
 * const result = await deferred.promise;
 * ```
 */
export declare function createDeferredPromise<T = void>(): DeferredPromise<T>;
/**
 * Waits for a condition to become true.
 *
 * @param condition - A function that returns true when the condition is met
 * @param options - Options for waiting
 * @returns A promise that resolves when the condition is met
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, options?: {
    timeout?: number;
    interval?: number;
}): Promise<void>;
/**
 * Asserts that a mock function was called with specific arguments.
 *
 * @param mock - The mock function to check
 * @param args - Expected arguments
 */
export declare function assertCalledWith(mock: Mock, ...args: unknown[]): void;
/**
 * Asserts that a mock function was called a specific number of times.
 *
 * @param mock - The mock function to check
 * @param times - Expected number of calls
 */
export declare function assertCallCount(mock: Mock, times: number): void;
/**
 * Captures console output during test execution.
 *
 * @returns An object with methods to access captured output and restore console
 */
export declare function captureConsole(): ConsoleSpy;
/**
 * Interface for console spy functionality.
 */
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
