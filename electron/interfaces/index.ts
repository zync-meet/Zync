export interface WindowConfig {

    width: number;

    height: number;

    minWidth: number;

    minHeight: number;

    x?: number;

    y?: number;

    show: boolean;

    maximized: boolean;

    title: string;

    icon?: string;
}


export interface AppSettings {

    theme: 'light' | 'dark' | 'system';

    launchOnStartup: boolean;

    minimizeToTray: boolean;

    autoUpdate: boolean;

    notifications: boolean;

    language: string;

    zoomLevel: number;
}


export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    launchOnStartup: false,
    minimizeToTray: true,
    autoUpdate: true,
    notifications: true,
    language: 'en',
    zoomLevel: 1.0,
};


export interface IPCMessage {

    action: string;

    data?: unknown;

    error?: string;
}


export interface UpdateStatus {

    state: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

    version?: string;

    progress?: number;

    error?: string;
}


export interface SystemInfo {

    platform: NodeJS.Platform;

    arch: string;

    osVersion: string;

    totalMemory: number;

    freeMemory: number;

    cpuCount: number;
}
