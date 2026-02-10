/**
 * =============================================================================
 * Application Constants — ZYNC Desktop Application
 * =============================================================================
 *
 * Central configuration constants used across the Electron main process.
 *
 * @module electron/config/constants
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/** Application name used in menus, dialogs, and notifications */
export const APP_NAME = 'ZYNC';

/** Application description */
export const APP_DESCRIPTION = 'Real-Time Collaboration Desktop Application';

/** GitHub repository URL */
export const GITHUB_REPO_URL = 'https://github.com/ChitkulLakshya/Zync';

/** GitHub issues URL */
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

/** GitHub releases URL */
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;

/** Web application URL (loaded in the renderer) */
export const WEB_APP_URL = 'https://zync-it.vercel.app';

/** Local dev server URL (used in development mode) */
export const DEV_SERVER_URL = 'http://localhost:5173';

/** Default window dimensions */
export const DEFAULT_WINDOW_WIDTH = 1200;
export const DEFAULT_WINDOW_HEIGHT = 800;

/** Minimum window dimensions */
export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;

/** Auto-updater check interval (4 hours in milliseconds) */
export const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000;

/** Whitelisted IPC channels (for security validation) */
export const IPC_CHANNELS = {
    /** One-way channels (renderer → main) */
    SEND: [
        'download-platform',
        'open-settings',
        'open-external-link',
        'copy-to-clipboard',
        'minimize-window',
        'maximize-window',
        'close-window',
    ] as const,

    /** Two-way channels (renderer ↔ main via invoke/handle) */
    INVOKE: [
        'get-app-info',
        'get-app-version',
        'get-system-theme',
        'is-window-maximized',
        'show-save-dialog',
        'show-open-dialog',
        'write-file',
    ] as const,

    /** Main → renderer channels */
    RECEIVE: [
        'fromMain',
    ] as const,
} as const;
