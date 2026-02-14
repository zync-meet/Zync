/**
 * =============================================================================
 * Settings Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript interfaces for the application settings system. Settings are
 * persisted locally using electron-store and synced across the application.
 *
 * Settings categories:
 * - General: Theme, language, startup behavior
 * - Notifications: Desktop notification preferences
 * - Updates: Auto-update configuration
 * - Privacy: Data collection and telemetry
 * - Advanced: Developer tools, logging level
 *
 * @module electron/interfaces/settings
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * Complete application settings object.
 *
 * This interface defines ALL configurable settings in the ZYNC desktop
 * application. Each property is documented with its purpose, valid values,
 * and default value. The settings are organized into logical groups.
 *
 * @interface ZyncSettings
 */
export interface ZyncSettings {
    // =========================================================================
    // General Settings
    // =========================================================================

    /**
     * Application color theme.
     *
     * - 'light': Force light theme
     * - 'dark': Force dark theme
     * - 'system': Follow the operating system's theme preference
     *
     * @default 'system'
     */
    theme: 'light' | 'dark' | 'system';

    /**
     * Whether to launch ZYNC automatically when the user logs in.
     *
     * Uses `app.setLoginItemSettings()` to register/unregister the app
     * as a startup item. Behavior varies by platform:
     * - Windows: Adds to HKCU\Software\Microsoft\Windows\CurrentVersion\Run
     * - macOS: Adds to Login Items in System Preferences
     * - Linux: Creates a .desktop file in ~/.config/autostart/
     *
     * @default false
     */
    launchOnStartup: boolean;

    /**
     * Whether to minimize to the system tray instead of closing.
     *
     * When enabled, clicking the close button hides the window to the
     * system tray instead of quitting the application. The application
     * continues running in the background and can be restored from the
     * tray icon.
     *
     * @default true
     */
    minimizeToTray: boolean;

    /**
     * Whether to start the application minimized (in the tray).
     *
     * When combined with launchOnStartup, this allows the application
     * to start silently in the background.
     *
     * @default false
     */
    startMinimized: boolean;

    /**
     * Preferred language for the application UI.
     *
     * Uses BCP 47 language codes (e.g., 'en', 'es', 'fr', 'de', 'ja').
     * Language packs are loaded from the locales directory.
     *
     * @default 'en'
     */
    language: string;

    /**
     * Zoom level for the renderer process.
     *
     * 1.0 = 100% (default), 0.5 = 50%, 2.0 = 200%.
     * Persisted across sessions and applied on window creation.
     *
     * @default 1.0
     */
    zoomLevel: number;

    // =========================================================================
    // Notification Settings
    // =========================================================================

    /**
     * Whether to show desktop notifications.
     *
     * @default true
     */
    notificationsEnabled: boolean;

    /**
     * Whether to play a sound with notifications.
     *
     * @default true
     */
    notificationSound: boolean;

    /**
     * Whether to show notifications when the window is focused.
     *
     * When disabled, notifications are only shown when the application
     * window is not the active/focused window.
     *
     * @default false
     */
    notifyWhenFocused: boolean;

    // =========================================================================
    // Update Settings
    // =========================================================================

    /**
     * Whether to automatically check for and install updates.
     *
     * @default true
     */
    autoUpdate: boolean;

    /**
     * Whether to allow pre-release (beta) updates.
     *
     * @default false
     */
    allowPrerelease: boolean;

    // =========================================================================
    // Privacy Settings
    // =========================================================================

    /**
     * Whether to send anonymous usage analytics.
     *
     * @default false
     */
    analyticsEnabled: boolean;

    /**
     * Whether to send crash reports automatically.
     *
     * @default true
     */
    crashReportsEnabled: boolean;

    // =========================================================================
    // Advanced Settings
    // =========================================================================

    /**
     * Whether to enable hardware acceleration.
     *
     * Disabling this can help with some rendering issues.
     *
     * @default true
     */
    hardwareAcceleration: boolean;

    /**
     * Logging level for the application.
     *
     * @default 'info'
     */
    logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';

    /**
     * Custom CSS to inject into the renderer process.
     *
     * @default ''
     */
    customCSS: string;

    /**
     * Proxy configuration for network requests.
     *
     * @default ''
     */
    proxyUrl: string;
}

/**
 * Default settings values.
 *
 * These values are used when a setting has never been modified by the user,
 * or when the settings file is corrupted/missing.
 *
 * @const DEFAULT_ZYNC_SETTINGS
 */
export const DEFAULT_ZYNC_SETTINGS: ZyncSettings = {
    // General
    theme: 'system',
    launchOnStartup: false,
    minimizeToTray: true,
    startMinimized: false,
    language: 'en',
    zoomLevel: 1.0,

    // Notifications
    notificationsEnabled: true,
    notificationSound: true,
    notifyWhenFocused: false,

    // Updates
    autoUpdate: true,
    allowPrerelease: false,

    // Privacy
    analyticsEnabled: false,
    crashReportsEnabled: true,

    // Advanced
    hardwareAcceleration: true,
    logLevel: 'info',
    customCSS: '',
    proxyUrl: '',
};

/**
 * Settings change event data.
 *
 * Emitted when any setting is modified, allowing other modules to
 * react to configuration changes in real-time.
 *
 * @interface SettingsChangeEvent
 */
export interface SettingsChangeEvent<K extends keyof ZyncSettings = keyof ZyncSettings> {
    /** The setting key that was changed */
    key: K;

    /** The new value */
    newValue: ZyncSettings[K];

    /** The previous value */
    oldValue: ZyncSettings[K];

    /** Timestamp of the change */
    timestamp: string;
}

/**
 * Settings validation result.
 *
 * @interface SettingsValidationResult
 */
export interface SettingsValidationResult {
    /** Whether the settings are valid */
    valid: boolean;

    /** List of validation errors (empty if valid) */
    errors: SettingsValidationError[];
}

/**
 * Individual settings validation error.
 *
 * @interface SettingsValidationError
 */
export interface SettingsValidationError {
    /** The setting key that failed validation */
    key: string;

    /** Human-readable error message */
    message: string;

    /** The invalid value that was provided */
    value: unknown;

    /** The expected type or valid values */
    expected: string;
}
