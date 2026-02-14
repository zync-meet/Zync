/**
 * =============================================================================
 * IPC Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript interfaces defining the structure and types for all Inter-Process
 * Communication (IPC) messages exchanged between the main process and the
 * renderer process. These interfaces ensure type safety across the IPC boundary.
 *
 * IPC Architecture:
 * ┌─────────────┐  send/invoke  ┌───────────────┐
 * │  Renderer    │ ────────────► │  Main Process  │
 * │  (React)     │ ◄──────────── │  (Node.js)     │
 * └─────────────┘  fromMain     └───────────────┘
 *
 * Channel Types:
 * - SEND: One-way, fire-and-forget (ipcMain.on / ipcRenderer.send)
 * - INVOKE: Two-way, request-response (ipcMain.handle / ipcRenderer.invoke)
 * - RECEIVE: Main → Renderer notifications (webContents.send)
 *
 * @module electron/interfaces/ipc
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * Base interface for all IPC messages.
 *
 * Every IPC message should conform to this structure to ensure consistent
 * message handling across the application. The `action` field serves as
 * a discriminator for message routing.
 *
 * @interface IPCMessageBase
 */
export interface IPCMessageBase {
    /** Unique action identifier for message routing */
    action: string;

    /** Timestamp of when the message was created (ISO 8601) */
    timestamp?: string;

    /** Unique message ID for tracking and deduplication */
    messageId?: string;
}

/**
 * IPC message from main process to renderer process.
 *
 * These messages are sent via `webContents.send('fromMain', message)` and
 * received in the renderer via `window.electron.onMainMessage(callback)`.
 *
 * @interface MainToRendererMessage
 * @extends IPCMessageBase
 */
export interface MainToRendererMessage extends IPCMessageBase {
    /** Optional payload data */
    data?: unknown;

    /** Error information if the action represents a failure */
    error?: string;

    /** Error code for programmatic error handling */
    errorCode?: string;
}

/**
 * IPC request from renderer to main process.
 *
 * These represent the data structures sent from the renderer process
 * to the main process via `ipcRenderer.send()` or `ipcRenderer.invoke()`.
 *
 * @interface RendererToMainRequest
 * @extends IPCMessageBase
 */
export interface RendererToMainRequest extends IPCMessageBase {
    /** Request payload */
    payload?: unknown;
}

/**
 * Download platform request data.
 *
 * Sent when the user clicks a platform download button in the settings window.
 *
 * @interface DownloadPlatformRequest
 */
export interface DownloadPlatformRequest {
    /** Target platform identifier: 'win', 'mac', or 'linux' */
    platform: 'win' | 'mac' | 'linux';
}

/**
 * Application information response.
 *
 * Returned by the 'get-app-info' IPC handler with comprehensive
 * information about the application and its runtime environment.
 *
 * @interface AppInfoResponse
 */
export interface AppInfoResponse {
    /** Application version from package.json (semver) */
    version: string;

    /** Application display name */
    name: string;

    /** Electron framework version */
    electronVersion: string;

    /** Chromium version used by Electron */
    chromeVersion: string;

    /** Node.js runtime version */
    nodeVersion: string;

    /** V8 JavaScript engine version */
    v8Version: string;

    /** Operating system platform identifier */
    platform: string;

    /** CPU architecture */
    arch: string;

    /** Path to the user data directory */
    userDataPath: string;

    /** Whether the app is running in development mode */
    isDev: boolean;

    /** Application uptime in seconds */
    uptime: number;
}

/**
 * File write request data.
 *
 * Sent by the renderer when requesting to write content to a file.
 * The main process validates the file path against allowed directories
 * before performing the write operation.
 *
 * @interface WriteFileRequest
 */
export interface WriteFileRequest {
    /** Absolute path to the target file */
    filePath: string;

    /** Content to write to the file */
    content: string;

    /** Character encoding for the file (default: 'utf-8') */
    encoding?: BufferEncoding;
}

/**
 * File write result data.
 *
 * Returned by the 'write-file' IPC handler after attempting to write
 * content to a file.
 *
 * @interface WriteFileResponse
 */
export interface WriteFileResponse {
    /** Whether the write operation succeeded */
    success: boolean;

    /** Error message if the operation failed */
    error?: string;

    /** The resolved absolute path where the file was written */
    resolvedPath?: string;

    /** Size of the written file in bytes */
    bytesWritten?: number;
}

