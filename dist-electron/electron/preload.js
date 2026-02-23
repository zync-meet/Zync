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
 * Security Model:
 * ─────────────────────────────────────────────────────────────────────────────
 * - Direct access to ipcRenderer is NEVER exposed to the renderer process
 * - All exposed functions perform argument validation before forwarding
 * - Only explicitly whitelisted IPC channels are accessible
 * - No raw Node.js APIs (fs, child_process, etc.) are exposed
 * - The contextBridge ensures renderer cannot prototype-pollute these objects
 *
 * API Surface:
 * ─────────────────────────────────────────────────────────────────────────────
 * window.electron   — Main API (navigation, window mgmt, file ops, settings)
 * window.versions   — Runtime version info (node, chrome, electron, app)
 *
 * @module electron/preload
 * @author ZYNC Team
 * @version 2.0.0
 * @license MIT
 * =============================================================================
 */
import { contextBridge, ipcRenderer } from 'electron';
// =============================================================================
// Constants — Whitelisted IPC Channels
// =============================================================================
/**
 * Channels the renderer is allowed to SEND messages to (fire-and-forget).
 * Any channel not in this list will be silently dropped.
 */
const VALID_SEND_CHANNELS = new Set([
    'download-platform',
    'open-settings',
    'open-external-link',
    'copy-to-clipboard',
    'minimize-window',
    'maximize-window',
    'close-window',
    'fromMain',
    'notification:show',
    'notification:clear',
    'app:relaunch',
]);
/**
 * Channels the renderer is allowed to INVOKE (request/response pattern).
 * Returns a Promise with the result from the main process.
 */
const VALID_INVOKE_CHANNELS = new Set([
    'get-app-version',
    'get-app-info',
    'get-system-theme',
    'is-window-maximized',
    'show-save-dialog',
    'show-open-dialog',
    'write-file',
    'settings:get-all',
    'settings:get',
    'settings:set',
    'settings:reset',
    'settings:toggle-login-item',
    'settings:get-login-item-status',
    'settings:import',
    'settings:export',
    'dialog:open',
    'shell:open-external',
    'updater:check',
    'updater:download',
    'updater:install',
    'screenshot:capture',
    'screenshot:save',
]);
/**
 * Channels the renderer is allowed to LISTEN for messages from the main process.
 */
const VALID_RECEIVE_CHANNELS = new Set([
    'fromMain',
    'splash:close',
    'splash:status',
    'settings:changed',
    'updater:status',
    'updater:progress',
    'notification:clicked',
    'deep-link:navigate',
    'theme:changed',
]);
// =============================================================================
// Validation Helpers
// =============================================================================
/**
 * Validates that an action name is a non-empty string.
 *
 * @param {string} action - The action name to validate
 * @returns {boolean} True if valid
 */
function isValidAction(action) {
    return typeof action === 'string' && action.length > 0 && action.length < 256;
}
/**
 * Validates that a URL string is safe to open externally.
 * Only allows http:// and https:// protocols.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if safe
 */
function isSafeURL(url) {
    if (typeof url !== 'string')
        return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
}
/**
 * Validates that a value is a plain serializable object (no functions, etc.).
 *
 * @param {unknown} value - The value to validate
 * @returns {boolean} True if the value is safe to send via IPC
 */
function isSerializable(value) {
    if (value === null || value === undefined)
        return true;
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean')
        return true;
    if (type === 'function' || type === 'symbol')
        return false;
    if (Array.isArray(value))
        return value.every(isSerializable);
    if (type === 'object') {
        return Object.values(value).every(isSerializable);
    }
    return false;
}
// =============================================================================
// Exposed API — window.electron
// =============================================================================
/**
 * Safely expose Electron APIs to the renderer process via contextBridge.
 *
 * This object is accessible as `window.electron` in the renderer.
 * Each method either sends a message or invokes a handler in the main process.
 */
