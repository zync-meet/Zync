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
export declare class ThemeWatcherService {
    /** Current theme mode setting */
    private mode;
    /** Whether the service is actively watching */
    private isWatching;
    /** Registered change callbacks */
    private callbacks;
    /** Whether to send IPC messages to renderer windows */
    private notifyRenderers;
    /** IPC channel for notifications */
    private ipcChannel;
    /** Logger instance */
    private log;
    /** Reference to the nativeTheme listener for cleanup */
    private nativeThemeHandler;
    /**
     * Create a new ThemeWatcherService.
     *
     * @param {ThemeWatcherConfig} [config] - Configuration options
     */
    constructor(config?: ThemeWatcherConfig);
    /**
     * Get the currently resolved theme ('dark' or 'light').
     *
     * If mode is 'system', returns the system's current preference.
     * Otherwise returns the explicitly set mode.
     *
     * @returns {'dark' | 'light'} The resolved theme
     */
    get currentTheme(): 'dark' | 'light';
    /**
     * Get the current theme mode setting.
     *
     * @returns {ThemeMode} Current mode
     */
    get currentMode(): ThemeMode;
    /**
     * Check if the system is currently in dark mode.
     *
     * @returns {boolean} True if dark theme is active
     */
    get isDarkMode(): boolean;
    /**
     * Set the theme mode.
     *
     * @param {ThemeMode} mode - New theme mode
     */
    setMode(mode: ThemeMode): void;
    /**
     * Toggle between light and dark mode.
     * If currently in system mode, switches to the opposite of the current system theme.
     *
     * @returns {'dark' | 'light'} The new theme
     */
    toggle(): 'dark' | 'light';
    /**
     * Start watching for system theme changes.
     */
    start(): void;
    /**
     * Stop watching for theme changes.
     */
    stop(): void;
    /**
     * Register a callback for theme changes.
     *
     * @param {ThemeChangeCallback} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onChange(callback: ThemeChangeCallback): () => void;
    /**
     * Notify all registered callbacks and renderer windows of a theme change.
     *
     * @param {'dark' | 'light'} theme - The new theme
     */
    private notifyChange;
    /**
     * Dispose of the service and clean up all listeners.
     */
    dispose(): void;
}
/**
 * Get or create the singleton ThemeWatcherService instance.
 *
 * @param {ThemeWatcherConfig} [config] - Config (only used on first call)
 * @returns {ThemeWatcherService} The singleton instance
 */
export declare function getThemeWatcher(config?: ThemeWatcherConfig): ThemeWatcherService;