/**
 * Save dialog options passed from the renderer.
 *
 * @interface SaveDialogRequest
 */
export interface SaveDialogRequest {
    /** Dialog window title */
    title?: string;

    /** Default file path for the save dialog */
    defaultPath?: string;

    /** File type filters */
    filters?: FileDialogFilter[];

    /** Button label text */
    buttonLabel?: string;
}

/**
 * Open dialog options passed from the renderer.
 *
 * @interface OpenDialogRequest
 */
export interface OpenDialogRequest {
    /** Dialog window title */
    title?: string;

    /** Default directory to open */
    defaultPath?: string;

    /** File type filters */
    filters?: FileDialogFilter[];

    /** Dialog properties (file selection behavior) */
    properties?: Array<
        'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory'
    >;

    /** Button label text */
    buttonLabel?: string;
}

/**
 * File filter for file dialogs.
 *
 * @interface FileDialogFilter
 */
export interface FileDialogFilter {
    /** Display name for the filter (e.g., 'Images') */
    name: string;

    /** File extensions to filter (without the dot, e.g., ['png', 'jpg']) */
    extensions: string[];
}

/**
 * Update notification message sent from main to renderer.
 *
 * @interface UpdateNotification
 */
export interface UpdateNotification {
    /** Current state of the update process */
    state: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

    /** Version of the available update */
    version?: string;

    /** Download progress (0-100) */
    progress?: number;

    /** Error message if update check failed */
    error?: string;

    /** Release notes for the update */
    releaseNotes?: string;
}

/**
 * Settings change notification.
 *
 * Sent from the main process to the renderer when a setting is changed
 * from the native settings window or system event (e.g., theme change).
 *
 * @interface SettingsChangeNotification
 */
export interface SettingsChangeNotification {
    /** The setting key that changed */
    key: string;

    /** The new value of the setting */
    value: unknown;

    /** The previous value of the setting */
    previousValue?: unknown;

    /** Source of the change ('user' | 'system' | 'sync') */
    source: 'user' | 'system' | 'sync';
}

/**
 * Window state change notification.
 *
 * Sent from main to renderer when window state changes (maximize, minimize, etc.)
 *
 * @interface WindowStateNotification
 */
export interface WindowStateNotification {
    /** Whether the window is currently maximized */
    isMaximized: boolean;

    /** Whether the window is currently minimized */
    isMinimized: boolean;

    /** Whether the window is in fullscreen mode */
    isFullScreen: boolean;

    /** Whether the window is currently focused */
    isFocused: boolean;
}

/**
 * Navigation request from main to renderer.
 *
 * Used to instruct the renderer to navigate to a specific route,
 * typically triggered by deep links or menu items.
 *
 * @interface NavigationRequest
 */
export interface NavigationRequest {
    /** Target route path (e.g., '/dashboard', '/settings') */
    route: string;

    /** Query parameters to append to the route */
    params?: Record<string, string>;

    /** Whether to replace the current history entry */
    replace?: boolean;
}

/**
 * Type map for all IPC send channels.
 *
 * This type maps channel names to their expected payload types,
 * enabling type-safe IPC communication.
 *
 * @type IPCSendChannelMap
 */
export interface IPCSendChannelMap {
    'download-platform': string;
    'open-settings': void;
    'open-external-link': string;
    'copy-to-clipboard': string;
    'minimize-window': void;
    'maximize-window': void;
    'close-window': void;
}

/**
 * Type map for all IPC invoke channels.
 *
 * Maps channel names to their request and response types.
 *
 * @type IPCInvokeChannelMap
 */
export interface IPCInvokeChannelMap {
    'get-app-info': { request: void; response: AppInfoResponse };
    'get-app-version': { request: void; response: string };
    'get-system-theme': { request: void; response: 'dark' | 'light' };
    'is-window-maximized': { request: void; response: boolean };
    'show-save-dialog': { request: SaveDialogRequest; response: string | null };
    'show-open-dialog': { request: OpenDialogRequest; response: string[] };
    'write-file': { request: WriteFileRequest; response: WriteFileResponse };
    'get-settings': { request: void; response: Record<string, unknown> };
    'set-setting': { request: { key: string; value: unknown }; response: boolean };
    'toggle-login-item': { request: { enabled: boolean }; response: boolean };
}

/**
 * Type map for main → renderer channels.
 *
 * @type IPCReceiveChannelMap
 */
export interface IPCReceiveChannelMap {
    'fromMain': MainToRendererMessage;
}
