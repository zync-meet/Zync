/**
 * @file preload.ts
 * @description Preload script for the renderer process.
 * This script runs before the renderer process is loaded and has access to both
 * Node.js APIs and the DOM. It uses contextBridge to safely expose specific
 * APIs to the renderer process, maintaining security by isolating the context.
 *
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 */
import { contextBridge, ipcRenderer } from 'electron';
/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object.
 */
contextBridge.exposeInMainWorld('electron', {
    /**
     * Request to download the application for a specific platform.
     * Sends an IPC message to the main process.
     *
     * @param {string} platform - The target platform ('win', 'mac', 'linux').
     */
    downloadPlatform: (platform) => {
        // Validate the input to prevent arbitrary IPC calls
        const validPlatforms = ['win', 'mac', 'linux'];
        if (validPlatforms.includes(platform)) {
            ipcRenderer.send('download-platform', platform);
        }
        else {
            console.warn(`Invalid platform requested: ${platform}`);
        }
    },
    /**
     * Request to open the settings window.
     * Sends an IPC message to the main process.
     */
    openSettings: () => {
        ipcRenderer.send('open-settings');
    },
    /**
     * Listen for messages from the main process.
     * (Example for future use: receiving download progress or updates)
     *
     * @param {string} channel - The channel to listen on.
     * @param {function} func - The callback function.
     */
    on: (channel, func) => {
        const validChannels = ['fromMain']; // Whitelist channels
        if (validChannels.includes(channel)) {
            // Strip event as it includes sender
            ipcRenderer.on(channel, (_event, ...args) => func(...args));
        }
    },
});
/**
 * Expose version information to the renderer process.
 * Useful for debugging and displaying app info.
 */
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    // Add application version if needed
    // app: () => process.env.npm_package_version,
});
//# sourceMappingURL=preload.js.map