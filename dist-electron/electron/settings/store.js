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
import { app, ipcMain } from 'electron';
import ElectronStore from 'electron-store';
/**
 * Default settings values.
 *
 * @constant {ZyncSettings}
 */
export const DEFAULT_SETTINGS = {
    // General
    startOnLogin: false,
    startMinimized: false,
    minimizeToTray: true,
    closeToTray: process.platform === 'darwin',
    showTrayIcon: true,
    language: 'en',
    // Appearance
    theme: 'system',
    accentColor: '#6366F1',
    sidebarWidth: 260,
    fontScale: 1.0,
    enableAnimations: true,
    // Notifications
    notificationsEnabled: true,
    notificationSound: true,
    showBadgeCount: true,
    doNotDisturb: false,
    dndSchedule: {
        enabled: false,
        startHour: 22,
        startMinute: 0,
        endHour: 8,
        endMinute: 0,
    },
    // Downloads
    downloadPath: app.getPath('downloads'),
    askDownloadLocation: false,
    maxConcurrentDownloads: 3,
    // Privacy
    telemetryEnabled: true,
    crashReportingEnabled: true,
    clearDataOnQuit: false,
    // Updates
    autoCheckUpdates: true,
    autoDownloadUpdates: false,
    preReleaseChannel: false,
    // Shortcuts
    shortcuts: {},
    // Advanced
    hardwareAcceleration: true,
    developerMode: false,
    customApiUrl: '',
    logLevel: 'info',
    // Internal
    _settingsVersion: 1,
    _firstLaunchDate: new Date().toISOString(),
    _lastModified: new Date().toISOString(),
};
// =============================================================================
// Store Instance
// =============================================================================
/** The electron-store instance */
let store;
/** Change listeners */
const changeListeners = new Map();
// =============================================================================
// Initialization
// =============================================================================
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
export function initSettingsStore() {
    store = new ElectronStore({
        name: 'settings',
        defaults: DEFAULT_SETTINGS,
        clearInvalidConfig: true,
        // Run migrations when settings schema changes
        migrations: {
            '>=1.0.0': (migrationStore) => {
                // Ensure all new keys exist
                const current = migrationStore.store;
                for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
                    if (!(key in current)) {
                        migrationStore.set(key, value);
                    }
                }
            },
        },
    });
    // =========================================================================
    // Register IPC Handlers
    // =========================================================================
    // Get all settings
    ipcMain.handle('settings:get-all', () => {
        return getAllSettings();
    });
    // Get a specific setting
    ipcMain.handle('settings:get', (_event, key) => {
        return getSetting(key);
    });
    // Set a specific setting
    ipcMain.handle('settings:set', (_event, key, value) => {
        setSetting(key, value);
        return true;
    });
    // Reset settings to defaults
    ipcMain.handle('settings:reset', () => {
        resetSettings();
        return true;
    });
    // Reset a specific setting
    ipcMain.handle('settings:reset-key', (_event, key) => {
        resetSetting(key);
        return true;
    });
    // Toggle start on login
    ipcMain.handle('settings:toggle-login-item', () => {
        const current = getSetting('startOnLogin');
        setStartOnLogin(!current);
        return !current;
    });
    // Get login item status
    ipcMain.handle('settings:get-login-item-status', () => {
        return getLoginItemStatus();
    });
    console.info('[SettingsStore] Initialized');
    console.info(`[SettingsStore] Data file: ${store.path}`);
    // Sync login item state on startup
    syncLoginItemState();
}
// =============================================================================
// Getters & Setters
// =============================================================================
/**
 * Gets all settings as a plain object.
 *
 * @returns {ZyncSettings} All current settings
 */
export function getAllSettings() {
    return store.store;
}
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
export function getSetting(key) {
    return store.get(key);
}
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
export function setSetting(key, value) {
    const oldValue = store.get(key);
    store.set(key, value);
    store.set('_lastModified', new Date().toISOString());
    // Handle side effects
    handleSettingSideEffect(key, value);
    // Notify listeners
    notifyListeners(key, value, oldValue);
    console.info(`[SettingsStore] ${String(key)} = ${JSON.stringify(value)}`);
}
/**
 * Sets multiple settings at once.
 *
 * @param {Partial<ZyncSettings>} settings - Key-value pairs to set
 */
export function setMultipleSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
        setSetting(key, value);
    }
}
/**
 * Resets all settings to their defaults.
 */
export function resetSettings() {
    store.clear();
    store.store = { ...DEFAULT_SETTINGS };
    console.info('[SettingsStore] All settings reset to defaults');
}
/**
 * Resets a specific setting to its default.
 *
 * @template K - The settings key type
 * @param {K} key - The setting key to reset
 */
export function resetSetting(key) {
    const defaultValue = DEFAULT_SETTINGS[key];
    setSetting(key, defaultValue);
    console.info(`[SettingsStore] Reset ${String(key)} to default: ${JSON.stringify(defaultValue)}`);
}
/**
 * Checks if a setting has been changed from its default.
 *
 * @template K - The settings key type
 * @param {K} key - The setting key
 * @returns {boolean} True if the setting differs from default
 */
