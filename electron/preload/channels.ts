/**
 * =============================================================================
 * IPC Channel Definitions — ZYNC Desktop Preload
 * =============================================================================
 *
 * Centralized registry of all IPC channel names used between the renderer
 * and main processes. Importing from here prevents typos and enables
 * easy channel auditing.
 *
 * @module electron/preload/channels
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

// =============================================================================
// Send Channels (renderer → main, fire-and-forget)
// =============================================================================

/**
 * IPC channels that the renderer can SEND to the main process.
 * These are one-way messages with no response.
 */
export const SEND_CHANNELS = {
    // ─── Navigation ────────────────────────────────────────────────────
    /** Download the app for a specific platform */
    DOWNLOAD_PLATFORM: 'download-platform',
    /** Open the settings window */
    OPEN_SETTINGS: 'open-settings',
    /** Open a URL in the system browser */
    OPEN_EXTERNAL_LINK: 'open-external-link',
    /** Copy text to the system clipboard */
    COPY_TO_CLIPBOARD: 'copy-to-clipboard',

    // ─── Window Management ─────────────────────────────────────────────
    /** Minimize the current window */
    MINIMIZE_WINDOW: 'minimize-window',
    /** Toggle maximize/restore */
    MAXIMIZE_WINDOW: 'maximize-window',
    /** Close the current window */
    CLOSE_WINDOW: 'close-window',

    // ─── Notifications ─────────────────────────────────────────────────
    /** Show a native notification */
    NOTIFICATION_SHOW: 'notification:show',
    /** Clear all notifications */
    NOTIFICATION_CLEAR: 'notification:clear',

    // ─── App Control ───────────────────────────────────────────────────
    /** Relaunch the application */
    APP_RELAUNCH: 'app:relaunch',

    // ─── Generic ───────────────────────────────────────────────────────
    /** Generic message from main */
    FROM_MAIN: 'fromMain',
} as const;

// =============================================================================
// Invoke Channels (renderer → main, request/response)
// =============================================================================

/**
 * IPC channels that the renderer can INVOKE on the main process.
 * These return a Promise with the result.
 */
export const INVOKE_CHANNELS = {
    // ─── App Info ──────────────────────────────────────────────────────
    /** Get the application version string */
    GET_APP_VERSION: 'get-app-version',
    /** Get detailed application info */
    GET_APP_INFO: 'get-app-info',
    /** Get the system's current theme */
    GET_SYSTEM_THEME: 'get-system-theme',

    // ─── Window ────────────────────────────────────────────────────────
    /** Check if the window is maximized */
    IS_WINDOW_MAXIMIZED: 'is-window-maximized',

    // ─── File Operations ───────────────────────────────────────────────
    /** Show a native save dialog */
    SHOW_SAVE_DIALOG: 'show-save-dialog',
    /** Show a native open dialog */
    SHOW_OPEN_DIALOG: 'show-open-dialog',
    /** Write data to a file */
    WRITE_FILE: 'write-file',

    // ─── Settings ──────────────────────────────────────────────────────
    /** Get all settings */
    SETTINGS_GET_ALL: 'settings:get-all',
    /** Get a single setting */
    SETTINGS_GET: 'settings:get',
    /** Set a single setting */
    SETTINGS_SET: 'settings:set',
    /** Reset all settings to defaults */
    SETTINGS_RESET: 'settings:reset',
    /** Toggle start on login */
    SETTINGS_TOGGLE_LOGIN: 'settings:toggle-login-item',
    /** Get login item status */
    SETTINGS_LOGIN_STATUS: 'settings:get-login-item-status',
    /** Import settings from file */
    SETTINGS_IMPORT: 'settings:import',
    /** Export settings to file */
    SETTINGS_EXPORT: 'settings:export',

    // ─── Dialog ────────────────────────────────────────────────────────
    /** Show a native open dialog */
    DIALOG_OPEN: 'dialog:open',
    /** Show a message box */
    DIALOG_MESSAGE: 'dialog:message',
    /** Show a confirmation dialog */
    DIALOG_CONFIRM: 'dialog:confirm',
    /** Show an error dialog */
    DIALOG_ERROR: 'dialog:error',
    /** Show a file open dialog */
    DIALOG_OPEN_FILE: 'dialog:open-file',
    /** Show a file save dialog */
    DIALOG_SAVE_FILE: 'dialog:save-file',

    // ─── Shell ─────────────────────────────────────────────────────────
    /** Open a URL with the system's default application */
    SHELL_OPEN_EXTERNAL: 'shell:open-external',

    // ─── Updater ───────────────────────────────────────────────────────
    /** Check for updates */
    UPDATER_CHECK: 'updater:check',
    /** Download a pending update */
    UPDATER_DOWNLOAD: 'updater:download',
    /** Install a downloaded update (restart) */
    UPDATER_INSTALL: 'updater:install',

    // ─── Theme ─────────────────────────────────────────────────────────
    /** Get current theme info */
    THEME_GET: 'theme:get',
    /** Set theme source */
    THEME_SET: 'theme:set',
    /** Toggle theme */
    THEME_TOGGLE: 'theme:toggle',

    // ─── Content Protection ────────────────────────────────────────────
    /** Toggle content protection */
    CONTENT_PROTECTION_TOGGLE: 'content-protection:toggle',
    /** Get protection state */
    CONTENT_PROTECTION_STATE: 'content-protection:state',

    // ─── Screenshot ────────────────────────────────────────────────────
    /** Capture the screen */
    SCREENSHOT_CAPTURE: 'screenshot:capture',
    /** Save a screenshot to disk */
    SCREENSHOT_SAVE: 'screenshot:save',
} as const;

// =============================================================================
// Receive Channels (main → renderer)
// =============================================================================

/**
 * IPC channels the renderer can LISTEN to for messages from the main process.
 */
export const RECEIVE_CHANNELS = {
    // ─── Generic ───────────────────────────────────────────────────────
    /** Generic message from main */
    FROM_MAIN: 'fromMain',

    // ─── Splash Screen ─────────────────────────────────────────────────
    /** Signal to close the splash screen */
    SPLASH_CLOSE: 'splash:close',
    /** Splash screen status update */
    SPLASH_STATUS: 'splash:status',

    // ─── Settings ──────────────────────────────────────────────────────
    /** A setting has changed */
    SETTINGS_CHANGED: 'settings:changed',

    // ─── Updater ───────────────────────────────────────────────────────
    /** Update status change */
    UPDATER_STATUS: 'updater:status',
    /** Download progress */
    UPDATER_PROGRESS: 'updater:progress',

    // ─── Notifications ─────────────────────────────────────────────────
    /** A notification was clicked */
    NOTIFICATION_CLICKED: 'notification:clicked',

    // ─── Deep Links ────────────────────────────────────────────────────
    /** Deep link navigation request */
    DEEP_LINK_NAVIGATE: 'deep-link:navigate',

    // ─── Theme ─────────────────────────────────────────────────────────
    /** System theme changed */
    THEME_CHANGED: 'theme:changed',
} as const;

// =============================================================================
// Type Helpers
// =============================================================================

/** All valid send channel names */
export type SendChannel = (typeof SEND_CHANNELS)[keyof typeof SEND_CHANNELS];

/** All valid invoke channel names */
export type InvokeChannel = (typeof INVOKE_CHANNELS)[keyof typeof INVOKE_CHANNELS];

/** All valid receive channel names */
export type ReceiveChannel = (typeof RECEIVE_CHANNELS)[keyof typeof RECEIVE_CHANNELS];

/** Union of all channel names */
export type AnyChannel = SendChannel | InvokeChannel | ReceiveChannel;
