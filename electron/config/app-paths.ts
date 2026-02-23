/**
 * =============================================================================
 * Application Paths Configuration — ZYNC Desktop
 * =============================================================================
 *
 * Centralized path resolution for all application directories. Provides
 * consistent access to user data, cache, temp, and asset paths across
 * all modules.
 *
 * @module electron/config/app-paths
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { app } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// =============================================================================
// ESM __dirname Resolution
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Types
// =============================================================================

/** All application paths */
export interface AppPaths {
    /** User data directory (settings, databases) */
    userData: string;
    /** Application cache directory */
    cache: string;
    /** Temporary files directory */
    temp: string;
    /** Log files directory */
    logs: string;
    /** Downloads directory */
    downloads: string;
    /** Desktop directory */
    desktop: string;
    /** Documents directory */
    documents: string;
    /** Home directory */
    home: string;
    /** App executable path */
    exe: string;
    /** App installation directory */
    appPath: string;
    /** Crash dumps directory */
    crashDumps: string;
    /** Assets directory (icons, images) */
    assets: string;
    /** Preload script path */
    preload: string;
    /** Settings file path */
    settingsFile: string;
    /** Window state file path */
    windowStateFile: string;
    /** Crash log directory */
    crashLogs: string;
}

// =============================================================================
// Path Resolution
// =============================================================================

/**
 * Resolve all application paths.
 *
 * @returns {AppPaths} All resolved paths
 */
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

// =============================================================================
// Specific Path Getters
// =============================================================================

/**
 * Get the user data directory.
 *
 * @returns {string} User data path
 */
export function getUserDataPath(): string {
    return app.getPath('userData');
}

/**
 * Get the preload script path.
 *
 * @returns {string} Preload script path
 */
export function getPreloadPath(): string {
    return path.join(__dirname, '..', 'preload.js');
}

/**
 * Get the assets directory path.
 *
 * @param {string} [subPath] - Optional sub-path within assets
 * @returns {string} Assets directory path
 */
export function getAssetsPath(subPath?: string): string {
    const assetsDir = path.join(app.getAppPath(), 'electron', 'assets');
    return subPath ? path.join(assetsDir, subPath) : assetsDir;
}

/**
 * Get the icon path for the current platform.
 *
 * @returns {string} Icon file path
 */
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

/**
 * Get the tray icon path (typically smaller than the app icon).
 *
 * @returns {string} Tray icon file path
 */
export function getTrayIconPath(): string {
    const assetsDir = getAssetsPath();

    if (process.platform === 'darwin') {
        return path.join(assetsDir, 'tray-icon-Template.png');
    }
    return path.join(assetsDir, 'tray-icon.png');
}

/**
 * Get or create a subdirectory in user data.
 *
 * @param {string} dirName - Directory name
 * @returns {string} Full directory path (created if it doesn't exist)
 */
export function ensureUserDataSubdir(dirName: string): string {
    const dirPath = path.join(getUserDataPath(), dirName);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    return dirPath;
}

/**
 * Get or create the crash logs directory.
 *
 * @returns {string} Crash logs directory path
 */
export function getCrashLogsPath(): string {
    return ensureUserDataSubdir('crash-logs');
}

/**
 * Get or create the backups directory.
 *
 * @returns {string} Backups directory path
 */
export function getBackupsPath(): string {
    return ensureUserDataSubdir('backups');
}

/**
 * Get or create the plugins directory.
 *
 * @returns {string} Plugins directory path
 */
export function getPluginsPath(): string {
    return ensureUserDataSubdir('plugins');
}

// =============================================================================
// Path Validation
// =============================================================================

/**
 * Check if a path exists and is accessible.
 *
 * @param {string} filePath - Path to check
 * @returns {boolean} True if exists
 */
export function pathExists(filePath: string): boolean {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if a path is within the user data directory (safe sandbox check).
 *
 * @param {string} filePath - Path to validate
 * @returns {boolean} True if within user data
 */
export function isWithinUserData(filePath: string): boolean {
    const resolved = path.resolve(filePath);
    const userDataResolved = path.resolve(getUserDataPath());
    return resolved.startsWith(userDataResolved + path.sep) || resolved === userDataResolved;
}
