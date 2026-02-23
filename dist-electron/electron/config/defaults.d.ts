/**
 * =============================================================================
 * Default Configuration — ZYNC Desktop Application
 * =============================================================================
 *
 * Centralized default values for all configurable aspects of the ZYNC
 * desktop application. These defaults are used when no user preference
 * has been set or when the settings file is missing/corrupted.
 *
 * Organization:
 * - Window defaults: Dimensions, positions, and visual settings
 * - Network defaults: Timeouts, retry policies, and URLs
 * - Behavior defaults: Startup, tray, and update behavior
 * - File defaults: Paths, size limits, and naming conventions
 *
 * @module electron/config/defaults
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/**
 * Default main window configuration.
 */
export declare const WINDOW_DEFAULTS: {
    /** Default window width in pixels */
    readonly WIDTH: 1200;
    /** Default window height in pixels */
    readonly HEIGHT: 800;
    /** Minimum allowed window width */
    readonly MIN_WIDTH: 800;
    /** Minimum allowed window height */
    readonly MIN_HEIGHT: 600;
    /** Default background color before content loads */
    readonly BACKGROUND_COLOR: "#ffffff";
    /** Dark mode background color */
    readonly BACKGROUND_COLOR_DARK: "#1a1a2e";
    /** Whether to show a native frame (title bar) */
    readonly FRAME: true;
    /** Whether the window is resizable */
    readonly RESIZABLE: true;
    /** Whether the window should be transparent */
    readonly TRANSPARENT: false;
};
/**
 * Default settings window configuration.
 */
export declare const SETTINGS_WINDOW_DEFAULTS: {
    /** Width of the settings window */
    readonly WIDTH: 720;
    /** Height of the settings window */
    readonly HEIGHT: 800;
    /** Minimum width of the settings window */
    readonly MIN_WIDTH: 520;
    /** Minimum height of the settings window */
    readonly MIN_HEIGHT: 600;
    /** Whether the settings window is resizable */
    readonly RESIZABLE: true;
    /** Whether the settings window is modal */
    readonly MODAL: false;
};
/**
 * Default splash screen configuration.
 */
export declare const SPLASH_DEFAULTS: {
    /** Splash screen width */
    readonly WIDTH: 420;
    /** Splash screen height */
    readonly HEIGHT: 320;
    /** Whether the splash screen has a frame */
    readonly FRAME: false;
    /** Whether the splash screen is transparent */
    readonly TRANSPARENT: true;
    /** Whether the splash screen is always on top */
    readonly ALWAYS_ON_TOP: true;
    /** Whether the splash screen is resizable */
    readonly RESIZABLE: false;
    /** Duration to show the splash screen (ms) */
    readonly DISPLAY_DURATION: 3000;
};
/**
 * Network defaults for connectivity and API requests.
 */
export declare const NETWORK_DEFAULTS: {
    /** Connection timeout for HTTP requests (ms) */
    readonly REQUEST_TIMEOUT: 30000;
    /** Connectivity check timeout (ms) */
    readonly CONNECTIVITY_TIMEOUT: 5000;
    /** URL used for connectivity checks */
    readonly CONNECTIVITY_CHECK_URL: "https://www.google.com";
    /** Maximum number of retry attempts for failed requests */
    readonly MAX_RETRIES: 3;
    /** Delay between retry attempts (ms) */
    readonly RETRY_DELAY: 1000;
    /** Backoff multiplier for retry delays */
    readonly RETRY_BACKOFF_MULTIPLIER: 2;
};
/**
 * Auto-updater timing defaults.
 */
export declare const UPDATER_DEFAULTS: {
    /** Initial delay before the first update check (ms) */
    readonly INITIAL_DELAY: number;
    /** Interval between periodic update checks (ms) */
    readonly CHECK_INTERVAL: number;
    /** Timeout for individual update check requests (ms) */
    readonly CHECK_TIMEOUT: number;
};
/**
 * File system defaults.
 */
