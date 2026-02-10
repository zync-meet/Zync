/**
 * =============================================================================
 * Preload Type Definitions — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript type definitions for the APIs exposed by the preload script
 * via contextBridge. These types allow the renderer process to use the
 * exposed APIs with full type safety and IntelliSense support.
 *
 * Usage in renderer:
 * ```typescript
 * // The window.electron object is typed by this file
 * window.electron.downloadPlatform('win');
 * const version = await window.electron.getAppVersion();
 * ```
 *
 * @module electron/preload/types
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * Interface for the Electron API exposed to the renderer process.
 *
 * These methods are the ONLY Electron/Node.js APIs available in the
 * renderer. All other Node.js and Electron APIs are blocked by context
 * isolation for security.
 */
export interface ElectronAPI {
    /**
     * Opens the platform-specific download link in the default browser.
     * @param platform - Target platform: 'win', 'mac', or 'linux'
     */
    downloadPlatform: (platform: string) => void;

    /**
     * Opens the native settings window.
     */
    openSettings: () => void;

    /**
     * Opens a URL in the user's default web browser.
     * Only http:// and https:// URLs are allowed.
     * @param url - The URL to open
     */
    openExternalLink: (url: string) => void;

    /**
     * Copies text to the system clipboard.
     * @param text - The text to copy
     */
    copyToClipboard: (text: string) => void;

    /**
     * Returns the application version string.
     * @returns Promise resolving to version (e.g., "1.0.0")
     */
    getAppVersion: () => Promise<string>;

    /**
     * Returns comprehensive application info.
     * @returns Promise resolving to AppInfo object
     */
    getAppInfo: () => Promise<AppInfo>;

    /**
     * Returns the current system theme.
     * @returns Promise resolving to 'dark' or 'light'
     */
    getSystemTheme: () => Promise<string>;

    /**
     * Minimizes the main application window.
     */
    minimizeWindow: () => void;

    /**
     * Toggles maximize/restore on the main window.
     */
    maximizeWindow: () => void;

    /**
     * Closes the main application window.
     */
    closeWindow: () => void;

    /**
     * Checks if the main window is currently maximized.
     * @returns Promise resolving to boolean
     */
    isWindowMaximized: () => Promise<boolean>;

    /**
     * Shows a native save file dialog.
     * @param options - Dialog configuration
     * @returns Promise resolving to file path or null if cancelled
     */
    showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>;

    /**
     * Shows a native open file dialog.
     * @param options - Dialog configuration
     * @returns Promise resolving to array of file paths
     */
    showOpenDialog: (options: OpenDialogOptions) => Promise<string[]>;

    /**
     * Writes content to a file on the local file system.
     * @param data - File path, content, and optional encoding
     * @returns Promise resolving to write result
     */
    writeFile: (data: WriteFileData) => Promise<WriteFileResult>;

    /**
     * Registers a listener for messages from the main process.
     * @param callback - Function called with message data
     * @returns Cleanup function to remove the listener
     */
    onMainMessage: (callback: (data: MainMessage) => void) => () => void;

    /** Electron framework version */
    electronVersion: string;

    /** Node.js runtime version */
    nodeVersion: string;

    /** Chrome/Chromium version */
    chromeVersion: string;

    /** Current platform ('win32', 'darwin', 'linux') */
    platform: string;
}

/** Application information */
export interface AppInfo {
    version: string;
    name: string;
    electronVersion: string;
    chromeVersion: string;
    nodeVersion: string;
    v8Version: string;
    platform: string;
    arch: string;
    userDataPath: string;
}

/** Save dialog configuration */
export interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
}

/** Open dialog configuration */
export interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

/** File filter for dialogs */
export interface FileFilter {
    name: string;
    extensions: string[];
}

/** Data for write-file IPC call */
export interface WriteFileData {
    filePath: string;
    content: string;
    encoding?: string;
}

/** Result from write-file IPC call */
export interface WriteFileResult {
    success: boolean;
    error?: string;
}

/** Message from main process to renderer */
export interface MainMessage {
    action: string;
    data?: unknown;
}

/**
 * Extends the global Window interface to include the electron API.
 * This allows `window.electron` to be used with type safety.
 */
declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
