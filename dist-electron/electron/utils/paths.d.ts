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
/**
 * Returns the path to the application's assets directory.
 *
 * In development, assets are in the project root.
 * In production, they're in the app's resources directory.
 *
 * @returns {string} Absolute path to assets directory
 */
export declare function getAssetsPath(): string;
/**
 * Returns the path to the electron directory.
 *
 * @returns {string} Absolute path to electron directory
 */
export declare function getElectronPath(): string;
/**
 * Returns the path to the preload script.
 *
 * @returns {string} Absolute path to preload script
 */
export declare function getPreloadPath(): string;
/**
 * Returns the path to the user data directory for application-specific data.
 *
 * @param {...string} segments - Additional path segments to append
 * @returns {string} Absolute path to the user data subdirectory
 */
export declare function getUserDataPath(...segments: string[]): string;
/**
 * Returns the path to the application log directory.
 *
 * @returns {string} Absolute path to logs directory
 */
export declare function getLogPath(): string;
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
export declare function getAppIconPath(): string;
/**
 * Checks if a file exists at the given path.
 *
 * @param {string} filePath - Path to check
 * @returns {boolean} True if the file exists
 */
export declare function fileExists(filePath: string): boolean;
/**
 * Ensures a directory exists, creating it recursively if needed.
 *
 * @param {string} dirPath - Directory path to ensure exists
 */
export declare function ensureDir(dirPath: string): void;
