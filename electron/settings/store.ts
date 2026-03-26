import { app, ipcMain } from 'electron';
import ElectronStore from 'electron-store';


export interface ZyncSettings {


    startOnLogin: boolean;


    startMinimized: boolean;


    minimizeToTray: boolean;


    closeToTray: boolean;


    showTrayIcon: boolean;


    language: string;


    theme: 'light' | 'dark' | 'system';


    accentColor: string;


    sidebarWidth: number;


    fontScale: number;


    enableAnimations: boolean;


    notificationsEnabled: boolean;


    notificationSound: boolean;


    showBadgeCount: boolean;


    doNotDisturb: boolean;


    dndSchedule: {
        enabled: boolean;
        startHour: number;
        startMinute: number;
        endHour: number;
        endMinute: number;
    };


    downloadPath: string;


    askDownloadLocation: boolean;


    maxConcurrentDownloads: number;


    telemetryEnabled: boolean;


    crashReportingEnabled: boolean;


    clearDataOnQuit: boolean;


    autoCheckUpdates: boolean;


    autoDownloadUpdates: boolean;


    preReleaseChannel: boolean;


    shortcuts: Record<string, string>;


    hardwareAcceleration: boolean;


    developerMode: boolean;


    customApiUrl: string;


    logLevel: 'debug' | 'info' | 'warn' | 'error';


    _settingsVersion: number;


    _firstLaunchDate: string;


    _lastModified: string;
}


