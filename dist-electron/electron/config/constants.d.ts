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
export declare const APP_NAME = "ZYNC";
/** Application description */
export declare const APP_DESCRIPTION = "Real-Time Collaboration Desktop Application";
/** GitHub repository URL */
export declare const GITHUB_REPO_URL = "https://github.com/ChitkulLakshya/Zync";
/** GitHub issues URL */
export declare const GITHUB_ISSUES_URL = "https://github.com/ChitkulLakshya/Zync/issues";
/** GitHub releases URL */
export declare const GITHUB_RELEASES_URL = "https://github.com/ChitkulLakshya/Zync/releases";
/** Web application URL (loaded in the renderer) */
export declare const WEB_APP_URL = "https://zync-it.vercel.app";
/** Local dev server URL (used in development mode) */
export declare const DEV_SERVER_URL = "http://localhost:5173";
/** Default window dimensions */
export declare const DEFAULT_WINDOW_WIDTH = 1200;
export declare const DEFAULT_WINDOW_HEIGHT = 800;
/** Minimum window dimensions */
export declare const MIN_WINDOW_WIDTH = 800;
export declare const MIN_WINDOW_HEIGHT = 600;
/** Auto-updater check interval (4 hours in milliseconds) */
export declare const UPDATE_CHECK_INTERVAL: number;
/** Whitelisted IPC channels (for security validation) */
export declare const IPC_CHANNELS: {
    /** One-way channels (renderer → main) */
    readonly SEND: readonly ["download-platform", "open-settings", "open-external-link", "copy-to-clipboard", "minimize-window", "maximize-window", "close-window"];
    /** Two-way channels (renderer ↔ main via invoke/handle) */
    readonly INVOKE: readonly ["get-app-info", "get-app-version", "get-system-theme", "is-window-maximized", "show-save-dialog", "show-open-dialog", "write-file"];
    /** Main → renderer channels */
    readonly RECEIVE: readonly ["fromMain"];
};
