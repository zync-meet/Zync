/**
 * =============================================================================
 * Settings Store — ZYNC Desktop Application
 * =============================================================================
 *
 * Persistent settings store using electron-store. Manages all user preferences
 * including startup behavior, appearance, notification preferences, download
 * paths, keyboard shortcuts, and the "Start on Login" toggle.
 *
 * The store is backed by a JSON file in the user's app data directory and
 * supports:
 * - Schema validation with defaults
 * - Type-safe getters and setters
 * - Change event subscriptions
 * - Migration from previous versions
 * - Start on Login integration via app.setLoginItemSettings()
 *
 * Data Location:
 * - Linux: ~/.config/zync/settings.json
 * - macOS: ~/Library/Application Support/zync/settings.json
 * - Windows: %APPDATA%/zync/settings.json
 *
 * @module electron/settings/store
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/**
 * Complete settings schema for the ZYNC application.
 *
 * @interface ZyncSettings
 */
export interface ZyncSettings {
    /** Start ZYNC automatically when the user logs in (default: false) */
    startOnLogin: boolean;
    /** Start minimized to the system tray (default: false) */
    startMinimized: boolean;
    /** Minimize to tray instead of closing (default: true) */
    minimizeToTray: boolean;
    /** Close to tray instead of quitting (default: true on macOS, false elsewhere) */
    closeToTray: boolean;
    /** Show the application in the system tray (default: true) */
    showTrayIcon: boolean;
    /** Application language/locale (default: 'en') */
    language: string;
    /** Theme preference (default: 'system') */
    theme: 'light' | 'dark' | 'system';
    /** Accent color hex code (default: '#6366F1' — ZYNC indigo) */
    accentColor: string;
    /** Sidebar width in pixels (default: 260) */
    sidebarWidth: number;
    /** Font size scale factor (default: 1.0) */
    fontScale: number;
    /** Enable animations and transitions (default: true) */
    enableAnimations: boolean;
    /** Enable desktop notifications (default: true) */
    notificationsEnabled: boolean;
    /** Play notification sounds (default: true) */
    notificationSound: boolean;
    /** Show notification badges on the dock/taskbar icon (default: true) */
    showBadgeCount: boolean;
    /** Enable Do Not Disturb mode (default: false) */
    doNotDisturb: boolean;
    /** DND schedule (if set, auto-enables DND during these hours) */
    dndSchedule: {
        enabled: boolean;
        startHour: number;
        startMinute: number;
        endHour: number;
        endMinute: number;
    };
    /** Default download directory (default: system Downloads folder) */
    downloadPath: string;
    /** Ask where to save each download (default: false) */
    askDownloadLocation: boolean;
    /** Maximum concurrent downloads (default: 3) */
    maxConcurrentDownloads: number;
    /** Enable telemetry/analytics (default: true) */
    telemetryEnabled: boolean;
    /** Enable crash reporting (default: true) */
    crashReportingEnabled: boolean;
    /** Clear data on quit (default: false) */
    clearDataOnQuit: boolean;
    /** Automatically check for updates (default: true) */
    autoCheckUpdates: boolean;
    /** Automatically download updates (default: false) */
    autoDownloadUpdates: boolean;
    /** Pre-release channel (default: false) */
    preReleaseChannel: boolean;
    /** Custom keyboard shortcuts (keybinding → action) */
    shortcuts: Record<string, string>;
    /** Hardware acceleration (default: true) */
    hardwareAcceleration: boolean;
    /** Developer mode (default: false) */
    developerMode: boolean;
    /** Custom API server URL (default: empty — use production) */
    customApiUrl: string;
    /** Log level (default: 'info') */
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    /** Settings schema version for migration */
    _settingsVersion: number;
    /** First launch timestamp */
    _firstLaunchDate: string;
    /** Last settings modification timestamp */
    _lastModified: string;
}
/**
 * Default settings values.
 *
 * @constant {ZyncSettings}
 */
export declare const DEFAULT_SETTINGS: ZyncSettings;
/**
 * Initializes the settings store.
 *
 * Creates the electron-store instance with schema defaults and sets up
 * IPC handlers for renderer ↔ main settings communication.
 *
 * @example
 * ```typescript
 * import { initSettingsStore } from './settings/store';
 *
 * app.whenReady().then(() => {
 *   initSettingsStore();
 *   // Settings are now available
 * });
 * ```
 */
