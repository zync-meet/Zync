/**
 * =============================================================================
 * Content Protection — ZYNC Desktop
 * =============================================================================
 *
 * Provides screen capture protection and content security features.
 * When enabled, prevents the application window from being captured
 * by screen recording or screenshot tools.
 *
 * @module electron/main/content-protection
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow, ipcMain } from 'electron';
import { logger } from '../utils/logger.js';
// =============================================================================
// Module State
// =============================================================================
const log = logger;
let config = {
    preventScreenCapture: false,
    protectAllWindows: false,
    excludeWindows: new Set(),
};
/** Set of window IDs that are currently protected */
const protectedWindows = new Set();
// =============================================================================
// Public API
// =============================================================================
/**
 * Initialize content protection with IPC handlers.
 *
 * @param {Partial<ContentProtectionConfig>} [options] - Configuration options
 */
export function initContentProtection(options) {
    if (options) {
        config = { ...config, ...options };
    }
    // IPC: Enable/disable content protection
    ipcMain.handle('content-protection:toggle', (_event, enabled) => {
        config.preventScreenCapture = enabled;
        applyToAllWindows(enabled);
        return getProtectionState();
    });
    // IPC: Get protection state
    ipcMain.handle('content-protection:state', () => {
        return getProtectionState();
    });
    log.info('Content protection initialized');
}
/**
 * Enable screen capture protection on a specific window.
 *
 * Uses BrowserWindow.setContentProtection() which leverages OS-level
 * APIs to prevent the window contents from being captured:
 * - macOS: Uses NSWindow's sharingType = none
 * - Windows: Uses SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)
 *
 * @param {BrowserWindow} window - Window to protect
 */
export function enableProtection(window) {
    if (window.isDestroyed())
        return;
    try {
        window.setContentProtection(true);
        protectedWindows.add(window.id);
        // Clean up when window is closed
        window.once('closed', () => {
            protectedWindows.delete(window.id);
        });
        log.info(`Content protection enabled for window ${window.id}`);
    }
    catch (err) {
        log.error(`Failed to enable content protection for window ${window.id}:`, err);
    }
}
/**
 * Disable screen capture protection on a specific window.
 *
 * @param {BrowserWindow} window - Window to unprotect
 */
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
/**
 * Toggle content protection on a specific window.
 *
 * @param {BrowserWindow} window - Window to toggle
 * @returns {boolean} New protection state
 */
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
/**
 * Apply content protection to all open windows.
 *
 * @param {boolean} enabled - Whether to enable or disable
 */
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
/**
 * Check if a window is protected.
 *
 * @param {BrowserWindow} window - Window to check
 * @returns {boolean} True if protected
 */
export function isWindowProtected(window) {
    return protectedWindows.has(window.id);
}
/**
 * Get the current content protection state.
 *
 * @returns {ContentProtectionState} Current state
 */
export function getProtectionState() {
    return {
        isProtected: config.preventScreenCapture,
        protectedWindowCount: protectedWindows.size,
        platformSupported: process.platform === 'darwin' || process.platform === 'win32',
    };
}
/**
 * Get the current configuration.
 *
 * @returns {ContentProtectionConfig} Current config
 */
export function getProtectionConfig() {
    return { ...config };
}
//# sourceMappingURL=content-protection.js.map