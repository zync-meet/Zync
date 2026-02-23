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
/**
 * IPC channels that the renderer can SEND to the main process.
 * These are one-way messages with no response.
 */
export declare const SEND_CHANNELS: {
    /** Download the app for a specific platform */
    readonly DOWNLOAD_PLATFORM: "download-platform";
    /** Open the settings window */
    readonly OPEN_SETTINGS: "open-settings";
    /** Open a URL in the system browser */
    readonly OPEN_EXTERNAL_LINK: "open-external-link";
    /** Copy text to the system clipboard */
    readonly COPY_TO_CLIPBOARD: "copy-to-clipboard";
    /** Minimize the current window */
    readonly MINIMIZE_WINDOW: "minimize-window";
    /** Toggle maximize/restore */
    readonly MAXIMIZE_WINDOW: "maximize-window";
    /** Close the current window */
    readonly CLOSE_WINDOW: "close-window";
    /** Show a native notification */
    readonly NOTIFICATION_SHOW: "notification:show";
    /** Clear all notifications */
    readonly NOTIFICATION_CLEAR: "notification:clear";
    /** Relaunch the application */
    readonly APP_RELAUNCH: "app:relaunch";
    /** Generic message from main */
    readonly FROM_MAIN: "fromMain";
};
/**
 * IPC channels that the renderer can INVOKE on the main process.
 * These return a Promise with the result.
 */
export declare const INVOKE_CHANNELS: {
    /** Get the application version string */
    readonly GET_APP_VERSION: "get-app-version";
    /** Get detailed application info */
    readonly GET_APP_INFO: "get-app-info";
    /** Get the system's current theme */
    readonly GET_SYSTEM_THEME: "get-system-theme";
    /** Check if the window is maximized */
    readonly IS_WINDOW_MAXIMIZED: "is-window-maximized";
    /** Show a native save dialog */
    readonly SHOW_SAVE_DIALOG: "show-save-dialog";
    /** Show a native open dialog */
    readonly SHOW_OPEN_DIALOG: "show-open-dialog";
    /** Write data to a file */
    readonly WRITE_FILE: "write-file";
    /** Get all settings */
    readonly SETTINGS_GET_ALL: "settings:get-all";
    /** Get a single setting */
    readonly SETTINGS_GET: "settings:get";
    /** Set a single setting */
    readonly SETTINGS_SET: "settings:set";
    /** Reset all settings to defaults */
    readonly SETTINGS_RESET: "settings:reset";
    /** Toggle start on login */
    readonly SETTINGS_TOGGLE_LOGIN: "settings:toggle-login-item";
    /** Get login item status */
    readonly SETTINGS_LOGIN_STATUS: "settings:get-login-item-status";
    /** Import settings from file */
    readonly SETTINGS_IMPORT: "settings:import";
    /** Export settings to file */
    readonly SETTINGS_EXPORT: "settings:export";
    /** Show a native open dialog */
    readonly DIALOG_OPEN: "dialog:open";
    /** Show a message box */
    readonly DIALOG_MESSAGE: "dialog:message";
    /** Show a confirmation dialog */
    readonly DIALOG_CONFIRM: "dialog:confirm";
    /** Show an error dialog */
    readonly DIALOG_ERROR: "dialog:error";
    /** Show a file open dialog */
    readonly DIALOG_OPEN_FILE: "dialog:open-file";
    /** Show a file save dialog */
    readonly DIALOG_SAVE_FILE: "dialog:save-file";
    /** Open a URL with the system's default application */
    readonly SHELL_OPEN_EXTERNAL: "shell:open-external";
    /** Check for updates */
    readonly UPDATER_CHECK: "updater:check";
    /** Download a pending update */
    readonly UPDATER_DOWNLOAD: "updater:download";
    /** Install a downloaded update (restart) */
    readonly UPDATER_INSTALL: "updater:install";
    /** Get current theme info */
    readonly THEME_GET: "theme:get";
    /** Set theme source */
    readonly THEME_SET: "theme:set";
    /** Toggle theme */
    readonly THEME_TOGGLE: "theme:toggle";
    /** Toggle content protection */
    readonly CONTENT_PROTECTION_TOGGLE: "content-protection:toggle";
    /** Get protection state */
    readonly CONTENT_PROTECTION_STATE: "content-protection:state";
    /** Capture the screen */
    readonly SCREENSHOT_CAPTURE: "screenshot:capture";
    /** Save a screenshot to disk */
    readonly SCREENSHOT_SAVE: "screenshot:save";
};
/**
 * IPC channels the renderer can LISTEN to for messages from the main process.
 */
export declare const RECEIVE_CHANNELS: {
    /** Generic message from main */
    readonly FROM_MAIN: "fromMain";
    /** Signal to close the splash screen */
    readonly SPLASH_CLOSE: "splash:close";
    /** Splash screen status update */
    readonly SPLASH_STATUS: "splash:status";
    /** A setting has changed */
    readonly SETTINGS_CHANGED: "settings:changed";
    /** Update status change */
    readonly UPDATER_STATUS: "updater:status";
    /** Download progress */
    readonly UPDATER_PROGRESS: "updater:progress";
    /** A notification was clicked */
    readonly NOTIFICATION_CLICKED: "notification:clicked";
    /** Deep link navigation request */
    readonly DEEP_LINK_NAVIGATE: "deep-link:navigate";
    /** System theme changed */
    readonly THEME_CHANGED: "theme:changed";
};
/** All valid send channel names */
export type SendChannel = (typeof SEND_CHANNELS)[keyof typeof SEND_CHANNELS];
/** All valid invoke channel names */
export type InvokeChannel = (typeof INVOKE_CHANNELS)[keyof typeof INVOKE_CHANNELS];
/** All valid receive channel names */
export type ReceiveChannel = (typeof RECEIVE_CHANNELS)[keyof typeof RECEIVE_CHANNELS];
/** Union of all channel names */
export type AnyChannel = SendChannel | InvokeChannel | ReceiveChannel;
