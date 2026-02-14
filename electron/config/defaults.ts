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
export const WINDOW_DEFAULTS = {
    /** Default window width in pixels */
    WIDTH: 1200,

    /** Default window height in pixels */
    HEIGHT: 800,

    /** Minimum allowed window width */
    MIN_WIDTH: 800,

    /** Minimum allowed window height */
    MIN_HEIGHT: 600,

    /** Default background color before content loads */
    BACKGROUND_COLOR: '#ffffff',

    /** Dark mode background color */
    BACKGROUND_COLOR_DARK: '#1a1a2e',

    /** Whether to show a native frame (title bar) */
    FRAME: true,

    /** Whether the window is resizable */
    RESIZABLE: true,

    /** Whether the window should be transparent */
    TRANSPARENT: false,
} as const;

/**
 * Default settings window configuration.
 */
export const SETTINGS_WINDOW_DEFAULTS = {
    /** Width of the settings window */
    WIDTH: 720,

    /** Height of the settings window */
    HEIGHT: 800,

    /** Minimum width of the settings window */
    MIN_WIDTH: 520,

    /** Minimum height of the settings window */
    MIN_HEIGHT: 600,

    /** Whether the settings window is resizable */
    RESIZABLE: true,

    /** Whether the settings window is modal */
    MODAL: false,
} as const;

/**
 * Default splash screen configuration.
 */
export const SPLASH_DEFAULTS = {
    /** Splash screen width */
    WIDTH: 420,

    /** Splash screen height */
    HEIGHT: 320,

    /** Whether the splash screen has a frame */
    FRAME: false,

    /** Whether the splash screen is transparent */
    TRANSPARENT: true,

    /** Whether the splash screen is always on top */
    ALWAYS_ON_TOP: true,

    /** Whether the splash screen is resizable */
    RESIZABLE: false,

    /** Duration to show the splash screen (ms) */
    DISPLAY_DURATION: 3000,
} as const;

/**
 * Network defaults for connectivity and API requests.
 */
export const NETWORK_DEFAULTS = {
    /** Connection timeout for HTTP requests (ms) */
    REQUEST_TIMEOUT: 30000,

    /** Connectivity check timeout (ms) */
    CONNECTIVITY_TIMEOUT: 5000,

    /** URL used for connectivity checks */
    CONNECTIVITY_CHECK_URL: 'https://www.google.com',

    /** Maximum number of retry attempts for failed requests */
    MAX_RETRIES: 3,

    /** Delay between retry attempts (ms) */
    RETRY_DELAY: 1000,

    /** Backoff multiplier for retry delays */
    RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Auto-updater timing defaults.
 */
export const UPDATER_DEFAULTS = {
    /** Initial delay before the first update check (ms) */
    INITIAL_DELAY: 10 * 1000, // 10 seconds

    /** Interval between periodic update checks (ms) */
    CHECK_INTERVAL: 4 * 60 * 60 * 1000, // 4 hours

    /** Timeout for individual update check requests (ms) */
    CHECK_TIMEOUT: 60 * 1000, // 1 minute
} as const;

/**
 * File system defaults.
 */
export const FILE_DEFAULTS = {
    /** Maximum log file size before rotation (bytes) */
    MAX_LOG_FILE_SIZE: 10 * 1024 * 1024, // 10 MB

    /** Number of rotated log files to keep */
    MAX_LOG_FILES: 5,

    /** Window state save debounce delay (ms) */
    STATE_SAVE_DEBOUNCE: 500,

    /** Maximum file size for write-file IPC (bytes) */
    MAX_WRITE_SIZE: 50 * 1024 * 1024, // 50 MB

    /** Settings file name */
    SETTINGS_FILE: 'settings.json',

    /** Window state file name */
    WINDOW_STATE_FILE: 'window-state.json',

    /** Log directory name */
    LOG_DIRECTORY: 'logs',

    /** Crash dumps directory name */
    CRASH_DUMPS_DIRECTORY: 'crash-dumps',
} as const;

/**
 * Tray icon defaults.
 */
export const TRAY_DEFAULTS = {
    /** Tray icon size in pixels */
    ICON_SIZE: 16,

    /** Tooltip text format (name + version) */
    TOOLTIP_FORMAT: 'ZYNC v{version}',
} as const;

/**
 * Deep link configuration defaults.
 */
export const DEEP_LINK_DEFAULTS = {
    /** Protocol scheme for deep links */
    PROTOCOL: 'zync',

    /** Supported deep link routes */
    SUPPORTED_ROUTES: [
        'project',
        'note',
        'meeting',
        'task',
        'chat',
        'settings',
        'invite',
    ],
} as const;

/**
 * Security defaults.
 */
export const SECURITY_DEFAULTS = {
    /** Whether to allow unsafe protocols in external links */
    ALLOW_UNSAFE_PROTOCOLS: false,

    /** Allowed protocols for external links */
    ALLOWED_PROTOCOLS: ['http:', 'https:', 'mailto:'] as readonly string[],

    /** Whether to enable sandbox mode for renderer */
    SANDBOX: false,

    /** Whether to enable context isolation */
    CONTEXT_ISOLATION: true,

    /** Whether to enable node integration (should be false for security) */
    NODE_INTEGRATION: false,

    /** Whether to allow running insecure content */
    ALLOW_INSECURE_CONTENT: false,

    /** Maximum IPC message size (bytes) */
    MAX_IPC_MESSAGE_SIZE: 10 * 1024 * 1024, // 10 MB
} as const;

/**
 * Notification defaults.
 */
export const NOTIFICATION_DEFAULTS = {
    /** Default notification timeout (ms, 0 = system default) */
    TIMEOUT: 0,

    /** Whether notifications are silent by default */
    SILENT: false,

    /** Whether notifications should persist until dismissed */
    REQUIRE_INTERACTION: false,
} as const;

/**
 * Combined default configuration object.
 *
 * This object aggregates all defaults into a single export for
 * convenient access from other modules.
 */
export const DEFAULTS = {
    window: WINDOW_DEFAULTS,
    settingsWindow: SETTINGS_WINDOW_DEFAULTS,
    splash: SPLASH_DEFAULTS,
    network: NETWORK_DEFAULTS,
    updater: UPDATER_DEFAULTS,
    file: FILE_DEFAULTS,
    tray: TRAY_DEFAULTS,
    deepLink: DEEP_LINK_DEFAULTS,
    security: SECURITY_DEFAULTS,
    notification: NOTIFICATION_DEFAULTS,
} as const;
