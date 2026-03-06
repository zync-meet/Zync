import { app, ipcMain } from 'electron';
import ElectronStore from 'electron-store';
export const DEFAULT_SETTINGS = {
    startOnLogin: false,
    startMinimized: false,
    minimizeToTray: true,
    closeToTray: process.platform === 'darwin',
    showTrayIcon: true,
    language: 'en',
    theme: 'system',
    accentColor: '#6366F1',
    sidebarWidth: 260,
    fontScale: 1.0,
    enableAnimations: true,
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
    downloadPath: app.getPath('downloads'),
    askDownloadLocation: false,
    maxConcurrentDownloads: 3,
    telemetryEnabled: true,
    crashReportingEnabled: true,
    clearDataOnQuit: false,
    autoCheckUpdates: true,
    autoDownloadUpdates: false,
    preReleaseChannel: false,
    shortcuts: {},
    hardwareAcceleration: true,
    developerMode: false,
    customApiUrl: '',
    logLevel: 'info',
    _settingsVersion: 1,
    _firstLaunchDate: new Date().toISOString(),
    _lastModified: new Date().toISOString(),
};
let store;
const changeListeners = new Map();
export function initSettingsStore() {
    store = new ElectronStore({
        name: 'settings',
        defaults: DEFAULT_SETTINGS,
        clearInvalidConfig: true,
        migrations: {
            '>=1.0.0': (migrationStore) => {
                const current = migrationStore.store;
                for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
                    if (!(key in current)) {
                        migrationStore.set(key, value);
                    }
                }
            },
        },
    });
    ipcMain.handle('settings:get-all', () => {
        return getAllSettings();
    });
    ipcMain.handle('settings:get', (_event, key) => {
        return getSetting(key);
    });
    ipcMain.handle('settings:set', (_event, key, value) => {
        setSetting(key, value);
        return true;
    });
    ipcMain.handle('settings:reset', () => {
        resetSettings();
        return true;
    });
    ipcMain.handle('settings:reset-key', (_event, key) => {
        resetSetting(key);
        return true;
    });
    ipcMain.handle('settings:toggle-login-item', () => {
        const current = getSetting('startOnLogin');
        setStartOnLogin(!current);
        return !current;
    });
    ipcMain.handle('settings:get-login-item-status', () => {
        return getLoginItemStatus();
    });
    console.info('[SettingsStore] Initialized');
    console.info(`[SettingsStore] Data file: ${store.path}`);
    syncLoginItemState();
}
export function getAllSettings() {
    return store.store;
}
export function getSetting(key) {
    return store.get(key);
}
export function setSetting(key, value) {
    const oldValue = store.get(key);
    store.set(key, value);
    store.set('_lastModified', new Date().toISOString());
    handleSettingSideEffect(key, value);
    notifyListeners(key, value, oldValue);
    console.info(`[SettingsStore] ${String(key)} = ${JSON.stringify(value)}`);
}
export function setMultipleSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
        setSetting(key, value);
    }
}
export function resetSettings() {
    store.clear();
    store.store = { ...DEFAULT_SETTINGS };
    console.info('[SettingsStore] All settings reset to defaults');
}
export function resetSetting(key) {
    const defaultValue = DEFAULT_SETTINGS[key];
    setSetting(key, defaultValue);
    console.info(`[SettingsStore] Reset ${String(key)} to default: ${JSON.stringify(defaultValue)}`);
}
export function isSettingModified(key) {
    const current = store.get(key);
    const defaultVal = DEFAULT_SETTINGS[key];
    return JSON.stringify(current) !== JSON.stringify(defaultVal);
}
export function setStartOnLogin(enabled) {
    setSetting('startOnLogin', enabled);
    try {
        if (process.platform === 'linux') {
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
function syncLoginItemState() {
    const stored = getSetting('startOnLogin');
    const osState = getLoginItemStatus();
    if (stored !== osState.openAtLogin) {
        console.info(`[SettingsStore] Syncing login item: stored=${stored}, os=${osState.openAtLogin}`);
        setStartOnLogin(stored);
    }
}
export function onSettingChange(key, listener) {
    const keyStr = key;
    const existing = changeListeners.get(keyStr) ?? [];
    existing.push(listener);
    changeListeners.set(keyStr, existing);
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
function handleSettingSideEffect(key, value) {
    switch (key) {
        case 'startOnLogin':
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
export function exportSettings() {
    const all = getAllSettings();
    const exportable = { ...all };
    delete exportable['_settingsVersion'];
    delete exportable['_firstLaunchDate'];
    delete exportable['_lastModified'];
    return JSON.stringify(exportable, null, 2);
}
export function importSettings(json) {
    const errors = [];
    let imported = 0;
    try {
        const parsed = JSON.parse(json);
        if (typeof parsed !== 'object' || parsed === null) {
            return { success: false, imported: 0, errors: ['Invalid JSON: not an object'] };
        }
        for (const [key, value] of Object.entries(parsed)) {
            if (key.startsWith('_'))
                continue;
            if (!(key in DEFAULT_SETTINGS)) {
                errors.push(`Unknown key: ${key}`);
                continue;
            }
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
export function getSettingsFilePath() {
    return store?.path ?? 'Not initialized';
}
//# sourceMappingURL=store.js.map