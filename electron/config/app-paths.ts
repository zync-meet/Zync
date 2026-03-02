import { app } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export interface AppPaths {

    userData: string;

    cache: string;

    temp: string;

    logs: string;

    downloads: string;

    desktop: string;

    documents: string;

    home: string;

    exe: string;

    appPath: string;

    crashDumps: string;

    assets: string;

    preload: string;

    settingsFile: string;

    windowStateFile: string;

    crashLogs: string;
}


export function resolveAppPaths(): AppPaths {
    const userData = app.getPath('userData');
    const appPath = app.getAppPath();

    return {
        userData,
        cache: (app.getPath('cache' as any) || path.join(userData, 'cache')),
        temp: app.getPath('temp'),
        logs: app.getPath('logs'),
        downloads: app.getPath('downloads'),
        desktop: app.getPath('desktop'),
        documents: app.getPath('documents'),
        home: app.getPath('home'),
        exe: app.getPath('exe'),
        appPath,
        crashDumps: app.getPath('crashDumps'),
        assets: path.join(appPath, 'electron', 'assets'),
        preload: path.join(__dirname, '..', 'preload.js'),
        settingsFile: path.join(userData, 'settings.json'),
        windowStateFile: path.join(userData, 'window-state.json'),
        crashLogs: path.join(userData, 'crash-logs'),
    };
}


export function getUserDataPath(): string {
    return app.getPath('userData');
}


export function getPreloadPath(): string {
    return path.join(__dirname, '..', 'preload.js');
}


export function getAssetsPath(subPath?: string): string {
    const assetsDir = path.join(app.getAppPath(), 'electron', 'assets');
    return subPath ? path.join(assetsDir, subPath) : assetsDir;
}


export function getIconPath(): string {
    const assetsDir = getAssetsPath();

    if (process.platform === 'win32') {
        return path.join(assetsDir, 'icon.ico');
    }
    if (process.platform === 'darwin') {
        return path.join(assetsDir, 'icon.icns');
    }
    return path.join(assetsDir, 'icon.png');
}


export function getTrayIconPath(): string {
    const assetsDir = getAssetsPath();

    if (process.platform === 'darwin') {
        return path.join(assetsDir, 'tray-icon-Template.png');
    }
    return path.join(assetsDir, 'tray-icon.png');
}


export function ensureUserDataSubdir(dirName: string): string {
    const dirPath = path.join(getUserDataPath(), dirName);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    return dirPath;
}


export function getCrashLogsPath(): string {
    return ensureUserDataSubdir('crash-logs');
}


export function getBackupsPath(): string {
    return ensureUserDataSubdir('backups');
}


export function getPluginsPath(): string {
    return ensureUserDataSubdir('plugins');
}


export function pathExists(filePath: string): boolean {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}


export function isWithinUserData(filePath: string): boolean {
    const resolved = path.resolve(filePath);
    const userDataResolved = path.resolve(getUserDataPath());
    return resolved.startsWith(userDataResolved + path.sep) || resolved === userDataResolved;
}
