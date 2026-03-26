import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';


const VALID_SEND_CHANNELS: ReadonlySet<string> = new Set([
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


const VALID_INVOKE_CHANNELS: ReadonlySet<string> = new Set([
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


const VALID_RECEIVE_CHANNELS: ReadonlySet<string> = new Set([
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


function isValidAction(action: string): boolean {
    return typeof action === 'string' && action.length > 0 && action.length < 256;
}


function isSafeURL(url: string): boolean {
    if (typeof url !== 'string') {return false;}
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}


function isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) {return true;}
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {return true;}
    if (type === 'function' || type === 'symbol') {return false;}
    if (Array.isArray(value)) {return value.every(isSerializable);}
    if (type === 'object') {
        return Object.values(value as Record<string, unknown>).every(isSerializable);
    }
    return false;
}


contextBridge.exposeInMainWorld('electron', {


    ipcRenderer: {

        send(channel: string, ...args: unknown[]): void {
            if (VALID_SEND_CHANNELS.has(channel) && isSerializable(args)) {
                ipcRenderer.send(channel, ...args);
            } else {
                console.warn(`[Preload] Blocked send to channel: ${channel}`);
            }
        },


        invoke(channel: string, ...args: unknown[]): Promise<unknown> {
            if (VALID_INVOKE_CHANNELS.has(channel) && isSerializable(args)) {
                return ipcRenderer.invoke(channel, ...args);
            }
            console.warn(`[Preload] Blocked invoke on channel: ${channel}`);
            return Promise.reject(new Error(`Channel not allowed: ${channel}`));
        },


        on(channel: string, callback: (...args: unknown[]) => void): () => void {
            if (!VALID_RECEIVE_CHANNELS.has(channel)) {
                console.warn(`[Preload] Blocked listener on channel: ${channel}`);
                return () => {};
            }
            const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => {
                callback(...args);
            };
            ipcRenderer.on(channel, subscription);
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },


        once(channel: string, callback: (...args: unknown[]) => void): void {
            if (!VALID_RECEIVE_CHANNELS.has(channel)) {
                console.warn(`[Preload] Blocked once listener on channel: ${channel}`);
                return;
            }
            ipcRenderer.once(channel, (_event: IpcRendererEvent, ...args: unknown[]) => {
                callback(...args);
            });
        },


        removeAllListeners(channel: string): void {
            if (VALID_RECEIVE_CHANNELS.has(channel)) {
                ipcRenderer.removeAllListeners(channel);
            }
        },
    },


    downloadPlatform: (platform: string): void => {
        if (isValidAction(platform)) {
            ipcRenderer.send('download-platform', platform);
        }
    },


    openSettings: (): void => {
        ipcRenderer.send('open-settings');
    },


    openExternalLink: (url: string): void => {
        if (isSafeURL(url)) {
            ipcRenderer.send('open-external-link', url);
        } else {
            console.warn('[Preload] Blocked unsafe URL:', url);
        }
    },


    copyToClipboard: (text: string): void => {
        if (typeof text === 'string') {
            ipcRenderer.send('copy-to-clipboard', text);
        }
    },


    getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),


    getAppInfo: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('get-app-info'),


    getSystemTheme: (): Promise<string> => ipcRenderer.invoke('get-system-theme'),


    minimizeWindow: (): void => ipcRenderer.send('minimize-window'),


    maximizeWindow: (): void => ipcRenderer.send('maximize-window'),


    closeWindow: (): void => ipcRenderer.send('close-window'),


    isWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke('is-window-maximized'),


    showSaveDialog: (options: Record<string, unknown>): Promise<string | null> =>
        ipcRenderer.invoke('show-save-dialog', options),


    showOpenDialog: (options: Record<string, unknown>): Promise<string[]> =>
        ipcRenderer.invoke('show-open-dialog', options),


    writeFile: (data: Record<string, unknown>): Promise<Record<string, unknown>> =>
        ipcRenderer.invoke('write-file', data),


    getSettings: (): Promise<Record<string, unknown>> =>
        ipcRenderer.invoke('settings:get-all'),


    getSetting: (key: string): Promise<unknown> => {
        if (!isValidAction(key)) {return Promise.reject(new Error('Invalid key'));}
        return ipcRenderer.invoke('settings:get', key);
    },


    setSetting: (key: string, value: unknown): Promise<void> => {
        if (!isValidAction(key)) {return Promise.reject(new Error('Invalid key'));}
        if (!isSerializable(value)) {return Promise.reject(new Error('Non-serializable value'));}
        return ipcRenderer.invoke('settings:set', key, value);
    },


    resetSettings: (): Promise<void> => ipcRenderer.invoke('settings:reset'),


    toggleLoginItem: (enabled: boolean): Promise<void> =>
        ipcRenderer.invoke('settings:toggle-login-item', !!enabled),


    getLoginItemStatus: (): Promise<boolean> =>
        ipcRenderer.invoke('settings:get-login-item-status'),


    onSettingsChanged: (callback: (data: { key: string; value: unknown; oldValue: unknown }) => void): (() => void) => {
        const subscription = (_event: IpcRendererEvent, data: { key: string; value: unknown; oldValue: unknown }) => {
            callback(data);
        };
        ipcRenderer.on('settings:changed', subscription);
        return () => {
            ipcRenderer.removeListener('settings:changed', subscription);
        };
    },


    shellOpenExternal: (url: string): Promise<void> => {
        if (!isSafeURL(url)) {return Promise.reject(new Error('Unsafe URL'));}
        return ipcRenderer.invoke('shell:open-external', url);
    },


    dialogOpen: (options: Record<string, unknown>): Promise<{ canceled: boolean; filePaths: string[] }> =>
        ipcRenderer.invoke('dialog:open', options),


    checkForUpdates: (): Promise<{ updateAvailable: boolean }> =>
        ipcRenderer.invoke('updater:check'),


    onUpdaterStatus: (callback: (data: unknown) => void): (() => void) => {
        const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data);
        ipcRenderer.on('updater:status', subscription);
        return () => {
            ipcRenderer.removeListener('updater:status', subscription);
        };
    },


    onUpdaterProgress: (callback: (data: unknown) => void): (() => void) => {
        const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data);
        ipcRenderer.on('updater:progress', subscription);
        return () => {
            ipcRenderer.removeListener('updater:progress', subscription);
        };
    },


    onMainMessage: (callback: (data: unknown) => void): (() => void) => {
        const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data);
        ipcRenderer.on('fromMain', subscription);

        return () => {
            ipcRenderer.removeListener('fromMain', subscription);
        };
    },


    onDeepLink: (callback: (data: { type: string; path: string; params: Record<string, string> }) => void): (() => void) => {
        const subscription = (_event: IpcRendererEvent, data: { type: string; path: string; params: Record<string, string> }) => {
            callback(data);
        };
        ipcRenderer.on('deep-link:navigate', subscription);
        return () => {
            ipcRenderer.removeListener('deep-link:navigate', subscription);
        };
    },


    onThemeChanged: (callback: (theme: string) => void): (() => void) => {
        const subscription = (_event: IpcRendererEvent, theme: string) => callback(theme);
        ipcRenderer.on('theme:changed', subscription);
        return () => {
            ipcRenderer.removeListener('theme:changed', subscription);
        };
    },


    relaunch: (): void => {
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