export const DEFAULT_SETTINGS: ZyncSettings = {

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


let store: ElectronStore<ZyncSettings>;


const changeListeners: Map<string, Array<(newValue: unknown, oldValue: unknown) => void>> = new Map();


export function initSettingsStore(): void {
    store = new ElectronStore<ZyncSettings>({
        name: 'settings',
        defaults: DEFAULT_SETTINGS,
        clearInvalidConfig: true,


        migrations: {
            '>=1.0.0': (migrationStore) => {

                const current = migrationStore.store as unknown as Record<string, unknown>;
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


    ipcMain.handle('settings:get', (_event, key: keyof ZyncSettings) => {
        return getSetting(key);
    });


    ipcMain.handle('settings:set', (_event, key: keyof ZyncSettings, value: unknown) => {
        setSetting(key, value as ZyncSettings[typeof key]);
        return true;
    });


    ipcMain.handle('settings:reset', () => {
        resetSettings();
        return true;
    });


    ipcMain.handle('settings:reset-key', (_event, key: keyof ZyncSettings) => {
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


export function getAllSettings(): ZyncSettings {
    return store.store;
}


export function getSetting<K extends keyof ZyncSettings>(key: K): ZyncSettings[K] {
    return store.get(key);
}


export function setSetting<K extends keyof ZyncSettings>(
    key: K,
    value: ZyncSettings[K],
): void {
    const oldValue = store.get(key);
    store.set(key, value);
    store.set('_lastModified', new Date().toISOString());


    handleSettingSideEffect(key, value);


    notifyListeners(key as string, value, oldValue);

    console.info(`[SettingsStore] ${String(key)} = ${JSON.stringify(value)}`);
}


export function setMultipleSettings(settings: Partial<ZyncSettings>): void {
    for (const [key, value] of Object.entries(settings)) {
        setSetting(key as keyof ZyncSettings, value as ZyncSettings[keyof ZyncSettings]);
    }
}


export function resetSettings(): void {
    store.clear();
    store.store = { ...DEFAULT_SETTINGS };
    console.info('[SettingsStore] All settings reset to defaults');
}


export function resetSetting<K extends keyof ZyncSettings>(key: K): void {
    const defaultValue = DEFAULT_SETTINGS[key];
    setSetting(key, defaultValue);
    console.info(`[SettingsStore] Reset ${String(key)} to default: ${JSON.stringify(defaultValue)}`);
}


export function isSettingModified<K extends keyof ZyncSettings>(key: K): boolean {
    const current = store.get(key);
    const defaultVal = DEFAULT_SETTINGS[key];
    return JSON.stringify(current) !== JSON.stringify(defaultVal);
}


export function setStartOnLogin(enabled: boolean): void {
    setSetting('startOnLogin', enabled);

    try {
        if (process.platform === 'linux') {

            app.setLoginItemSettings({
                openAtLogin: enabled,
                name: 'ZYNC',
            });
        } else {
            app.setLoginItemSettings({
                openAtLogin: enabled,
                openAsHidden: getSetting('startMinimized'),
                name: 'ZYNC',
            });
        }

        console.info(`[SettingsStore] Login item ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[SettingsStore] Failed to set login item: ${message}`);
    }
}


export function getLoginItemStatus(): {
    openAtLogin: boolean;
    wasOpenedAtLogin: boolean;
} {
    try {
        const settings = app.getLoginItemSettings();
        return {
            openAtLogin: settings.openAtLogin,
            wasOpenedAtLogin: settings.wasOpenedAtLogin ?? false,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[SettingsStore] Failed to get login item status: ${message}`);
        return { openAtLogin: false, wasOpenedAtLogin: false };
    }
}


function syncLoginItemState(): void {
    const stored = getSetting('startOnLogin');
    const osState = getLoginItemStatus();

    if (stored !== osState.openAtLogin) {
        console.info(
            `[SettingsStore] Syncing login item: stored=${stored}, os=${osState.openAtLogin}`,
        );

        setStartOnLogin(stored);
    }
}


export function onSettingChange<K extends keyof ZyncSettings>(
    key: K,
    listener: (newValue: ZyncSettings[K], oldValue: ZyncSettings[K]) => void,
): () => void {
    const keyStr = key as string;
    const existing = changeListeners.get(keyStr) ?? [];
    existing.push(listener as (newValue: unknown, oldValue: unknown) => void);
    changeListeners.set(keyStr, existing);


    return () => {
        const listeners = changeListeners.get(keyStr);
        if (!listeners) {return;}

        const index = listeners.indexOf(listener as (newValue: unknown, oldValue: unknown) => void);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    };
}


function notifyListeners(key: string, newValue: unknown, oldValue: unknown): void {
    const listeners = changeListeners.get(key);
    if (!listeners || listeners.length === 0) {return;}

    for (const listener of listeners) {
        try {
            listener(newValue, oldValue);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[SettingsStore] Listener error for '${key}': ${message}`);
        }
    }
}


function handleSettingSideEffect<K extends keyof ZyncSettings>(
    key: K,
    value: ZyncSettings[K],
): void {
    switch (key) {
        case 'startOnLogin':

            break;

        case 'hardwareAcceleration':
            if (value === false) {
                console.warn(
                    '[SettingsStore] Hardware acceleration disabled. Restart required to take effect.',
                );
            }
            break;

        case 'logLevel':
            console.info(`[SettingsStore] Log level changed to: ${value}`);
            break;

        default:
            break;
    }
}


export function exportSettings(): string {
    const all = getAllSettings();
    const exportable = { ...all };


    delete (exportable as Record<string, unknown>)['_settingsVersion'];
    delete (exportable as Record<string, unknown>)['_firstLaunchDate'];
    delete (exportable as Record<string, unknown>)['_lastModified'];

    return JSON.stringify(exportable, null, 2);
}


export function importSettings(json: string): {
    success: boolean;
    imported: number;
    errors: string[];
} {
    const errors: string[] = [];
    let imported = 0;

    try {
        const parsed = JSON.parse(json);
        if (typeof parsed !== 'object' || parsed === null) {
            return { success: false, imported: 0, errors: ['Invalid JSON: not an object'] };
        }

        for (const [key, value] of Object.entries(parsed)) {

            if (key.startsWith('_')) {continue;}


            if (!(key in DEFAULT_SETTINGS)) {
                errors.push(`Unknown key: ${key}`);
                continue;
            }


            const defaultType = typeof DEFAULT_SETTINGS[key as keyof ZyncSettings];
            if (typeof value !== defaultType) {
                errors.push(`Type mismatch for ${key}: expected ${defaultType}, got ${typeof value}`);
                continue;
            }

            setSetting(key as keyof ZyncSettings, value as ZyncSettings[keyof ZyncSettings]);
            imported++;
        }

        return { success: true, imported, errors };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, imported, errors: [message] };
    }
}


export function getSettingsFilePath(): string {
    return store?.path ?? 'Not initialized';
}
