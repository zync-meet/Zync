/**
 * =============================================================================
 * Global Shortcut Manager — ZYNC Desktop
 * =============================================================================
 *
 * Registers and manages global keyboard shortcuts (accelerators) that work
 * even when the application window is not focused. Used for media keys,
 * quick capture, and other system-wide actions.
 *
 * @module electron/services/shortcut-manager
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow } from 'electron';
/** A registered shortcut entry */
export interface ShortcutEntry {
    /** Accelerator string (e.g., "CommandOrControl+Shift+S") */
    accelerator: string;
    /** Human-readable description */
    description: string;
    /** Handler function */
    handler: () => void;
    /** Whether this shortcut is currently registered */
    registered: boolean;
    /** Whether this shortcut is enabled */
    enabled: boolean;
}
/** Shortcut registration result */
export interface ShortcutRegistrationResult {
    /** Whether registration succeeded */
    success: boolean;
    /** Error message if failed */
    error?: string;
}
/**
 * Default shortcut accelerator strings.
 * These will be registered when the service starts.
 */
export declare const DEFAULT_SHORTCUTS: {
    /** Toggle the main window visibility */
    readonly TOGGLE_WINDOW: "CommandOrControl+Shift+Z";
    /** Open settings */
    readonly OPEN_SETTINGS: "CommandOrControl+,";
    /** Quick note */
    readonly QUICK_NOTE: "CommandOrControl+Shift+N";
    /** Screenshot capture */
    readonly CAPTURE_SCREEN: "CommandOrControl+Shift+4";
    /** Toggle focus mode */
    readonly TOGGLE_FOCUS: "CommandOrControl+Shift+F";
};
/**
 * ShortcutManagerService manages global keyboard shortcuts for the application.
 *
 * All shortcuts are validated before registration and tracked for proper cleanup
 * on app exit.
 *
 * @example
 * ```typescript
 * const shortcuts = new ShortcutManagerService(mainWindow);
 * shortcuts.register('CommandOrControl+Shift+Z', 'Toggle Window', () => {
 *   mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
 * });
 * ```
 */
export declare class ShortcutManagerService {
    /** Reference to the main window */
    private mainWindow;
    /** Registered shortcuts */
    private shortcuts;
    /** Logger instance */
    private log;
    /**
     * Create a new ShortcutManagerService.
     *
     * @param {BrowserWindow | null} mainWindow - Main window reference
     */
    constructor(mainWindow?: BrowserWindow | null);
    /**
     * Register a global keyboard shortcut.
     *
     * @param {string} accelerator - Electron accelerator string
     * @param {string} description - Human-readable description
     * @param {() => void} handler - Handler function
     * @returns {ShortcutRegistrationResult} Registration result
     */
    register(accelerator: string, description: string, handler: () => void): ShortcutRegistrationResult;
    /**
     * Unregister a global keyboard shortcut.
     *
     * @param {string} accelerator - Accelerator string to unregister
     * @returns {boolean} True if unregistered
     */
    unregister(accelerator: string): boolean;
    /**
     * Unregister all shortcuts.
     */
    unregisterAll(): void;
    /**
     * Temporarily disable a shortcut without unregistering it.
     *
     * @param {string} accelerator - Shortcut to disable
     * @returns {boolean} True if disabled
     */
    disable(accelerator: string): boolean;
    /**
     * Re-enable a previously disabled shortcut.
     *
     * @param {string} accelerator - Shortcut to enable
     * @returns {boolean} True if enabled
     */
    enable(accelerator: string): boolean;
    /**
     * Check if a shortcut is registered.
     *
     * @param {string} accelerator - Accelerator to check
     * @returns {boolean} True if registered
     */
    isRegistered(accelerator: string): boolean;
    /**
     * Get all registered shortcuts.
     *
     * @returns {ShortcutEntry[]} List of shortcut entries
     */
    getAll(): ShortcutEntry[];
    /**
     * Get a shortcut entry by accelerator.
     *
     * @param {string} accelerator - Accelerator string
     * @returns {ShortcutEntry | undefined} The shortcut entry
     */
    get(accelerator: string): ShortcutEntry | undefined;
    /**
     * Register the default application shortcuts.
     * Uses the main window reference for toggle behavior.
     */
    registerDefaults(): void;
    /**
     * Update the main window reference.
     *
     * @param {BrowserWindow | null} window - New main window
     */
    setMainWindow(window: BrowserWindow | null): void;
    /**
     * Dispose of the service and unregister all shortcuts.
     */
    dispose(): void;
}
