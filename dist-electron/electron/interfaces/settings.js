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
 * Default settings values.
 *
 * These values are used when a setting has never been modified by the user,
 * or when the settings file is corrupted/missing.
 *
 * @const DEFAULT_ZYNC_SETTINGS
 */
export const DEFAULT_ZYNC_SETTINGS = {
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
//# sourceMappingURL=settings.js.map