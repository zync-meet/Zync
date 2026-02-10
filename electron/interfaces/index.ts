/**
 * =============================================================================
 * Electron Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * Shared TypeScript interfaces used across the Electron main process modules.
 *
 * @module electron/interfaces/index
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * Configuration for creating the main BrowserWindow.
 */
export interface WindowConfig {
    /** Window width in pixels */
    width: number;
    /** Window height in pixels */
    height: number;
    /** Minimum window width */
    minWidth: number;
    /** Minimum window height */
    minHeight: number;
    /** Window X position */
    x?: number;
    /** Window Y position */
    y?: number;
    /** Whether to show the window immediately */
    show: boolean;
    /** Whether the window should start maximized */
    maximized: boolean;
    /** Window title */
    title: string;
    /** Path to the window icon */
    icon?: string;
}

/**
 * Application settings stored in user preferences.
 */
export interface AppSettings {
    /** Application theme: light, dark, or follow system */
    theme: 'light' | 'dark' | 'system';
    /** Whether to start the app on system login */
    launchOnStartup: boolean;
    /** Whether to minimize to tray instead of closing */
    minimizeToTray: boolean;
    /** Whether to check for updates automatically */
    autoUpdate: boolean;
    /** Whether to show notifications */
    notifications: boolean;
    /** Preferred language code (e.g., 'en', 'es') */
    language: string;
    /** Zoom level for the renderer (1.0 = 100%) */
    zoomLevel: number;
}

/**
 * Default application settings.
 */
export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    launchOnStartup: false,
    minimizeToTray: true,
    autoUpdate: true,
    notifications: true,
    language: 'en',
    zoomLevel: 1.0,
};

/**
 * IPC message structure for main→renderer communication.
 */
export interface IPCMessage {
    /** Action identifier */
    action: string;
    /** Optional payload data */
    data?: unknown;
    /** Error message if action failed */
    error?: string;
}

/**
 * Update status for the auto-updater.
 */
export interface UpdateStatus {
    /** Current update state */
    state: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';
    /** Available version (if state is 'available' or later) */
    version?: string;
    /** Download progress percentage (0-100) */
    progress?: number;
    /** Error message (if state is 'error') */
    error?: string;
}

/**
 * System information collected for diagnostics.
 */
export interface SystemInfo {
    /** Operating system platform */
    platform: NodeJS.Platform;
    /** CPU architecture */
    arch: string;
    /** OS version string */
    osVersion: string;
    /** Total system memory in bytes */
    totalMemory: number;
    /** Free system memory in bytes */
    freeMemory: number;
    /** Number of CPU cores */
    cpuCount: number;
}