contextBridge.exposeInMainWorld('electron', {
    // =========================================================================
    // IPC Primitives (controlled access)
    // =========================================================================
    /**
     * Typed wrapper around ipcRenderer for advanced use cases.
     * All channels are validated against whitelists.
     */
    ipcRenderer: {
        /**
         * Send a fire-and-forget message to the main process.
         *
         * @param {string} channel - Whitelisted channel name
         * @param {...unknown[]} args - Arguments to send
         */
        send(channel, ...args) {
            if (VALID_SEND_CHANNELS.has(channel) && isSerializable(args)) {
                ipcRenderer.send(channel, ...args);
            }
            else {
                console.warn(`[Preload] Blocked send to channel: ${channel}`);
            }
        },
        /**
         * Send a request and wait for a response from the main process.
         *
         * @param {string} channel - Whitelisted channel name
         * @param {...unknown[]} args - Arguments to send
         * @returns {Promise<unknown>} The response from the main process
         */
        invoke(channel, ...args) {
            if (VALID_INVOKE_CHANNELS.has(channel) && isSerializable(args)) {
                return ipcRenderer.invoke(channel, ...args);
            }
            console.warn(`[Preload] Blocked invoke on channel: ${channel}`);
            return Promise.reject(new Error(`Channel not allowed: ${channel}`));
        },
        /**
         * Listen for messages from the main process.
         *
         * @param {string} channel - Whitelisted channel name
         * @param {Function} callback - Handler function
         * @returns {Function} Cleanup function to remove the listener
         */
        on(channel, callback) {
            if (!VALID_RECEIVE_CHANNELS.has(channel)) {
                console.warn(`[Preload] Blocked listener on channel: ${channel}`);
                return () => { };
            }
            const subscription = (_event, ...args) => {
                callback(...args);
            };
            ipcRenderer.on(channel, subscription);
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        /**
         * Listen for a single message from the main process.
         *
         * @param {string} channel - Whitelisted channel name
         * @param {Function} callback - Handler function
         */
        once(channel, callback) {
            if (!VALID_RECEIVE_CHANNELS.has(channel)) {
                console.warn(`[Preload] Blocked once listener on channel: ${channel}`);
                return;
            }
            ipcRenderer.once(channel, (_event, ...args) => {
                callback(...args);
            });
        },
        /**
         * Remove all listeners for a channel.
         *
         * @param {string} channel - Channel name
         */
        removeAllListeners(channel) {
            if (VALID_RECEIVE_CHANNELS.has(channel)) {
                ipcRenderer.removeAllListeners(channel);
            }
        },
    },
    // =========================================================================
    // Navigation & Platform
    // =========================================================================
    /**
     * Trigger a platform-specific download from the website.
     *
     * @param {string} platform - Platform identifier (e.g., 'windows', 'mac', 'linux')
     */
    downloadPlatform: (platform) => {
        if (isValidAction(platform)) {
            ipcRenderer.send('download-platform', platform);
        }
    },
    /**
     * Open the settings window.
     */
    openSettings: () => {
        ipcRenderer.send('open-settings');
    },
    /**
     * Open a URL in the system's default browser.
     * Only http:// and https:// URLs are permitted.
     *
     * @param {string} url - The URL to open
     */
    openExternalLink: (url) => {
        if (isSafeURL(url)) {
            ipcRenderer.send('open-external-link', url);
        }
        else {
            console.warn('[Preload] Blocked unsafe URL:', url);
        }
    },
    /**
     * Copy text to the system clipboard.
     *
     * @param {string} text - Text to copy
     */
    copyToClipboard: (text) => {
        if (typeof text === 'string') {
            ipcRenderer.send('copy-to-clipboard', text);
        }
    },
    // =========================================================================
    // App & System Info
    // =========================================================================
    /**
     * Get the application version string.
     *
     * @returns {Promise<string>} Application version (e.g., "1.0.0")
     */
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    /**
     * Get detailed application information (version, paths, environment).
     *
     * @returns {Promise<Record<string, unknown>>} Application info object
     */
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    /**
     * Get the system's current theme preference.
     *
     * @returns {Promise<'dark' | 'light'>} Theme preference
     */
    getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
    // =========================================================================
    // Window Management
    // =========================================================================
    /**
     * Minimize the current window.
     */
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    /**
     * Toggle maximize/restore for the current window.
     */
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    /**
     * Close the current window.
     */
    closeWindow: () => ipcRenderer.send('close-window'),
    /**
     * Check if the current window is maximized.
     *
     * @returns {Promise<boolean>} True if maximized
     */
    isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
    // =========================================================================
    // File System Operations
    // =========================================================================
    /**
     * Show a native save dialog.
     *
     * @param {Electron.SaveDialogOptions} options - Dialog options
     * @returns {Promise<string | null>} Selected file path, or null if cancelled
     */
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    /**
     * Show a native open dialog.
     *
     * @param {Electron.OpenDialogOptions} options - Dialog options
     * @returns {Promise<string[]>} Selected file paths
     */
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    /**
     * Write data to a file on disk.
     *
     * @param {object} data - Object containing filePath and content
     * @returns {Promise<{ success: boolean; error?: string }>} Result
     */
    writeFile: (data) => ipcRenderer.invoke('write-file', data),
    // =========================================================================
    // Settings
    // =========================================================================
    /**
     * Get all settings as a single object.
     *
     * @returns {Promise<Record<string, unknown>>} All settings
     */
    getSettings: () => ipcRenderer.invoke('settings:get-all'),
    /**
     * Get a single setting value by key.
     *
     * @param {string} key - Setting key
     * @returns {Promise<unknown>} Setting value
     */
    getSetting: (key) => {
        if (!isValidAction(key))
            return Promise.reject(new Error('Invalid key'));
        return ipcRenderer.invoke('settings:get', key);
    },
    /**
     * Set a single setting value.
     *
     * @param {string} key - Setting key
     * @param {unknown} value - New value
     * @returns {Promise<void>}
     */
    setSetting: (key, value) => {
        if (!isValidAction(key))
            return Promise.reject(new Error('Invalid key'));
        if (!isSerializable(value))
            return Promise.reject(new Error('Non-serializable value'));
        return ipcRenderer.invoke('settings:set', key, value);
    },
    /**
     * Reset all settings to defaults.
     *
     * @returns {Promise<void>}
     */
    resetSettings: () => ipcRenderer.invoke('settings:reset'),
    /**
     * Toggle the "Start on Login" setting.
     *
     * @param {boolean} enabled - Whether to enable/disable start on login
     * @returns {Promise<void>}
     */
    toggleLoginItem: (enabled) => ipcRenderer.invoke('settings:toggle-login-item', !!enabled),
    /**
     * Get the current login item (start on boot) status.
     *
     * @returns {Promise<boolean>} True if enabled
     */
    getLoginItemStatus: () => ipcRenderer.invoke('settings:get-login-item-status'),
    /**
     * Listen for settings changes from the main process.
     *
     * @param {Function} callback - Handler receiving { key, value, oldValue }
     * @returns {Function} Cleanup function
     */
    onSettingsChanged: (callback) => {
        const subscription = (_event, data) => {
            callback(data);
        };
        ipcRenderer.on('settings:changed', subscription);
        return () => {
            ipcRenderer.removeListener('settings:changed', subscription);
        };
    },
    // =========================================================================
    // Shell
    // =========================================================================
    /**
     * Open a URL or file path with the system's default application.
     * Validated to only allow http/https URLs.
     *
     * @param {string} url - URL or path to open
     * @returns {Promise<void>}
     */
    shellOpenExternal: (url) => {
        if (!isSafeURL(url))
            return Promise.reject(new Error('Unsafe URL'));
        return ipcRenderer.invoke('shell:open-external', url);
    },
    // =========================================================================
    // Dialog
    // =========================================================================
    /**
     * Show a native open dialog (useful from settings window).
     *
     * @param {object} options - Electron OpenDialogOptions
     * @returns {Promise<{ canceled: boolean; filePaths: string[] }>}
     */
    dialogOpen: (options) => ipcRenderer.invoke('dialog:open', options),
    // =========================================================================
    // Auto-Updater
    // =========================================================================
    /**
     * Check for application updates.
     *
     * @returns {Promise<{ updateAvailable: boolean }>}
     */
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    /**
     * Listen for updater status messages from the main process.
     *
     * @param {Function} callback - Handler function
     * @returns {Function} Cleanup function
     */
    onUpdaterStatus: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('updater:status', subscription);
        return () => {
            ipcRenderer.removeListener('updater:status', subscription);
        };
    },
    /**
     * Listen for download progress during an update.
     *
     * @param {Function} callback - Handler receiving progress info
     * @returns {Function} Cleanup function
     */
    onUpdaterProgress: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('updater:progress', subscription);
        return () => {
            ipcRenderer.removeListener('updater:progress', subscription);
        };
    },
    // =========================================================================
    // Events from Main Process (generic)
    // =========================================================================
    /**
     * Listen for generic messages from the main process.
     *
     * @param {Function} callback - Handler function
     * @returns {Function} Cleanup function to remove the listener
     */
    onMainMessage: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('fromMain', subscription);
        return () => {
            ipcRenderer.removeListener('fromMain', subscription);
        };
    },
    /**
     * Listen for deep link navigation events.
     *
     * @param {Function} callback - Handler receiving the parsed deep link path
     * @returns {Function} Cleanup function
     */
    onDeepLink: (callback) => {
        const subscription = (_event, data) => {
            callback(data);
        };
        ipcRenderer.on('deep-link:navigate', subscription);
        return () => {
            ipcRenderer.removeListener('deep-link:navigate', subscription);
        };
    },
    /**
     * Listen for system theme changes.
     *
     * @param {Function} callback - Handler receiving 'dark' or 'light'
     * @returns {Function} Cleanup function
     */
    onThemeChanged: (callback) => {
        const subscription = (_event, theme) => callback(theme);
        ipcRenderer.on('theme:changed', subscription);
        return () => {
            ipcRenderer.removeListener('theme:changed', subscription);
        };
    },
    // =========================================================================
    // App Control
    // =========================================================================
    /**
     * Relaunch the application.
     */
    relaunch: () => {
        ipcRenderer.send('app:relaunch');
    },
    // =========================================================================
    // Environment Info
    // =========================================================================
    /** Electron version string */
    electronVersion: process.versions.electron,
    /** Node.js version string */
    nodeVersion: process.versions.node,
    /** Chromium version string */
    chromeVersion: process.versions.chrome,
    /** Operating system platform */
    platform: process.platform,
    /** CPU architecture */
    arch: process.arch,
});
// =============================================================================
// Exposed API — window.versions
// =============================================================================
/**
 * Expose runtime version information for backward compatibility and
 * simple version checks from the renderer.
 */
contextBridge.exposeInMainWorld('versions', {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
});
// =============================================================================
// Diagnostic logging
// =============================================================================
console.info('[Preload] ZYNC preload script loaded');
console.info(`[Preload] Electron: ${process.versions.electron}`);
console.info(`[Preload] Node: ${process.versions.node}`);
console.info(`[Preload] Platform: ${process.platform} (${process.arch})`);
console.info(`[Preload] Context isolation: enabled`);
//# sourceMappingURL=preload.js.map