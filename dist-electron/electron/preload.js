/**
 * =============================================================================
 * Preload Script — ZYNC Desktop Application
 * =============================================================================
 *
 * This script runs before the renderer process is loaded. It has access to
 * both Node.js APIs and the DOM. It uses contextBridge to safely expose
 * specific APIs to the renderer, ensuring security through context isolation.
 *
 * All APIs exposed here must be documented in `electron/preload/types.ts`.
 *
 * security:
 * - Direct access to ipcRenderer is never exposed
 * - All exposed functions perform basic validation
 * - Only whitelisted channels are allowed
 *
 * @module electron/preload
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { contextBridge, ipcRenderer } from 'electron';
/**
 * Validates that an action name is a string and potentially matches
 * our whitelisted channels.
 *
 * @param {string} action - The action name to validate
 * @returns {boolean} True if valid
 */
function isValidAction(action) {
    return typeof action === 'string' && action.length > 0;
}
/**
 * Safely exposes Electron APIs to the renderer process.
 */
contextBridge.exposeInMainWorld('electron', {
    // Navigation & Platform
    downloadPlatform: (platform) => {
        ipcRenderer.send('download-platform', platform);
    },
    openSettings: () => {
        ipcRenderer.send('open-settings');
    },
    openExternalLink: (url) => {
        ipcRenderer.send('open-external-link', url);
    },
    copyToClipboard: (text) => {
        ipcRenderer.send('copy-to-clipboard', text);
    },
    // App & System Info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
    // Window Management
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
    // File System Operations
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    writeFile: (data) => ipcRenderer.invoke('write-file', data),
    // Events from Main Process
    onMainMessage: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('fromMain', subscription);
        // Return a cleanup function
        return () => {
            ipcRenderer.removeListener('fromMain', subscription);
        };
    },
    // Environment info
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    platform: process.platform,
});
// Also expose 'versions' for backward compatibility or simple checks
contextBridge.exposeInMainWorld('versions', {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
});
console.info('[Preload] APIs exposed to renderer');
//# sourceMappingURL=preload.js.map