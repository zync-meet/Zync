/**
 * =============================================================================
 * Theme Watcher Service — ZYNC Desktop
 * =============================================================================
 *
 * Monitors the system's native theme (dark/light mode) and notifies renderer
 * processes when it changes. Integrates with the settings store to support
 * "auto" theme mode.
 *
 * @module electron/services/theme-watcher
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { nativeTheme, BrowserWindow } from 'electron';
import { logger } from '../utils/logger.js';

// =============================================================================
// Types
// =============================================================================

/** Supported theme modes in the application */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Theme change callback */
export type ThemeChangeCallback = (theme: 'light' | 'dark') => void;

/** Theme watcher configuration */
export interface ThemeWatcherConfig {
    /** Initial theme mode ('light' | 'dark' | 'system') */
    initialMode?: ThemeMode;
    /** Whether to notify renderer windows automatically */
    notifyRenderers?: boolean;
    /** IPC channel name for theme change notifications */
    ipcChannel?: string;
}

// =============================================================================
// Theme Watcher Service
// =============================================================================

/**
 * ThemeWatcherService monitors system theme changes and provides a centralized
 * way to manage the application's theme across all windows.
 *
 * Usage:
 * ```typescript
 * const watcher = new ThemeWatcherService({ initialMode: 'system' });
 * watcher.start();
 *
 * watcher.onChange((theme) => {
 *   console.log('Theme changed to:', theme);
 * });
 * ```
 */
export class ThemeWatcherService {
    /** Current theme mode setting */
    private mode: ThemeMode;

    /** Whether the service is actively watching */
    private isWatching = false;

    /** Registered change callbacks */
    private callbacks: Set<ThemeChangeCallback> = new Set();

    /** Whether to send IPC messages to renderer windows */
    private notifyRenderers: boolean;

    /** IPC channel for notifications */
    private ipcChannel: string;

    /** Logger instance */
    private log = logger;

    /** Reference to the nativeTheme listener for cleanup */
    private nativeThemeHandler: (() => void) | null = null;

    /**
     * Create a new ThemeWatcherService.
     *
     * @param {ThemeWatcherConfig} [config] - Configuration options
     */
    constructor(config: ThemeWatcherConfig = {}) {
        this.mode = config.initialMode ?? 'system';
        this.notifyRenderers = config.notifyRenderers ?? true;
        this.ipcChannel = config.ipcChannel ?? 'theme:changed';
    }

    // =========================================================================
    // Theme Resolution
    // =========================================================================

    /**
     * Get the currently resolved theme ('dark' or 'light').
     *
     * If mode is 'system', returns the system's current preference.
     * Otherwise returns the explicitly set mode.
     *
     * @returns {'dark' | 'light'} The resolved theme
     */
    get currentTheme(): 'dark' | 'light' {
        if (this.mode === 'system') {
            return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        }
        return this.mode;
    }

    /**
     * Get the current theme mode setting.
     *
     * @returns {ThemeMode} Current mode
     */
    get currentMode(): ThemeMode {
        return this.mode;
    }

    /**
     * Check if the system is currently in dark mode.
     *
     * @returns {boolean} True if dark theme is active
     */
    get isDarkMode(): boolean {
        return this.currentTheme === 'dark';
    }

    // =========================================================================
    // Theme Control
    // =========================================================================

    /**
     * Set the theme mode.
     *
     * @param {ThemeMode} mode - New theme mode
     */
    setMode(mode: ThemeMode): void {
        const oldTheme = this.currentTheme;
        this.mode = mode;

        // Update Electron's nativeTheme source
        switch (mode) {
            case 'dark':
                nativeTheme.themeSource = 'dark';
                break;
            case 'light':
                nativeTheme.themeSource = 'light';
                break;
            case 'system':
                nativeTheme.themeSource = 'system';
                break;
        }

        const newTheme = this.currentTheme;
        if (oldTheme !== newTheme) {
            this.notifyChange(newTheme);
        }

        this.log.info(`Theme mode set to: ${mode} (resolved: ${this.currentTheme})`);
    }

    /**
     * Toggle between light and dark mode.
     * If currently in system mode, switches to the opposite of the current system theme.
     *
     * @returns {'dark' | 'light'} The new theme
     */
    toggle(): 'dark' | 'light' {
        const newMode = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setMode(newMode);
        return newMode;
    }

    // =========================================================================
    // Watching
    // =========================================================================

    /**
     * Start watching for system theme changes.
     */
    start(): void {
        if (this.isWatching) return;

        this.nativeThemeHandler = () => {
            if (this.mode === 'system') {
                const theme = this.currentTheme;
                this.log.info(`System theme changed to: ${theme}`);
                this.notifyChange(theme);
            }
        };

        nativeTheme.on('updated', this.nativeThemeHandler);
        this.isWatching = true;

        // Apply initial theme source
        this.setMode(this.mode);

        this.log.info('Theme watcher started');
    }

    /**
     * Stop watching for theme changes.
     */
    stop(): void {
        if (!this.isWatching) return;

        if (this.nativeThemeHandler) {
            nativeTheme.removeListener('updated', this.nativeThemeHandler);
            this.nativeThemeHandler = null;
        }

        this.isWatching = false;
        this.log.info('Theme watcher stopped');
    }

    // =========================================================================
    // Callbacks
    // =========================================================================

    /**
     * Register a callback for theme changes.
     *
     * @param {ThemeChangeCallback} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onChange(callback: ThemeChangeCallback): () => void {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }

    // =========================================================================
    // Notification
    // =========================================================================

    /**
     * Notify all registered callbacks and renderer windows of a theme change.
     *
     * @param {'dark' | 'light'} theme - The new theme
     */
    private notifyChange(theme: 'dark' | 'light'): void {
        // Notify registered callbacks
        for (const callback of this.callbacks) {
            try {
                callback(theme);
            } catch (err) {
                this.log.error('Theme change callback error:', err);
            }
        }

        // Notify renderer windows via IPC
        if (this.notifyRenderers) {
            const windows = BrowserWindow.getAllWindows();
            for (const win of windows) {
                if (!win.isDestroyed()) {
                    win.webContents.send(this.ipcChannel, theme);
                }
            }
        }
    }

    // =========================================================================
    // Cleanup
    // =========================================================================

    /**
     * Dispose of the service and clean up all listeners.
     */
    dispose(): void {
        this.stop();
        this.callbacks.clear();
        this.log.info('Theme watcher disposed');
    }
}

// =============================================================================
// Singleton Factory
// =============================================================================

/** Singleton instance */
let themeWatcherInstance: ThemeWatcherService | null = null;

/**
 * Get or create the singleton ThemeWatcherService instance.
 *
 * @param {ThemeWatcherConfig} [config] - Config (only used on first call)
 * @returns {ThemeWatcherService} The singleton instance
 */
export function getThemeWatcher(config?: ThemeWatcherConfig): ThemeWatcherService {
    if (!themeWatcherInstance) {
        themeWatcherInstance = new ThemeWatcherService(config);
    }
    return themeWatcherInstance;
}
