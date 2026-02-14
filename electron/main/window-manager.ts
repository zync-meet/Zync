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

import {
    BrowserWindow,
    BrowserWindowConstructorOptions,
    screen,
} from 'electron';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Window Registry
// =============================================================================

/** Map of window ID → WindowEntry */
const windowRegistry = new Map<number, WindowEntry>();

// =============================================================================
// Window Creation
// =============================================================================

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
export function createManagedWindow(options: ManagedWindowOptions): BrowserWindow {
    const {
        type,
        persistent = false,
        loadURL: url,
        loadFile: file,
        center: shouldCenter = false,
        showOnReady = false,
        ...windowOptions
    } = options;

    // -------------------------------------------------------------------------
    // Create the BrowserWindow
    // -------------------------------------------------------------------------

    const window = new BrowserWindow({
        show: false, // Always start hidden, show on 'ready-to-show' if needed
        ...windowOptions,
    });

    // -------------------------------------------------------------------------
    // Register in the window registry
    // -------------------------------------------------------------------------

    const entry: WindowEntry = {
        window,
        type,
        createdAt: Date.now(),
        persistent,
    };

    windowRegistry.set(window.id, entry);
    console.log(`[WINDOW-MANAGER] Created ${type} window (id=${window.id})`);

    // -------------------------------------------------------------------------
    // Center the window if requested
    // -------------------------------------------------------------------------

    if (shouldCenter) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        const bounds = window.getBounds();

        window.setPosition(
            Math.round((screenWidth - bounds.width) / 2),
            Math.round((screenHeight - bounds.height) / 2),
        );
    }

    // -------------------------------------------------------------------------
    // Show on ready-to-show
    // -------------------------------------------------------------------------

    if (showOnReady) {
        window.once('ready-to-show', () => {
            window.show();
        });
    }

    // -------------------------------------------------------------------------
    // Persistent close behavior (hide instead of close)
    // -------------------------------------------------------------------------

    if (persistent) {
        window.on('close', (event) => {
            // Check if the app is truly quitting (handled externally)
            if (!(window as any).__forceClose) {
                event.preventDefault();
                window.hide();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Automatic cleanup on destroy
    // -------------------------------------------------------------------------

    window.on('closed', () => {
        windowRegistry.delete(window.id);
        console.log(`[WINDOW-MANAGER] Removed ${type} window (id=${window.id}) from registry`);
    });

    // -------------------------------------------------------------------------
    // Load content
    // -------------------------------------------------------------------------

    if (url) {
        window.loadURL(url).catch((err) => {
            console.error(`[WINDOW-MANAGER] Failed to load URL for ${type} window:`, err);
        });
    } else if (file) {
        window.loadFile(file).catch((err) => {
            console.error(`[WINDOW-MANAGER] Failed to load file for ${type} window:`, err);
        });
    }

    return window;
}

// =============================================================================
// Window Queries
// =============================================================================

/**
 * Get all registered windows.
 *
 * @returns Array of all WindowEntry objects
 */
export function getAllWindows(): WindowEntry[] {
    return Array.from(windowRegistry.values());
}

/**
 * Get all windows of a specific type.
 *
 * @param type — Window type to filter by
 * @returns Array of matching WindowEntry objects
 */
export function getWindowsByType(type: WindowType): WindowEntry[] {
    return Array.from(windowRegistry.values()).filter((entry) => entry.type === type);
}

/**
 * Get the first window of a specific type (usually a singleton).
 *
 * @param type — Window type to search for
 * @returns The WindowEntry, or null if not found
 */
export function getWindowByType(type: WindowType): WindowEntry | null {
    for (const entry of windowRegistry.values()) {
        if (entry.type === type) return entry;
    }
    return null;
}

/**
 * Get a window entry by its numeric ID.
 *
 * @param id — BrowserWindow ID
 * @returns The WindowEntry, or null if not found
 */
export function getWindowById(id: number): WindowEntry | null {
    return windowRegistry.get(id) ?? null;
}

/**
 * Check if any window of the specified type exists and is not destroyed.
 *
 * @param type — Window type to check
 * @returns true if at least one window of the type exists
 */
export function hasWindowOfType(type: WindowType): boolean {
    for (const entry of windowRegistry.values()) {
        if (entry.type === type && !entry.window.isDestroyed()) return true;
    }
    return false;
}

/**
 * Get the count of all registered windows.
 *
 * @returns Number of tracked windows
 */
export function getWindowCount(): number {
    return windowRegistry.size;
}

// =============================================================================
// Window Actions
// =============================================================================

/**
 * Focus a window, restoring it from minimized state if necessary.
 *
 * @param type — Window type to focus
 * @returns true if a window was found and focused
 */
export function focusWindow(type: WindowType): boolean {
    const entry = getWindowByType(type);
    if (!entry || entry.window.isDestroyed()) return false;

    if (!entry.window.isVisible()) {
        entry.window.show();
    }

    if (entry.window.isMinimized()) {
        entry.window.restore();
    }

    entry.window.focus();
    return true;
}

/**
 * Close all windows of a specific type.
 *
 * For persistent windows, this forces a real close (not hide).
 *
 * @param type — Window type to close
 * @returns Number of windows closed
 */
export function closeWindowsByType(type: WindowType): number {
    let count = 0;

    for (const entry of windowRegistry.values()) {
        if (entry.type === type && !entry.window.isDestroyed()) {
            // Mark for force close to bypass persistent hide behavior
            (entry.window as any).__forceClose = true;
            entry.window.close();
            count++;
        }
    }

    return count;
}

/**
 * Close all windows except the specified types.
 *
 * @param exceptTypes — Window types to keep open
 * @returns Number of windows closed
 */
export function closeAllExcept(exceptTypes: WindowType[] = []): number {
    let count = 0;

    for (const entry of windowRegistry.values()) {
        if (!exceptTypes.includes(entry.type) && !entry.window.isDestroyed()) {
            (entry.window as any).__forceClose = true;
            entry.window.close();
            count++;
        }
    }

    return count;
}

/**
 * Send an IPC message to all windows of a specific type.
 *
 * @param type — Target window type
 * @param channel — IPC channel name
 * @param args — Arguments to send
 */
export function broadcastToType(type: WindowType, channel: string, ...args: unknown[]): void {
    for (const entry of windowRegistry.values()) {
        if (entry.type === type && !entry.window.isDestroyed()) {
            entry.window.webContents.send(channel, ...args);
        }
    }
}

/**
 * Send an IPC message to ALL registered windows.
 *
 * @param channel — IPC channel name
 * @param args — Arguments to send
 */
export function broadcastToAll(channel: string, ...args: unknown[]): void {
    for (const entry of windowRegistry.values()) {
        if (!entry.window.isDestroyed()) {
            entry.window.webContents.send(channel, ...args);
        }
    }
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Force-close and unregister all windows.
 * Call this during app quit to ensure clean shutdown.
 */
export function destroyAllWindows(): void {
    for (const entry of windowRegistry.values()) {
        if (!entry.window.isDestroyed()) {
            (entry.window as any).__forceClose = true;
            entry.window.destroy();
        }
    }

    windowRegistry.clear();
    console.log('[WINDOW-MANAGER] All windows destroyed');
}
