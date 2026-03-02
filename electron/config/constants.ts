export const APP_NAME = 'ZYNC';


export const APP_DESCRIPTION = 'Real-Time Collaboration Desktop Application';


export const GITHUB_REPO_URL = 'https://github.com/ChitkulLakshya/Zync';


export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;


export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;


export const WEB_APP_URL = 'https://zync-it.vercel.app';


export const DEV_SERVER_URL = 'http://localhost:8081';


export const DEFAULT_WINDOW_WIDTH = 1200;
export const DEFAULT_WINDOW_HEIGHT = 800;


export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;


export const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000;


export const IPC_CHANNELS = {

    SEND: [
        'download-platform',
        'open-settings',
        'open-external-link',
        'copy-to-clipboard',
        'minimize-window',
        'maximize-window',
        'close-window',
    ] as const,


    INVOKE: [
        'get-app-info',
        'get-app-version',
        'get-system-theme',
        'is-window-maximized',
        'show-save-dialog',
        'show-open-dialog',
        'write-file',
    ] as const,


    RECEIVE: [
        'fromMain',
    ] as const,
} as const;
