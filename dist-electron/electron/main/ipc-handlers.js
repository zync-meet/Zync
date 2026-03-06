import { ipcMain, app, shell, dialog, clipboard, nativeTheme, } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
const VALID_PLATFORMS = ['win', 'mac', 'linux'];
const DOWNLOAD_URLS = {
    win: 'https://github.com/ChitkulLakshya/Zync/releases/latest/download/ZYNC-Setup.exe',
    mac: 'https://github.com/ChitkulLakshya/Zync/releases/latest/download/ZYNC.dmg',
    linux: 'https://github.com/ChitkulLakshya/Zync/releases/latest/download/ZYNC.AppImage',
};
function isValidPlatform(platform) {
    return VALID_PLATFORMS.includes(platform);
}
export function registerIpcHandlers(mainWindow, settingsWindow) {
    ipcMain.on('download-platform', (_event, platform) => {
        if (!isValidPlatform(platform)) {
            console.warn(`[IPC] Invalid platform requested: ${platform}`);
            return;
        }
        const downloadUrl = DOWNLOAD_URLS[platform];
        console.info(`[IPC] Opening download URL for platform: ${platform}`);
        shell.openExternal(downloadUrl).catch((error) => {
            console.error(`[IPC] Failed to open download URL: ${error.message}`);
        });
    });
    ipcMain.on('open-settings', () => {
        console.info('[IPC] Settings window requested');
        if (settingsWindow && !settingsWindow.isDestroyed()) {
            settingsWindow.focus();
        }
        else {
            mainWindow.webContents.send('fromMain', { action: 'create-settings-window' });
        }
    });
    ipcMain.handle('get-app-info', async () => {
        const appInfo = {
            version: app.getVersion(),
            name: app.getName(),
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome,
            nodeVersion: process.versions.node,
            v8Version: process.versions.v8,
            platform: process.platform,
            arch: process.arch,
            userDataPath: app.getPath('userData'),
        };
        return appInfo;
    });
    ipcMain.handle('get-app-version', async () => {
        return app.getVersion();
    });
    ipcMain.on('open-external-link', (_event, url) => {
        if (typeof url !== 'string') {
            console.warn('[IPC] open-external-link: Invalid URL type');
            return;
        }
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                console.warn(`[IPC] Rejected non-HTTP URL: ${url}`);
                return;
            }
        }
        catch {
            console.warn(`[IPC] Invalid URL format: ${url}`);
            return;
        }
        shell.openExternal(url).catch((error) => {
            console.error(`[IPC] Failed to open external link: ${error.message}`);
        });
    });
    ipcMain.handle('get-system-theme', async () => {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });
    ipcMain.on('copy-to-clipboard', (_event, text) => {
        if (typeof text === 'string') {
            clipboard.writeText(text);
        }
    });
    ipcMain.on('minimize-window', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.minimize();
        }
    });
    ipcMain.on('maximize-window', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            }
            else {
                mainWindow.maximize();
            }
        }
    });
    ipcMain.on('close-window', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.close();
        }
    });
    ipcMain.handle('is-window-maximized', async () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            return mainWindow.isMaximized();
        }
        return false;
    });
    ipcMain.handle('show-save-dialog', async (_event, options) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: options.title || 'Save File',
            defaultPath: options.defaultPath || app.getPath('documents'),
            filters: options.filters || [
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        if (result.canceled || !result.filePath) {
            return null;
        }
        return result.filePath;
    });
    ipcMain.handle('show-open-dialog', async (_event, options) => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: options.title || 'Open File',
            defaultPath: options.defaultPath || app.getPath('documents'),
            filters: options.filters || [
                { name: 'All Files', extensions: ['*'] },
            ],
            properties: options.properties || ['openFile'],
        });
        if (result.canceled) {
            return [];
        }
        return result.filePaths;
    });
    ipcMain.handle('write-file', async (_event, data) => {
        try {
            if (!data.filePath || typeof data.filePath !== 'string') {
                return { success: false, error: 'Invalid file path' };
            }
            if (typeof data.content !== 'string') {
                return { success: false, error: 'Invalid content' };
            }
            const resolvedPath = path.resolve(data.filePath);
            const allowedPaths = [
                app.getPath('userData'),
                app.getPath('documents'),
                app.getPath('downloads'),
                app.getPath('desktop'),
            ];
            const isAllowed = allowedPaths.some((allowedPath) => resolvedPath.startsWith(allowedPath));
            if (!isAllowed) {
                return {
                    success: false,
                    error: 'File path is outside of allowed directories',
                };
            }
            const dir = path.dirname(resolvedPath);
            await fs.promises.mkdir(dir, { recursive: true });
            await fs.promises.writeFile(resolvedPath, data.content, data.encoding || 'utf-8');
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[IPC] Failed to write file: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    });
    console.info('[IPC] All IPC handlers registered successfully');
    console.info(`[IPC] Registered channels: download-platform, open-settings, ` +
        `get-app-info, get-app-version, open-external-link, get-system-theme, ` +
        `copy-to-clipboard, minimize-window, maximize-window, close-window, ` +
        `is-window-maximized, show-save-dialog, show-open-dialog, write-file`);
}
export function removeIpcHandlers() {
    const channels = [
        'download-platform',
        'open-settings',
        'open-external-link',
        'copy-to-clipboard',
        'minimize-window',
        'maximize-window',
        'close-window',
    ];
    const handleChannels = [
        'get-app-info',
        'get-app-version',
        'get-system-theme',
        'is-window-maximized',
        'show-save-dialog',
        'show-open-dialog',
        'write-file',
    ];
    channels.forEach((channel) => ipcMain.removeAllListeners(channel));
    handleChannels.forEach((channel) => ipcMain.removeHandler(channel));
    console.info('[IPC] All IPC handlers removed');
}
//# sourceMappingURL=ipc-handlers.js.map