import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';


export function getAssetsPath(): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'assets');
    }
    return path.join(__dirname, '..', 'assets');
}


export function getElectronPath(): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'electron');
    }
    return path.join(__dirname, '..');
}


export function getPreloadPath(): string {
    if (app.isPackaged) {
        return path.join(__dirname, 'preload.js');
    }
    return path.join(__dirname, '..', 'preload.ts');
}


export function getUserDataPath(...segments: string[]): string {
    const userDataDir = path.join(app.getPath('userData'), ...segments);


    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    return userDataDir;
}


export function getLogPath(): string {
    return getUserDataPath('logs');
}


export function getAppIconPath(): string {
    const assetsDir = getAssetsPath();
    const platform = process.platform;

    if (platform === 'win32') {
        return path.join(assetsDir, 'icon.ico');
    } else if (platform === 'darwin') {
        return path.join(assetsDir, 'icon.icns');
    }
    return path.join(assetsDir, 'icon.png');
}


export function fileExists(filePath: string): boolean {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}


export function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