export declare function initSettingsStore(): void;
/**
 * Gets all settings as a plain object.
 *
 * @returns {ZyncSettings} All current settings
 */
export declare function getAllSettings(): ZyncSettings;
/**
 * Gets a specific setting value.
 *
 * @template K - The settings key type
 * @param {K} key - The setting key
 * @returns {ZyncSettings[K]} The setting value
 *
 * @example
 * ```typescript
 * const theme = getSetting('theme'); // 'light' | 'dark' | 'system'
 * const startOnLogin = getSetting('startOnLogin'); // boolean
 * ```
 */
export declare function getSetting<K extends keyof ZyncSettings>(key: K): ZyncSettings[K];
/**
 * Sets a specific setting value.
 *
 * Automatically updates the `_lastModified` timestamp and notifies
 * registered change listeners.
 *
 * @template K - The settings key type
 * @param {K} key - The setting key
 * @param {ZyncSettings[K]} value - The new value
 *
 * @example
 * ```typescript
 * setSetting('theme', 'dark');
 * setSetting('startOnLogin', true);
 * ```
 */
export declare function setSetting<K extends keyof ZyncSettings>(key: K, value: ZyncSettings[K]): void;
/**
 * Sets multiple settings at once.
 *
 * @param {Partial<ZyncSettings>} settings - Key-value pairs to set
 */
export declare function setMultipleSettings(settings: Partial<ZyncSettings>): void;
/**
 * Resets all settings to their defaults.
 */
export declare function resetSettings(): void;
/**
 * Resets a specific setting to its default.
 *
 * @template K - The settings key type
 * @param {K} key - The setting key to reset
 */
export declare function resetSetting<K extends keyof ZyncSettings>(key: K): void;
/**
 * Checks if a setting has been changed from its default.
 *
 * @template K - The settings key type
 * @param {K} key - The setting key
 * @returns {boolean} True if the setting differs from default
 */
export declare function isSettingModified<K extends keyof ZyncSettings>(key: K): boolean;
/**
 * Sets whether ZYNC should start on user login.
 *
 * Updates both the settings store and the OS login item settings.
 *
 * @param {boolean} enabled - Whether to start on login
 *
 * @example
 * ```typescript
 * setStartOnLogin(true);  // Enable auto-start
 * setStartOnLogin(false); // Disable auto-start
 * ```
 */
export declare function setStartOnLogin(enabled: boolean): void;
/**
 * Gets the current login item status from the OS.
 *
 * @returns {{ openAtLogin: boolean; wasOpenedAtLogin: boolean }}
 */
export declare function getLoginItemStatus(): {
    openAtLogin: boolean;
    wasOpenedAtLogin: boolean;
};
/**
 * Registers a listener for changes to a specific setting.
 *
 * @template K - The settings key type
 * @param {K} key - The setting key to watch
 * @param {(newValue: ZyncSettings[K], oldValue: ZyncSettings[K]) => void} listener - Callback
 * @returns {() => void} Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onSettingChange('theme', (newTheme, oldTheme) => {
 *   console.log(`Theme changed from ${oldTheme} to ${newTheme}`);
 *   applyTheme(newTheme);
 * });
 *
 * // Later: unsubscribe();
 * ```
 */
export declare function onSettingChange<K extends keyof ZyncSettings>(key: K, listener: (newValue: ZyncSettings[K], oldValue: ZyncSettings[K]) => void): () => void;
/**
 * Exports all settings as a JSON string.
 *
 * Excludes internal metadata fields.
 *
 * @returns {string} JSON string of exportable settings
 */
export declare function exportSettings(): string;
/**
 * Imports settings from a JSON string.
 *
 * Only imports recognized keys and validates types.
 *
 * @param {string} json - The JSON settings string
 * @returns {{ success: boolean; imported: number; errors: string[] }}
 */
export declare function importSettings(json: string): {
    success: boolean;
    imported: number;
    errors: string[];
};
/**
 * Returns the settings file path for display/debugging.
 *
 * @returns {string} Absolute path to the settings JSON file
 */
export declare function getSettingsFilePath(): string;
