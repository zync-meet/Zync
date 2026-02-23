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
/**
 * Resolve all application paths.
 *
 * @returns {AppPaths} All resolved paths
 */
export declare function resolveAppPaths(): AppPaths;
/**
 * Get the user data directory.
 *
 * @returns {string} User data path
 */
export declare function getUserDataPath(): string;
/**
 * Get the preload script path.
 *
 * @returns {string} Preload script path
 */
export declare function getPreloadPath(): string;
/**
 * Get the assets directory path.
 *
 * @param {string} [subPath] - Optional sub-path within assets
 * @returns {string} Assets directory path
 */
export declare function getAssetsPath(subPath?: string): string;
/**
 * Get the icon path for the current platform.
 *
 * @returns {string} Icon file path
 */
export declare function getIconPath(): string;
/**
 * Get the tray icon path (typically smaller than the app icon).
 *
 * @returns {string} Tray icon file path
 */
export declare function getTrayIconPath(): string;
/**
 * Get or create a subdirectory in user data.
 *
 * @param {string} dirName - Directory name
 * @returns {string} Full directory path (created if it doesn't exist)
 */
export declare function ensureUserDataSubdir(dirName: string): string;
/**
 * Get or create the crash logs directory.
 *
 * @returns {string} Crash logs directory path
 */
export declare function getCrashLogsPath(): string;
/**
 * Get or create the backups directory.
 *
 * @returns {string} Backups directory path
 */
export declare function getBackupsPath(): string;
/**
 * Get or create the plugins directory.
 *
 * @returns {string} Plugins directory path
 */
export declare function getPluginsPath(): string;
/**
 * Check if a path exists and is accessible.
 *
 * @param {string} filePath - Path to check
 * @returns {boolean} True if exists
 */
export declare function pathExists(filePath: string): boolean;
/**
 * Check if a path is within the user data directory (safe sandbox check).
 *
 * @param {string} filePath - Path to validate
 * @returns {boolean} True if within user data
 */
export declare function isWithinUserData(filePath: string): boolean;
