export interface IPCMessageBase {
    action: string;
    timestamp?: string;
    messageId?: string;
}
export interface MainToRendererMessage extends IPCMessageBase {
    data?: unknown;
    error?: string;
    errorCode?: string;
}
export interface RendererToMainRequest extends IPCMessageBase {
    payload?: unknown;
}
export interface DownloadPlatformRequest {
    platform: 'win' | 'mac' | 'linux';
}
export interface AppInfoResponse {
    version: string;
    name: string;
    electronVersion: string;
    chromeVersion: string;
    nodeVersion: string;
    v8Version: string;
    platform: string;
    arch: string;
    userDataPath: string;
    isDev: boolean;
    uptime: number;
}
export interface WriteFileRequest {
    filePath: string;
    content: string;
    encoding?: BufferEncoding;
}
export interface WriteFileResponse {
    success: boolean;
    error?: string;
    resolvedPath?: string;
    bytesWritten?: number;
}
export interface SaveDialogRequest {
    title?: string;
    defaultPath?: string;
    filters?: FileDialogFilter[];
    buttonLabel?: string;
}
export interface OpenDialogRequest {
    title?: string;
    defaultPath?: string;
    filters?: FileDialogFilter[];
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory'>;
    buttonLabel?: string;
}
export interface FileDialogFilter {
    name: string;
    extensions: string[];
}
export interface UpdateNotification {
    state: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
    version?: string;
    progress?: number;
    error?: string;
    releaseNotes?: string;
}
export interface SettingsChangeNotification {
    key: string;
    value: unknown;
    previousValue?: unknown;
    source: 'user' | 'system' | 'sync';
}
export interface WindowStateNotification {
    isMaximized: boolean;
    isMinimized: boolean;
    isFullScreen: boolean;
    isFocused: boolean;
}
export interface NavigationRequest {
    route: string;
    params?: Record<string, string>;
    replace?: boolean;
}
export interface IPCSendChannelMap {
    'download-platform': string;
    'open-settings': void;
    'open-external-link': string;
    'copy-to-clipboard': string;
    'minimize-window': void;
    'maximize-window': void;
    'close-window': void;
}
export interface IPCInvokeChannelMap {
    'get-app-info': {
        request: void;
        response: AppInfoResponse;
    };
    'get-app-version': {
        request: void;
        response: string;
    };
    'get-system-theme': {
        request: void;
        response: 'dark' | 'light';
    };
    'is-window-maximized': {
        request: void;
        response: boolean;
    };
    'show-save-dialog': {
        request: SaveDialogRequest;
        response: string | null;
    };
    'show-open-dialog': {
        request: OpenDialogRequest;
        response: string[];
    };
    'write-file': {
        request: WriteFileRequest;
        response: WriteFileResponse;
    };
    'get-settings': {
        request: void;
        response: Record<string, unknown>;
    };
    'set-setting': {
        request: {
            key: string;
            value: unknown;
        };
        response: boolean;
    };
    'toggle-login-item': {
        request: {
            enabled: boolean;
        };
        response: boolean;
    };
}
export interface IPCReceiveChannelMap {
    'fromMain': MainToRendererMessage;
}
