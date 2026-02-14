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

import { globalShortcut, BrowserWindow, app } from 'electron';
import { logger } from '../utils/logger.js';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Default Shortcuts
// =============================================================================

/**
 * Default shortcut accelerator strings.
 * These will be registered when the service starts.
 */
export const DEFAULT_SHORTCUTS = {
    /** Toggle the main window visibility */
    TOGGLE_WINDOW: 'CommandOrControl+Shift+Z',
    /** Open settings */
    OPEN_SETTINGS: 'CommandOrControl+,',
    /** Quick note */
    QUICK_NOTE: 'CommandOrControl+Shift+N',
    /** Screenshot capture */
    CAPTURE_SCREEN: 'CommandOrControl+Shift+4',
    /** Toggle focus mode */
    TOGGLE_FOCUS: 'CommandOrControl+Shift+F',
} as const;

// =============================================================================
// Shortcut Manager Service
// =============================================================================

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
export class ShortcutManagerService {
    /** Reference to the main window */
    private mainWindow: BrowserWindow | null;

    /** Registered shortcuts */
    private shortcuts: Map<string, ShortcutEntry> = new Map();

    /** Logger instance */
    private log = logger;

    /**
     * Create a new ShortcutManagerService.
     *
     * @param {BrowserWindow | null} mainWindow - Main window reference
     */
    constructor(mainWindow: BrowserWindow | null = null) {
        this.mainWindow = mainWindow;
    }

    // =========================================================================
    // Registration
    // =========================================================================

    /**
     * Register a global keyboard shortcut.
     *
     * @param {string} accelerator - Electron accelerator string
     * @param {string} description - Human-readable description
     * @param {() => void} handler - Handler function
     * @returns {ShortcutRegistrationResult} Registration result
     */
    register(
        accelerator: string,
        description: string,
        handler: () => void,
    ): ShortcutRegistrationResult {
        // Check if already registered
        if (this.shortcuts.has(accelerator)) {
            return { success: false, error: `Shortcut already registered: ${accelerator}` };
        }

        try {
            const success = globalShortcut.register(accelerator, handler);

            if (!success) {
                this.log.error(`Failed to register shortcut: ${accelerator}`);
                return { success: false, error: 'Registration failed (may conflict with OS shortcut)' };
            }

            this.shortcuts.set(accelerator, {
                accelerator,
                description,
                handler,
                registered: true,
                enabled: true,
            });

            this.log.info(`Shortcut registered: ${accelerator} → ${description}`);
            return { success: true };
        } catch (err) {
            this.log.error(`Error registering shortcut ${accelerator}:`, err);
            return { success: false, error: String(err) };
        }
    }

    /**
     * Unregister a global keyboard shortcut.
     *
     * @param {string} accelerator - Accelerator string to unregister
     * @returns {boolean} True if unregistered
     */
    unregister(accelerator: string): boolean {
        const entry = this.shortcuts.get(accelerator);
        if (!entry) return false;

        globalShortcut.unregister(accelerator);
        this.shortcuts.delete(accelerator);
        this.log.info(`Shortcut unregistered: ${accelerator}`);
        return true;
    }

    /**
     * Unregister all shortcuts.
     */
    unregisterAll(): void {
        globalShortcut.unregisterAll();
        this.shortcuts.clear();
        this.log.info('All shortcuts unregistered');
    }

    // =========================================================================
    // Enable/Disable
    // =========================================================================

    /**
     * Temporarily disable a shortcut without unregistering it.
     *
     * @param {string} accelerator - Shortcut to disable
     * @returns {boolean} True if disabled
     */
    disable(accelerator: string): boolean {
        const entry = this.shortcuts.get(accelerator);
        if (!entry || !entry.enabled) return false;

        globalShortcut.unregister(accelerator);
        entry.registered = false;
        entry.enabled = false;
        this.log.info(`Shortcut disabled: ${accelerator}`);
        return true;
    }

    /**
     * Re-enable a previously disabled shortcut.
     *
     * @param {string} accelerator - Shortcut to enable
     * @returns {boolean} True if enabled
     */
    enable(accelerator: string): boolean {
        const entry = this.shortcuts.get(accelerator);
        if (!entry || entry.enabled) return false;

        const success = globalShortcut.register(accelerator, entry.handler);
        if (success) {
            entry.registered = true;
            entry.enabled = true;
            this.log.info(`Shortcut re-enabled: ${accelerator}`);
        }
        return success;
    }

    // =========================================================================
    // Query
    // =========================================================================

    /**
     * Check if a shortcut is registered.
     *
     * @param {string} accelerator - Accelerator to check
     * @returns {boolean} True if registered
     */
    isRegistered(accelerator: string): boolean {
        return globalShortcut.isRegistered(accelerator);
    }

    /**
     * Get all registered shortcuts.
     *
     * @returns {ShortcutEntry[]} List of shortcut entries
     */
    getAll(): ShortcutEntry[] {
        return Array.from(this.shortcuts.values()).map((e) => ({
            ...e,
            handler: e.handler, // Keep reference
        }));
    }

    /**
     * Get a shortcut entry by accelerator.
     *
     * @param {string} accelerator - Accelerator string
     * @returns {ShortcutEntry | undefined} The shortcut entry
     */
    get(accelerator: string): ShortcutEntry | undefined {
        return this.shortcuts.get(accelerator);
    }

    // =========================================================================
    // Default Shortcuts
    // =========================================================================

    /**
     * Register the default application shortcuts.
     * Uses the main window reference for toggle behavior.
     */
    registerDefaults(): void {
        // Toggle main window
        this.register(DEFAULT_SHORTCUTS.TOGGLE_WINDOW, 'Toggle ZYNC Window', () => {
            if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
            if (this.mainWindow.isVisible()) {
                this.mainWindow.hide();
            } else {
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        });

        this.log.info('Default shortcuts registered');
    }

    // =========================================================================
    // Cleanup
    // =========================================================================

    /**
     * Update the main window reference.
     *
     * @param {BrowserWindow | null} window - New main window
     */
    setMainWindow(window: BrowserWindow | null): void {
        this.mainWindow = window;
    }

    /**
     * Dispose of the service and unregister all shortcuts.
     */
    dispose(): void {
        this.unregisterAll();
        this.mainWindow = null;
        this.log.info('Shortcut manager disposed');
    }
}
