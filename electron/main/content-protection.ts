import { BrowserWindow, ipcMain } from 'electron';
import { logger } from '../utils/logger.js';


export interface ContentProtectionConfig {

    preventScreenCapture: boolean;

    protectAllWindows: boolean;

    excludeWindows: Set<string>;
}


export interface ContentProtectionState {

    isProtected: boolean;

    protectedWindowCount: number;

    platformSupported: boolean;
}


const log = logger;
let config: ContentProtectionConfig = {
    preventScreenCapture: false,
    protectAllWindows: false,
    excludeWindows: new Set(),
};


const protectedWindows = new Set<number>();


export function initContentProtection(options?: Partial<ContentProtectionConfig>): void {
    if (options) {
        config = { ...config, ...options };
    }


    ipcMain.handle('content-protection:toggle', (_event, enabled: boolean) => {
        config.preventScreenCapture = enabled;
        applyToAllWindows(enabled);
        return getProtectionState();
    });


    ipcMain.handle('content-protection:state', () => {
        return getProtectionState();
    });

    log.info('Content protection initialized');
}


export function enableProtection(window: BrowserWindow): void {
    if (window.isDestroyed()) return;

    try {
        window.setContentProtection(true);
        protectedWindows.add(window.id);


        window.once('closed', () => {
            protectedWindows.delete(window.id);
        });

        log.info(`Content protection enabled for window ${window.id}`);
    } catch (err) {
        log.error(`Failed to enable content protection for window ${window.id}:`, err);
    }
}


export function disableProtection(window: BrowserWindow): void {
    if (window.isDestroyed()) return;

    try {
        window.setContentProtection(false);
        protectedWindows.delete(window.id);
        log.info(`Content protection disabled for window ${window.id}`);
    } catch (err) {
        log.error(`Failed to disable content protection for window ${window.id}:`, err);
    }
}


export function toggleProtection(window: BrowserWindow): boolean {
    if (window.isDestroyed()) return false;

    const isProtected = protectedWindows.has(window.id);
    if (isProtected) {
        disableProtection(window);
    } else {
        enableProtection(window);
    }
    return !isProtected;
}


export function applyToAllWindows(enabled: boolean): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        if (win.isDestroyed()) continue;
        if (config.excludeWindows.has(String(win.id))) continue;

        if (enabled) {
            enableProtection(win);
        } else {
            disableProtection(win);
        }
    }
    log.info(`Content protection ${enabled ? 'enabled' : 'disabled'} on ${windows.length} windows`);
}


export function isWindowProtected(window: BrowserWindow): boolean {
    return protectedWindows.has(window.id);
}


export function getProtectionState(): ContentProtectionState {
    return {
        isProtected: config.preventScreenCapture,
        protectedWindowCount: protectedWindows.size,
        platformSupported: process.platform === 'darwin' || process.platform === 'win32',
    };
}


export function getProtectionConfig(): ContentProtectionConfig {
    return { ...config };
}
