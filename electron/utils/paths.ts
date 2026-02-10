/**
 * =============================================================================
 * Path Utilities — ZYNC Desktop Application
 * =============================================================================
 *
 * Utility functions for resolving and managing file paths across
 * development and production environments in the Electron app.
 *
 * @module electron/utils/paths
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Returns the path to the application's assets directory.
 *
 * In development, assets are in the project root.
 * In production, they're in the app's resources directory.
 *
 * @returns {string} Absolute path to assets directory
 */
export function getAssetsPath(): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'assets');
    }
    return path.join(__dirname, '..', 'assets');
}

/**
 * Returns the path to the electron directory.
 *
 * @returns {string} Absolute path to electron directory
 */
export function getElectronPath(): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'electron');
    }
    return path.join(__dirname, '..');
}

/**
 * Returns the path to the preload script.
 *
 * @returns {string} Absolute path to preload script
 */
export function getPreloadPath(): string {
    if (app.isPackaged) {
        return path.join(__dirname, 'preload.js');
    }
    return path.join(__dirname, '..', 'preload.ts');
}

/**
 * Returns the path to the user data directory for application-specific data.
 *
 * @param {...string} segments - Additional path segments to append
 * @returns {string} Absolute path to the user data subdirectory
 */
export function getUserDataPath(...segments: string[]): string {
    const userDataDir = path.join(app.getPath('userData'), ...segments);

    // Ensure the directory exists
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    return userDataDir;
}

/**
 * Returns the path to the application log directory.
 *
 * @returns {string} Absolute path to logs directory
 */
export function getLogPath(): string {
    return getUserDataPath('logs');
}

/**
 * Returns the path to the application icon.
 *
 * Selects the appropriate icon format based on the current platform:
 * - Windows: .ico
 * - macOS: .icns
 * - Linux: .png
 *
 * @returns {string} Absolute path to the application icon
 */
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

/**
 * Checks if a file exists at the given path.
 *
 * @param {string} filePath - Path to check
 * @returns {boolean} True if the file exists
 */
export function fileExists(filePath: string): boolean {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

/**
 * Ensures a directory exists, creating it recursively if needed.
 *
 * @param {string} dirPath - Directory path to ensure exists
 */
export function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
