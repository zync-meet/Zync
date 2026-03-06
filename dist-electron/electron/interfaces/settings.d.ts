export interface ZyncSettings {
    theme: 'light' | 'dark' | 'system';
    launchOnStartup: boolean;
    minimizeToTray: boolean;
    startMinimized: boolean;
    language: string;
    zoomLevel: number;
    notificationsEnabled: boolean;
    notificationSound: boolean;
    notifyWhenFocused: boolean;
    autoUpdate: boolean;
    allowPrerelease: boolean;
    analyticsEnabled: boolean;
    crashReportsEnabled: boolean;
    hardwareAcceleration: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    customCSS: string;
    proxyUrl: string;
}
export declare const DEFAULT_ZYNC_SETTINGS: ZyncSettings;
export interface SettingsChangeEvent<K extends keyof ZyncSettings = keyof ZyncSettings> {
    key: K;
    newValue: ZyncSettings[K];
    oldValue: ZyncSettings[K];
    timestamp: string;
}
export interface SettingsValidationResult {
    valid: boolean;
    errors: SettingsValidationError[];
}
export interface SettingsValidationError {
    key: string;
    message: string;
    value: unknown;
    expected: string;
}