export declare const FILE_DEFAULTS: {
    /** Maximum log file size before rotation (bytes) */
    readonly MAX_LOG_FILE_SIZE: number;
    /** Number of rotated log files to keep */
    readonly MAX_LOG_FILES: 5;
    /** Window state save debounce delay (ms) */
    readonly STATE_SAVE_DEBOUNCE: 500;
    /** Maximum file size for write-file IPC (bytes) */
    readonly MAX_WRITE_SIZE: number;
    /** Settings file name */
    readonly SETTINGS_FILE: "settings.json";
    /** Window state file name */
    readonly WINDOW_STATE_FILE: "window-state.json";
    /** Log directory name */
    readonly LOG_DIRECTORY: "logs";
    /** Crash dumps directory name */
    readonly CRASH_DUMPS_DIRECTORY: "crash-dumps";
};
/**
 * Tray icon defaults.
 */
export declare const TRAY_DEFAULTS: {
    /** Tray icon size in pixels */
    readonly ICON_SIZE: 16;
    /** Tooltip text format (name + version) */
    readonly TOOLTIP_FORMAT: "ZYNC v{version}";
};
/**
 * Deep link configuration defaults.
 */
export declare const DEEP_LINK_DEFAULTS: {
    /** Protocol scheme for deep links */
    readonly PROTOCOL: "zync";
    /** Supported deep link routes */
    readonly SUPPORTED_ROUTES: readonly ["project", "note", "meeting", "task", "chat", "settings", "invite"];
};
/**
 * Security defaults.
 */
export declare const SECURITY_DEFAULTS: {
    /** Whether to allow unsafe protocols in external links */
    readonly ALLOW_UNSAFE_PROTOCOLS: false;
    /** Allowed protocols for external links */
    readonly ALLOWED_PROTOCOLS: readonly string[];
    /** Whether to enable sandbox mode for renderer */
    readonly SANDBOX: false;
    /** Whether to enable context isolation */
    readonly CONTEXT_ISOLATION: true;
    /** Whether to enable node integration (should be false for security) */
    readonly NODE_INTEGRATION: false;
    /** Whether to allow running insecure content */
    readonly ALLOW_INSECURE_CONTENT: false;
    /** Maximum IPC message size (bytes) */
    readonly MAX_IPC_MESSAGE_SIZE: number;
};
/**
 * Notification defaults.
 */
export declare const NOTIFICATION_DEFAULTS: {
    /** Default notification timeout (ms, 0 = system default) */
    readonly TIMEOUT: 0;
    /** Whether notifications are silent by default */
    readonly SILENT: false;
    /** Whether notifications should persist until dismissed */
    readonly REQUIRE_INTERACTION: false;
};
/**
 * Combined default configuration object.
 *
 * This object aggregates all defaults into a single export for
 * convenient access from other modules.
 */
