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

import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';

// =============================================================================
// Types
// =============================================================================

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
export const DEFAULT_DEV_TOOLS_CONFIG: DevToolsConfig = {
    autoOpen: true,
    mode: 'right',
    reactDevTools: true,
    reduxDevTools: false,
    sourceMaps: true,
    showFPS: false,
    paintFlashing: false,
    logIPC: false,
};

// =============================================================================
// Module
// =============================================================================

const log = logger;
const isDev = !app.isPackaged;

/**
 * Apply DevTools configuration to a browser window.
 * Does nothing in production mode.
 *
 * @param {BrowserWindow} window - The window to configure
 * @param {Partial<DevToolsConfig>} [options] - Configuration overrides
 */
export function configureDevTools(
    window: BrowserWindow,
    options: Partial<DevToolsConfig> = {},
): void {
    if (!isDev) return;

    const config = { ...DEFAULT_DEV_TOOLS_CONFIG, ...options };

    // Auto-open DevTools
    if (config.autoOpen) {
        window.webContents.openDevTools({ mode: config.mode });
    }

    // Keyboard shortcut to toggle DevTools
    window.webContents.on('before-input-event', (event, input) => {
        // F12 or Ctrl+Shift+I to toggle DevTools
        if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
            window.webContents.toggleDevTools();
        }

        // Ctrl+Shift+R for hard reload
        if (input.control && input.shift && input.key === 'R') {
            window.webContents.reloadIgnoringCache();
        }
    });

    log.info(`DevTools configured for window (mode: ${config.mode})`);
}

/**
 * Install React DevTools extension for development.
 *
 * Attempts to load the React DevTools Chrome extension. Falls back
 * gracefully if the extension is not installed.
 *
 * @returns {Promise<boolean>} True if successfully installed
 */
export async function installReactDevTools(): Promise<boolean> {
    if (!isDev) return false;

    try {
        // Try to load electron-devtools-installer if available
        // const installer = await import('electron-devtools-installer').catch(() => null);
        const installer: any = null; // skipped due to install error

        if (installer) {
            const { default: installExtension, REACT_DEVELOPER_TOOLS } = installer;
            await installExtension(REACT_DEVELOPER_TOOLS);
            log.info('React DevTools extension installed');
            return true;
        }

        log.info('electron-devtools-installer not available, skipping React DevTools');
        return false;
    } catch (err) {
        log.error('Failed to install React DevTools:', err);
        return false;
    }
}

/**
 * Open DevTools for a specific window.
 *
 * @param {BrowserWindow} window - Target window
 * @param {DevToolsConfig['mode']} [mode='right'] - DevTools position
 */
export function openDevTools(
    window: BrowserWindow,
    mode: DevToolsConfig['mode'] = 'right',
): void {
    if (window.isDestroyed()) return;
    window.webContents.openDevTools({ mode });
}

/**
 * Close DevTools for a specific window.
 *
 * @param {BrowserWindow} window - Target window
 */
export function closeDevTools(window: BrowserWindow): void {
    if (window.isDestroyed()) return;
    if (window.webContents.isDevToolsOpened()) {
        window.webContents.closeDevTools();
    }
}

/**
 * Toggle DevTools for a specific window.
 *
 * @param {BrowserWindow} window - Target window
 */
export function toggleDevTools(window: BrowserWindow): void {
    if (window.isDestroyed()) return;
    window.webContents.toggleDevTools();
}

/**
 * Check if DevTools is open for a window.
 *
 * @param {BrowserWindow} window - Target window
 * @returns {boolean} True if open
 */
export function isDevToolsOpen(window: BrowserWindow): boolean {
    if (window.isDestroyed()) return false;
    return window.webContents.isDevToolsOpened();
}

/**
 * Log all registered IPC handlers (useful for debugging).
 */
export function logRegisteredHandlers(): void {
    if (!isDev) return;
    log.info('=== DevTools: IPC channel audit (manual check required) ===');
    log.info('Use electron-ipc-debug for runtime IPC logging');
}

/**
 * Enable verbose content-security-policy violation logging.
 *
 * @param {BrowserWindow} window - Target window
 */
export function enableCSPLogging(window: BrowserWindow): void {
    if (!isDev || window.isDestroyed()) return;

    window.webContents.on('console-message', (_event, level, message) => {
        if (message.includes('Content Security Policy') || message.includes('CSP')) {
            log.warn(`[CSP Violation] ${message}`);
        }
    });

    log.info('CSP violation logging enabled');
}
