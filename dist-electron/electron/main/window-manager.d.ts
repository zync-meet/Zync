/**
 * =============================================================================
 * Window Manager — ZYNC Desktop
 * =============================================================================
 *
 * Centralized window lifecycle management. Handles creation, state persistence,
 * focus management, and proper cleanup of all BrowserWindow instances.
 *
 * Tracks windows by type (main, settings, splash, about) and provides
 * methods to query, focus, close, or broadcast to specific window groups.
 *
 * @module electron/main/window-manager
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
/** Window type identifiers */
export type WindowType = 'main' | 'settings' | 'splash' | 'about' | 'overlay';
/** Window entry in the registry */
interface WindowEntry {
    /** The BrowserWindow instance */
    window: BrowserWindow;
    /** Classification of the window */
    type: WindowType;
    /** Timestamp when the window was created */
    createdAt: number;
    /** Whether this window should persist across close events (hide instead) */
    persistent: boolean;
}
/** Options for creating a managed window */
export interface ManagedWindowOptions extends BrowserWindowConstructorOptions {
    /** Window type classification */
    type: WindowType;
    /** If true, window hides on close instead of being destroyed */
    persistent?: boolean;
    /** URL or file path to load */
    loadURL?: string;
    /** File path to load (alternative to loadURL) */
    loadFile?: string;
    /** If true, center the window on the primary display */
    center?: boolean;
    /** If true, show the window immediately after creation */
    showOnReady?: boolean;
}
/**
 * Create a new managed BrowserWindow.
 *
 * The window is automatically registered and tracked. When closed or destroyed,
 * it is automatically removed from the registry.
 *
 * @param options — Window creation options including type and persistence
 * @returns The created BrowserWindow
 *
 * @example
 * ```ts
 * const win = createManagedWindow({
 *   type: 'main',
 *   width: 1200,
 *   height: 800,
 *   loadURL: 'http://localhost:8081',
 *   persistent: true,
 *   showOnReady: true,
 * });
 * ```
 */
export declare function createManagedWindow(options: ManagedWindowOptions): BrowserWindow;
/**
 * Get all registered windows.
 *
 * @returns Array of all WindowEntry objects
 */
export declare function getAllWindows(): WindowEntry[];
/**
 * Get all windows of a specific type.
 *
 * @param type — Window type to filter by
 * @returns Array of matching WindowEntry objects
 */
export declare function getWindowsByType(type: WindowType): WindowEntry[];
/**
 * Get the first window of a specific type (usually a singleton).
 *
 * @param type — Window type to search for
 * @returns The WindowEntry, or null if not found
 */
export declare function getWindowByType(type: WindowType): WindowEntry | null;
/**
 * Get a window entry by its numeric ID.
 *
 * @param id — BrowserWindow ID
 * @returns The WindowEntry, or null if not found
 */
export declare function getWindowById(id: number): WindowEntry | null;
/**
 * Check if any window of the specified type exists and is not destroyed.
 *
 * @param type — Window type to check
 * @returns true if at least one window of the type exists
 */
export declare function hasWindowOfType(type: WindowType): boolean;
/**
 * Get the count of all registered windows.
 *
 * @returns Number of tracked windows
 */
export declare function getWindowCount(): number;
/**
 * Focus a window, restoring it from minimized state if necessary.
 *
 * @param type — Window type to focus
 * @returns true if a window was found and focused
 */
export declare function focusWindow(type: WindowType): boolean;
/**
 * Close all windows of a specific type.
 *
 * For persistent windows, this forces a real close (not hide).
 *
 * @param type — Window type to close
 * @returns Number of windows closed
 */
export declare function closeWindowsByType(type: WindowType): number;
/**
 * Close all windows except the specified types.
 *
 * @param exceptTypes — Window types to keep open
 * @returns Number of windows closed
 */
export declare function closeAllExcept(exceptTypes?: WindowType[]): number;
/**
 * Send an IPC message to all windows of a specific type.
 *
 * @param type — Target window type
 * @param channel — IPC channel name
 * @param args — Arguments to send
 */
export declare function broadcastToType(type: WindowType, channel: string, ...args: unknown[]): void;
/**
 * Send an IPC message to ALL registered windows.
 *
 * @param channel — IPC channel name
 * @param args — Arguments to send
 */
export declare function broadcastToAll(channel: string, ...args: unknown[]): void;
/**
 * Force-close and unregister all windows.
 * Call this during app quit to ensure clean shutdown.
 */
export declare function destroyAllWindows(): void;
export {};
