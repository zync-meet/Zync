export declare const APP_NAME = "ZYNC";
export declare const APP_DESCRIPTION = "Real-Time Collaboration Desktop Application";
export declare const GITHUB_REPO_URL = "https://github.com/ChitkulLakshya/Zync";
export declare const GITHUB_ISSUES_URL = "https://github.com/ChitkulLakshya/Zync/issues";
export declare const GITHUB_RELEASES_URL = "https://github.com/ChitkulLakshya/Zync/releases";
export declare const WEB_APP_URL = "https://zync-it.vercel.app";
export declare const DEV_SERVER_URL = "http://localhost:8081";
export declare const DEFAULT_WINDOW_WIDTH = 1200;
export declare const DEFAULT_WINDOW_HEIGHT = 800;
export declare const MIN_WINDOW_WIDTH = 800;
export declare const MIN_WINDOW_HEIGHT = 600;
export declare const UPDATE_CHECK_INTERVAL: number;
export declare const IPC_CHANNELS: {
    readonly SEND: readonly ["download-platform", "open-settings", "open-external-link", "copy-to-clipboard", "minimize-window", "maximize-window", "close-window"];
    readonly INVOKE: readonly ["get-app-info", "get-app-version", "get-system-theme", "is-window-maximized", "show-save-dialog", "show-open-dialog", "write-file"];
    readonly RECEIVE: readonly ["fromMain"];
};
