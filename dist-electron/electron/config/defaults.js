export const WINDOW_DEFAULTS = {
    WIDTH: 1200,
    HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    BACKGROUND_COLOR: '#ffffff',
    BACKGROUND_COLOR_DARK: '#1a1a2e',
    FRAME: true,
    RESIZABLE: true,
    TRANSPARENT: false,
};
export const SETTINGS_WINDOW_DEFAULTS = {
    WIDTH: 720,
    HEIGHT: 800,
    MIN_WIDTH: 520,
    MIN_HEIGHT: 600,
    RESIZABLE: true,
    MODAL: false,
};
export const SPLASH_DEFAULTS = {
    WIDTH: 420,
    HEIGHT: 320,
    FRAME: false,
    TRANSPARENT: true,
    ALWAYS_ON_TOP: true,
    RESIZABLE: false,
    DISPLAY_DURATION: 3000,
};
export const NETWORK_DEFAULTS = {
    REQUEST_TIMEOUT: 30000,
    CONNECTIVITY_TIMEOUT: 5000,
    CONNECTIVITY_CHECK_URL: 'https://www.google.com',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_BACKOFF_MULTIPLIER: 2,
};
export const UPDATER_DEFAULTS = {
    INITIAL_DELAY: 10 * 1000,
    CHECK_INTERVAL: 4 * 60 * 60 * 1000,
    CHECK_TIMEOUT: 60 * 1000,
};
export const FILE_DEFAULTS = {
    MAX_LOG_FILE_SIZE: 10 * 1024 * 1024,
    MAX_LOG_FILES: 5,
    STATE_SAVE_DEBOUNCE: 500,
    MAX_WRITE_SIZE: 50 * 1024 * 1024,
    SETTINGS_FILE: 'settings.json',
    WINDOW_STATE_FILE: 'window-state.json',
    LOG_DIRECTORY: 'logs',
    CRASH_DUMPS_DIRECTORY: 'crash-dumps',
};
export const TRAY_DEFAULTS = {
    ICON_SIZE: 16,
    TOOLTIP_FORMAT: 'ZYNC v{version}',
};
export const DEEP_LINK_DEFAULTS = {
    PROTOCOL: 'zync',
    SUPPORTED_ROUTES: [
        'project',
        'note',
        'meeting',
        'task',
        'chat',
        'settings',
        'invite',
    ],
};
export const SECURITY_DEFAULTS = {
    ALLOW_UNSAFE_PROTOCOLS: false,
    ALLOWED_PROTOCOLS: ['http:', 'https:', 'mailto:'],
    SANDBOX: false,
    CONTEXT_ISOLATION: true,
    NODE_INTEGRATION: false,
    ALLOW_INSECURE_CONTENT: false,
    MAX_IPC_MESSAGE_SIZE: 10 * 1024 * 1024,
};
export const NOTIFICATION_DEFAULTS = {
    TIMEOUT: 0,
    SILENT: false,
    REQUIRE_INTERACTION: false,
};
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
};
//# sourceMappingURL=defaults.js.map