export function isSettingModified(key) {
    const current = store.get(key);
    const defaultVal = DEFAULT_SETTINGS[key];
    return JSON.stringify(current) !== JSON.stringify(defaultVal);
}
// =============================================================================
// Start on Login
// =============================================================================
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
export function setStartOnLogin(enabled) {
    setSetting('startOnLogin', enabled);
    try {
        if (process.platform === 'linux') {
            // Linux: Use app.setLoginItemSettings with minimal config
            app.setLoginItemSettings({
                openAtLogin: enabled,
                name: 'ZYNC',
            });
        }
        else {
            app.setLoginItemSettings({
                openAtLogin: enabled,
                openAsHidden: getSetting('startMinimized'),
                name: 'ZYNC',
            });
        }
        console.info(`[SettingsStore] Login item ${enabled ? 'enabled' : 'disabled'}`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[SettingsStore] Failed to set login item: ${message}`);
    }
}
/**
 * Gets the current login item status from the OS.
 *
 * @returns {{ openAtLogin: boolean; wasOpenedAtLogin: boolean }}
 */
export function getLoginItemStatus() {
    try {
        const settings = app.getLoginItemSettings();
        return {
            openAtLogin: settings.openAtLogin,
            wasOpenedAtLogin: settings.wasOpenedAtLogin ?? false,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[SettingsStore] Failed to get login item status: ${message}`);
        return { openAtLogin: false, wasOpenedAtLogin: false };
    }
}
/**
 * Synchronizes the stored setting with the actual OS login item state.
 *
 * Ensures consistency between the setting and OS state on startup.
 *
 * @internal
 */
function syncLoginItemState() {
    const stored = getSetting('startOnLogin');
    const osState = getLoginItemStatus();
    if (stored !== osState.openAtLogin) {
        console.info(`[SettingsStore] Syncing login item: stored=${stored}, os=${osState.openAtLogin}`);
        // Trust the stored setting and update OS
        setStartOnLogin(stored);
    }
}
// =============================================================================
// Change Listeners
// =============================================================================
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
export function onSettingChange(key, listener) {
    const keyStr = key;
    const existing = changeListeners.get(keyStr) ?? [];
    existing.push(listener);
    changeListeners.set(keyStr, existing);
    // Return unsubscribe function
    return () => {
        const listeners = changeListeners.get(keyStr);
        if (!listeners)
            return;
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    };
}
/**
 * Notifies all listeners for a specific setting change.
 *
 * @internal
 */
function notifyListeners(key, newValue, oldValue) {
    const listeners = changeListeners.get(key);
    if (!listeners || listeners.length === 0)
        return;
    for (const listener of listeners) {
        try {
            listener(newValue, oldValue);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[SettingsStore] Listener error for '${key}': ${message}`);
        }
    }
}
// =============================================================================
// Side Effects
// =============================================================================
/**
 * Handles side effects when specific settings change.
 *
 * @internal
 */
function handleSettingSideEffect(key, value) {
    switch (key) {
        case 'startOnLogin':
            // Login item is handled by the setStartOnLogin function
            break;
        case 'hardwareAcceleration':
            if (value === false) {
                console.warn('[SettingsStore] Hardware acceleration disabled. Restart required to take effect.');
            }
            break;
        case 'logLevel':
            console.info(`[SettingsStore] Log level changed to: ${value}`);
            break;
        default:
            break;
    }
}
// =============================================================================
// Export Utilities
// =============================================================================
/**
 * Exports all settings as a JSON string.
 *
 * Excludes internal metadata fields.
 *
 * @returns {string} JSON string of exportable settings
 */
export function exportSettings() {
    const all = getAllSettings();
    const exportable = { ...all };
    // Remove internal fields
    delete exportable['_settingsVersion'];
    delete exportable['_firstLaunchDate'];
    delete exportable['_lastModified'];
    return JSON.stringify(exportable, null, 2);
}
/**
 * Imports settings from a JSON string.
 *
 * Only imports recognized keys and validates types.
 *
 * @param {string} json - The JSON settings string
 * @returns {{ success: boolean; imported: number; errors: string[] }}
 */
export function importSettings(json) {
    const errors = [];
    let imported = 0;
    try {
        const parsed = JSON.parse(json);
        if (typeof parsed !== 'object' || parsed === null) {
            return { success: false, imported: 0, errors: ['Invalid JSON: not an object'] };
        }
        for (const [key, value] of Object.entries(parsed)) {
            // Skip internal fields
            if (key.startsWith('_'))
                continue;
            // Only import known keys
            if (!(key in DEFAULT_SETTINGS)) {
                errors.push(`Unknown key: ${key}`);
                continue;
            }
            // Type check (simple)
            const defaultType = typeof DEFAULT_SETTINGS[key];
            if (typeof value !== defaultType) {
                errors.push(`Type mismatch for ${key}: expected ${defaultType}, got ${typeof value}`);
                continue;
            }
            setSetting(key, value);
            imported++;
        }
        return { success: true, imported, errors };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, imported, errors: [message] };
    }
}
/**
 * Returns the settings file path for display/debugging.
 *
 * @returns {string} Absolute path to the settings JSON file
 */
export function getSettingsFilePath() {
    return store?.path ?? 'Not initialized';
}
//# sourceMappingURL=store.js.map