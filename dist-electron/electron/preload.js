import { contextBridge, ipcRenderer } from 'electron';
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
function isValidAction(action) {
    return typeof action === 'string' && action.length > 0 && action.length < 256;
}
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
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send(channel, ...args) {
            if (VALID_SEND_CHANNELS.has(channel) && isSerializable(args)) {
                ipcRenderer.send(channel, ...args);
            }
            else {
                console.warn(`[Preload] Blocked send to channel: ${channel}`);
            }
        },
        invoke(channel, ...args) {
            if (VALID_INVOKE_CHANNELS.has(channel) && isSerializable(args)) {
                return ipcRenderer.invoke(channel, ...args);
            }
            console.warn(`[Preload] Blocked invoke on channel: ${channel}`);
            return Promise.reject(new Error(`Channel not allowed: ${channel}`));
        },
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
        once(channel, callback) {
            if (!VALID_RECEIVE_CHANNELS.has(channel)) {
                console.warn(`[Preload] Blocked once listener on channel: ${channel}`);
                return;
            }
            ipcRenderer.once(channel, (_event, ...args) => {
                callback(...args);
            });
        },
        removeAllListeners(channel) {
            if (VALID_RECEIVE_CHANNELS.has(channel)) {
                ipcRenderer.removeAllListeners(channel);
            }
        },
    },
    downloadPlatform: (platform) => {
        if (isValidAction(platform)) {
            ipcRenderer.send('download-platform', platform);
        }
    },
    openSettings: () => {
        ipcRenderer.send('open-settings');
    },
    openExternalLink: (url) => {
        if (isSafeURL(url)) {
            ipcRenderer.send('open-external-link', url);
        }
        else {
            console.warn('[Preload] Blocked unsafe URL:', url);
        }
    },
    copyToClipboard: (text) => {
        if (typeof text === 'string') {
            ipcRenderer.send('copy-to-clipboard', text);
        }
    },
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    writeFile: (data) => ipcRenderer.invoke('write-file', data),
    getSettings: () => ipcRenderer.invoke('settings:get-all'),
    getSetting: (key) => {
        if (!isValidAction(key))
            return Promise.reject(new Error('Invalid key'));
        return ipcRenderer.invoke('settings:get', key);
    },
    setSetting: (key, value) => {
        if (!isValidAction(key))
            return Promise.reject(new Error('Invalid key'));
        if (!isSerializable(value))
            return Promise.reject(new Error('Non-serializable value'));
        return ipcRenderer.invoke('settings:set', key, value);
    },
    resetSettings: () => ipcRenderer.invoke('settings:reset'),
    toggleLoginItem: (enabled) => ipcRenderer.invoke('settings:toggle-login-item', !!enabled),
    getLoginItemStatus: () => ipcRenderer.invoke('settings:get-login-item-status'),
    onSettingsChanged: (callback) => {
        const subscription = (_event, data) => {
            callback(data);
        };
        ipcRenderer.on('settings:changed', subscription);
        return () => {
            ipcRenderer.removeListener('settings:changed', subscription);
        };
    },
    shellOpenExternal: (url) => {
        if (!isSafeURL(url))
            return Promise.reject(new Error('Unsafe URL'));
        return ipcRenderer.invoke('shell:open-external', url);
    },
    dialogOpen: (options) => ipcRenderer.invoke('dialog:open', options),
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    onUpdaterStatus: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('updater:status', subscription);
        return () => {
            ipcRenderer.removeListener('updater:status', subscription);
        };
    },
    onUpdaterProgress: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('updater:progress', subscription);
        return () => {
            ipcRenderer.removeListener('updater:progress', subscription);
        };
    },
    onMainMessage: (callback) => {
        const subscription = (_event, data) => callback(data);
        ipcRenderer.on('fromMain', subscription);
        return () => {
            ipcRenderer.removeListener('fromMain', subscription);
        };
    },
    onDeepLink: (callback) => {
        const subscription = (_event, data) => {
            callback(data);
        };
        ipcRenderer.on('deep-link:navigate', subscription);
        return () => {
            ipcRenderer.removeListener('deep-link:navigate', subscription);
        };
    },
    onThemeChanged: (callback) => {
        const subscription = (_event, theme) => callback(theme);
        ipcRenderer.on('theme:changed', subscription);
        return () => {
            ipcRenderer.removeListener('theme:changed', subscription);
        };
    },
    relaunch: () => {
        ipcRenderer.send('app:relaunch');
    },
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    platform: process.platform,
    arch: process.arch,
});
contextBridge.exposeInMainWorld('versions', {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
});
console.info('[Preload] ZYNC preload script loaded');
console.info(`[Preload] Electron: ${process.versions.electron}`);
console.info(`[Preload] Node: ${process.versions.node}`);
console.info(`[Preload] Platform: ${process.platform} (${process.arch})`);
console.info(`[Preload] Context isolation: enabled`);
//# sourceMappingURL=preload.js.map