export declare const DEFAULTS: {
    readonly window: {
        /** Default window width in pixels */
        readonly WIDTH: 1200;
        /** Default window height in pixels */
        readonly HEIGHT: 800;
        /** Minimum allowed window width */
        readonly MIN_WIDTH: 800;
        /** Minimum allowed window height */
        readonly MIN_HEIGHT: 600;
        /** Default background color before content loads */
        readonly BACKGROUND_COLOR: "#ffffff";
        /** Dark mode background color */
        readonly BACKGROUND_COLOR_DARK: "#1a1a2e";
        /** Whether to show a native frame (title bar) */
        readonly FRAME: true;
        /** Whether the window is resizable */
        readonly RESIZABLE: true;
        /** Whether the window should be transparent */
        readonly TRANSPARENT: false;
    };
    readonly settingsWindow: {
        /** Width of the settings window */
        readonly WIDTH: 720;
        /** Height of the settings window */
        readonly HEIGHT: 800;
        /** Minimum width of the settings window */
        readonly MIN_WIDTH: 520;
        /** Minimum height of the settings window */
        readonly MIN_HEIGHT: 600;
        /** Whether the settings window is resizable */
        readonly RESIZABLE: true;
        /** Whether the settings window is modal */
        readonly MODAL: false;
    };
    readonly splash: {
        /** Splash screen width */
        readonly WIDTH: 420;
        /** Splash screen height */
        readonly HEIGHT: 320;
        /** Whether the splash screen has a frame */
        readonly FRAME: false;
        /** Whether the splash screen is transparent */
        readonly TRANSPARENT: true;
        /** Whether the splash screen is always on top */
        readonly ALWAYS_ON_TOP: true;
        /** Whether the splash screen is resizable */
        readonly RESIZABLE: false;
        /** Duration to show the splash screen (ms) */
        readonly DISPLAY_DURATION: 3000;
    };
    readonly network: {
        /** Connection timeout for HTTP requests (ms) */
        readonly REQUEST_TIMEOUT: 30000;
        /** Connectivity check timeout (ms) */
        readonly CONNECTIVITY_TIMEOUT: 5000;
        /** URL used for connectivity checks */
        readonly CONNECTIVITY_CHECK_URL: "https://www.google.com";
        /** Maximum number of retry attempts for failed requests */
        readonly MAX_RETRIES: 3;
        /** Delay between retry attempts (ms) */
        readonly RETRY_DELAY: 1000;
        /** Backoff multiplier for retry delays */
        readonly RETRY_BACKOFF_MULTIPLIER: 2;
    };
    readonly updater: {
        /** Initial delay before the first update check (ms) */
        readonly INITIAL_DELAY: number;
        /** Interval between periodic update checks (ms) */
        readonly CHECK_INTERVAL: number;
        /** Timeout for individual update check requests (ms) */
        readonly CHECK_TIMEOUT: number;
    };
    readonly file: {
        /** Maximum log file size before rotation (bytes) */
        readonly MAX_LOG_FILE_SIZE: number;
        /** Number of rotated log files to keep */
        readonly MAX_LOG_FILES: 5;
        /** Window state save debounce delay (ms) */
        readonly STATE_SAVE_DEBOUNCE: 500;
        /** Maximum file size for write-file IPC (bytes) */
        readonly MAX_WRITE_SIZE: number;
        /** Settings file name */
        readonly SETTINGS_FILE: "settings.json";
        /** Window state file name */
        readonly WINDOW_STATE_FILE: "window-state.json";
        /** Log directory name */
        readonly LOG_DIRECTORY: "logs";
        /** Crash dumps directory name */
        readonly CRASH_DUMPS_DIRECTORY: "crash-dumps";
    };
    readonly tray: {
        /** Tray icon size in pixels */
        readonly ICON_SIZE: 16;
        /** Tooltip text format (name + version) */
        readonly TOOLTIP_FORMAT: "ZYNC v{version}";
    };
    readonly deepLink: {
        /** Protocol scheme for deep links */
        readonly PROTOCOL: "zync";
        /** Supported deep link routes */
        readonly SUPPORTED_ROUTES: readonly ["project", "note", "meeting", "task", "chat", "settings", "invite"];
    };
    readonly security: {
        /** Whether to allow unsafe protocols in external links */
        readonly ALLOW_UNSAFE_PROTOCOLS: false;
        /** Allowed protocols for external links */
        readonly ALLOWED_PROTOCOLS: readonly string[];
        /** Whether to enable sandbox mode for renderer */
        readonly SANDBOX: false;
        /** Whether to enable context isolation */
        readonly CONTEXT_ISOLATION: true;
        /** Whether to enable node integration (should be false for security) */
        readonly NODE_INTEGRATION: false;
        /** Whether to allow running insecure content */
        readonly ALLOW_INSECURE_CONTENT: false;
        /** Maximum IPC message size (bytes) */
        readonly MAX_IPC_MESSAGE_SIZE: number;
    };
    readonly notification: {
        /** Default notification timeout (ms, 0 = system default) */
        readonly TIMEOUT: 0;
        /** Whether notifications are silent by default */
        readonly SILENT: false;
        /** Whether notifications should persist until dismissed */
        readonly REQUIRE_INTERACTION: false;
    };
};
