import { BrowserWindow, ipcMain } from 'electron';
import { logger } from '../utils/logger.js';
const log = logger;
let config = {
    preventScreenCapture: false,
    protectAllWindows: false,
    excludeWindows: new Set(),
};
const protectedWindows = new Set();
export function initContentProtection(options) {
    if (options) {
        config = { ...config, ...options };
    }
    ipcMain.handle('content-protection:toggle', (_event, enabled) => {
        config.preventScreenCapture = enabled;
        applyToAllWindows(enabled);
        return getProtectionState();
    });
    ipcMain.handle('content-protection:state', () => {
        return getProtectionState();
    });
    log.info('Content protection initialized');
}
export function enableProtection(window) {
    if (window.isDestroyed())
        return;
    try {
        window.setContentProtection(true);
        protectedWindows.add(window.id);
        window.once('closed', () => {
            protectedWindows.delete(window.id);
        });
        log.info(`Content protection enabled for window ${window.id}`);
    }
    catch (err) {
        log.error(`Failed to enable content protection for window ${window.id}:`, err);
    }
}
export function disableProtection(window) {
    if (window.isDestroyed())
        return;
    try {
        window.setContentProtection(false);
        protectedWindows.delete(window.id);
        log.info(`Content protection disabled for window ${window.id}`);
    }
    catch (err) {
        log.error(`Failed to disable content protection for window ${window.id}:`, err);
    }
}
export function toggleProtection(window) {
    if (window.isDestroyed())
        return false;
    const isProtected = protectedWindows.has(window.id);
    if (isProtected) {
        disableProtection(window);
    }
    else {
        enableProtection(window);
    }
    return !isProtected;
}
export function applyToAllWindows(enabled) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        if (win.isDestroyed())
            continue;
        if (config.excludeWindows.has(String(win.id)))
            continue;
        if (enabled) {
            enableProtection(win);
        }
        else {
            disableProtection(win);
        }
    }
    log.info(`Content protection ${enabled ? 'enabled' : 'disabled'} on ${windows.length} windows`);
}
export function isWindowProtected(window) {
    return protectedWindows.has(window.id);
}
export function getProtectionState() {
    return {
        isProtected: config.preventScreenCapture,
        protectedWindowCount: protectedWindows.size,
        platformSupported: process.platform === 'darwin' || process.platform === 'win32',
    };
}
export function getProtectionConfig() {
    return { ...config };
}
//# sourceMappingURL=content-protection.js.map