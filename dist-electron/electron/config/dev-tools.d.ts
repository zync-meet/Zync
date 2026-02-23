/**
 * =============================================================================
 * DevTools Configuration — ZYNC Desktop
 * =============================================================================
 *
 * Configures Chrome DevTools features, extensions, and debugging behavior
 * for development mode. Disabled in production builds for security.
 *
 * @module electron/config/dev-tools
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow } from 'electron';
/** DevTools configuration options */
export interface DevToolsConfig {
    /** Open DevTools automatically on window creation */
    autoOpen: boolean;
    /** DevTools opening mode */
    mode: 'right' | 'bottom' | 'undocked' | 'detach';
    /** Enable React DevTools extension */
    reactDevTools: boolean;
    /** Enable Redux DevTools extension */
    reduxDevTools: boolean;
    /** Enable source map support */
    sourceMaps: boolean;
    /** Show frame rate counter overlay */
    showFPS: boolean;
    /** Enable paint flashing visualization */
    paintFlashing: boolean;
    /** Log IPC messages to console */
    logIPC: boolean;
}
/** Default DevTools configuration */
export declare const DEFAULT_DEV_TOOLS_CONFIG: DevToolsConfig;
/**
 * Apply DevTools configuration to a browser window.
 * Does nothing in production mode.
 *
 * @param {BrowserWindow} window - The window to configure
 * @param {Partial<DevToolsConfig>} [options] - Configuration overrides
 */
export declare function configureDevTools(window: BrowserWindow, options?: Partial<DevToolsConfig>): void;
/**
 * Install React DevTools extension for development.
 *
 * Attempts to load the React DevTools Chrome extension. Falls back
 * gracefully if the extension is not installed.
 *
 * @returns {Promise<boolean>} True if successfully installed
 */
export declare function installReactDevTools(): Promise<boolean>;
/**
 * Open DevTools for a specific window.
 *
 * @param {BrowserWindow} window - Target window
 * @param {DevToolsConfig['mode']} [mode='right'] - DevTools position
 */
export declare function openDevTools(window: BrowserWindow, mode?: DevToolsConfig['mode']): void;
/**
 * Close DevTools for a specific window.
 *
 * @param {BrowserWindow} window - Target window
 */
export declare function closeDevTools(window: BrowserWindow): void;
/**
 * Toggle DevTools for a specific window.
 *
 * @param {BrowserWindow} window - Target window
 */
export declare function toggleDevTools(window: BrowserWindow): void;
/**
 * Check if DevTools is open for a window.
 *
 * @param {BrowserWindow} window - Target window
 * @returns {boolean} True if open
 */
export declare function isDevToolsOpen(window: BrowserWindow): boolean;
/**
 * Log all registered IPC handlers (useful for debugging).
 */
export declare function logRegisteredHandlers(): void;
/**
 * Enable verbose content-security-policy violation logging.
 *
 * @param {BrowserWindow} window - Target window
 */
export declare function enableCSPLogging(window: BrowserWindow): void;
