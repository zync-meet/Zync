export declare const WINDOW_DEFAULTS: {
    readonly WIDTH: 1200;
    readonly HEIGHT: 800;
    readonly MIN_WIDTH: 800;
    readonly MIN_HEIGHT: 600;
    readonly BACKGROUND_COLOR: "#ffffff";
    readonly BACKGROUND_COLOR_DARK: "#1a1a2e";
    readonly FRAME: true;
    readonly RESIZABLE: true;
    readonly TRANSPARENT: false;
};
export declare const SETTINGS_WINDOW_DEFAULTS: {
    readonly WIDTH: 720;
    readonly HEIGHT: 800;
    readonly MIN_WIDTH: 520;
    readonly MIN_HEIGHT: 600;
    readonly RESIZABLE: true;
    readonly MODAL: false;
};
export declare const SPLASH_DEFAULTS: {
    readonly WIDTH: 420;
    readonly HEIGHT: 320;
    readonly FRAME: false;
    readonly TRANSPARENT: true;
    readonly ALWAYS_ON_TOP: true;
    readonly RESIZABLE: false;
    readonly DISPLAY_DURATION: 3000;
};
export declare const NETWORK_DEFAULTS: {
    readonly REQUEST_TIMEOUT: 30000;
    readonly CONNECTIVITY_TIMEOUT: 5000;
    readonly CONNECTIVITY_CHECK_URL: "https://www.google.com";
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY: 1000;
    readonly RETRY_BACKOFF_MULTIPLIER: 2;
};
export declare const UPDATER_DEFAULTS: {
    readonly INITIAL_DELAY: number;
    readonly CHECK_INTERVAL: number;
    readonly CHECK_TIMEOUT: number;
};
export declare const FILE_DEFAULTS: {
    readonly MAX_LOG_FILE_SIZE: number;
    readonly MAX_LOG_FILES: 5;
    readonly STATE_SAVE_DEBOUNCE: 500;
    readonly MAX_WRITE_SIZE: number;
    readonly SETTINGS_FILE: "settings.json";
    readonly WINDOW_STATE_FILE: "window-state.json";
    readonly LOG_DIRECTORY: "logs";
    readonly CRASH_DUMPS_DIRECTORY: "crash-dumps";
};
export declare const TRAY_DEFAULTS: {
    readonly ICON_SIZE: 16;
    readonly TOOLTIP_FORMAT: "ZYNC v{version}";
};
export declare const DEEP_LINK_DEFAULTS: {
    readonly PROTOCOL: "zync";
    readonly SUPPORTED_ROUTES: readonly ["project", "note", "meeting", "task", "chat", "settings", "invite"];
};
export declare const SECURITY_DEFAULTS: {
    readonly ALLOW_UNSAFE_PROTOCOLS: false;
    readonly ALLOWED_PROTOCOLS: readonly string[];
    readonly SANDBOX: false;
    readonly CONTEXT_ISOLATION: true;
    readonly NODE_INTEGRATION: false;
    readonly ALLOW_INSECURE_CONTENT: false;
    readonly MAX_IPC_MESSAGE_SIZE: number;
};
export declare const NOTIFICATION_DEFAULTS: {
    readonly TIMEOUT: 0;
    readonly SILENT: false;
    readonly REQUIRE_INTERACTION: false;
};
export declare const DEFAULTS: {
    readonly window: {
        readonly WIDTH: 1200;
        readonly HEIGHT: 800;
        readonly MIN_WIDTH: 800;
        readonly MIN_HEIGHT: 600;
        readonly BACKGROUND_COLOR: "#ffffff";
        readonly BACKGROUND_COLOR_DARK: "#1a1a2e";
        readonly FRAME: true;
        readonly RESIZABLE: true;
        readonly TRANSPARENT: false;
    };
    readonly settingsWindow: {
        readonly WIDTH: 720;
        readonly HEIGHT: 800;
        readonly MIN_WIDTH: 520;
        readonly MIN_HEIGHT: 600;
        readonly RESIZABLE: true;
        readonly MODAL: false;
    };
    readonly splash: {
        readonly WIDTH: 420;
        readonly HEIGHT: 320;
        readonly FRAME: false;
        readonly TRANSPARENT: true;
        readonly ALWAYS_ON_TOP: true;
        readonly RESIZABLE: false;
        readonly DISPLAY_DURATION: 3000;
    };
    readonly network: {
        readonly REQUEST_TIMEOUT: 30000;
        readonly CONNECTIVITY_TIMEOUT: 5000;
        readonly CONNECTIVITY_CHECK_URL: "https://www.google.com";
        readonly MAX_RETRIES: 3;
        readonly RETRY_DELAY: 1000;
        readonly RETRY_BACKOFF_MULTIPLIER: 2;
    };
    readonly updater: {
        readonly INITIAL_DELAY: number;
        readonly CHECK_INTERVAL: number;
        readonly CHECK_TIMEOUT: number;
    };
    readonly file: {
        readonly MAX_LOG_FILE_SIZE: number;
        readonly MAX_LOG_FILES: 5;
        readonly STATE_SAVE_DEBOUNCE: 500;
        readonly MAX_WRITE_SIZE: number;
        readonly SETTINGS_FILE: "settings.json";
        readonly WINDOW_STATE_FILE: "window-state.json";
        readonly LOG_DIRECTORY: "logs";
        readonly CRASH_DUMPS_DIRECTORY: "crash-dumps";
    };
    readonly tray: {
        readonly ICON_SIZE: 16;
        readonly TOOLTIP_FORMAT: "ZYNC v{version}";
    };
    readonly deepLink: {
        readonly PROTOCOL: "zync";
        readonly SUPPORTED_ROUTES: readonly ["project", "note", "meeting", "task", "chat", "settings", "invite"];
    };
    readonly security: {
        readonly ALLOW_UNSAFE_PROTOCOLS: false;
        readonly ALLOWED_PROTOCOLS: readonly string[];
        readonly SANDBOX: false;
        readonly CONTEXT_ISOLATION: true;
        readonly NODE_INTEGRATION: false;
        readonly ALLOW_INSECURE_CONTENT: false;
        readonly MAX_IPC_MESSAGE_SIZE: number;
    };
    readonly notification: {
        readonly TIMEOUT: 0;
        readonly SILENT: false;
        readonly REQUIRE_INTERACTION: false;
    };
};
