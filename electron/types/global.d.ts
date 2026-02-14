/**
 * =============================================================================
 * Global Type Declarations — ZYNC Desktop Application
 * =============================================================================
 *
 * Ambient type declarations for the `window` object in renderer processes.
 * These types describe the API surface exposed by the preload script via
 * Electron's contextBridge.
 *
 * The preload script exposes two objects on `window`:
 * 1. `window.electron` — IPC and app control methods
 * 2. `window.versions`  — Runtime version information
 *
 * @module electron/types/global.d.ts
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * The Electron API exposed to the renderer via contextBridge.
 *
 * This is the primary interface for renderer-to-main communication.
 * All methods are safe to call from the renderer as they go through
 * the IPC channel system with proper serialization.
 */
interface ElectronAPI {
    /**
     * IPC Renderer proxy for invoking main-process handlers.
     *
     * Provides typed `invoke`, `send`, and `on` methods for
     * bidirectional communication.
     */
    ipcRenderer: {
        /**
         * Sends an asynchronous message to the main process and waits
         * for a response.
         *
         * @param {string} channel - The IPC channel name
         * @param {...unknown} args - Arguments to pass
         * @returns {Promise<any>} The response from the main process
         */
        invoke(channel: string, ...args: unknown[]): Promise<unknown>;

        /**
         * Sends a one-way message to the main process.
         *
         * @param {string} channel - The IPC channel name
         * @param {...unknown} args - Arguments to pass
         */
        send(channel: string, ...args: unknown[]): void;

        /**
         * Registers a listener for messages from the main process.
         *
         * @param {string} channel - The IPC channel to listen on
         * @param {Function} listener - The callback function
         * @returns {() => void} A function to remove the listener
         */
        on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): () => void;

        /**
         * Registers a one-time listener for messages from the main process.
         *
         * @param {string} channel - The IPC channel to listen on
         * @param {Function} listener - The callback function
         */
        once(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;

        /**
         * Removes a specific listener from a channel.
         *
         * @param {string} channel - The IPC channel
         * @param {Function} listener - The listener to remove
         */
        removeListener(channel: string, listener: (...args: unknown[]) => void): void;

        /**
         * Removes all listeners for a specific channel.
         *
         * @param {string} channel - The IPC channel
         */
        removeAllListeners(channel: string): void;
    };

    /**
     * Opens the platform download page in the external browser.
     *
     * @param {string} platform - Platform identifier ('win' | 'mac' | 'linux')
     */
    downloadPlatform(platform: string): void;

    /**
     * Opens the Settings window.
     */
    openSettings(): void;

    /**
     * Window control methods for frameless window management.
     */
    window: {
        /** Minimizes the current window */
        minimize(): void;
        /** Maximizes or restores the current window */
        maximize(): void;
        /** Closes the current window */
        close(): void;
        /** Checks if the window is maximized */
        isMaximized(): Promise<boolean>;
    };

    /**
     * File dialog methods.
     */
    dialog: {
        /**
         * Opens a save dialog.
         *
         * @param {SaveDialogOptions} options - Dialog options
         * @returns {Promise<{ filePath?: string; canceled: boolean }>}
         */
        showSaveDialog(options: SaveDialogOptions): Promise<{
            filePath?: string;
            canceled: boolean;
        }>;

        /**
         * Opens a file/folder selection dialog.
         *
         * @param {OpenDialogOptions} options - Dialog options
         * @returns {Promise<{ filePaths: string[]; canceled: boolean }>}
         */
        showOpenDialog(options: OpenDialogOptions): Promise<{
            filePaths: string[];
            canceled: boolean;
        }>;
    };

    /**
     * File system write operations (limited for security).
     */
    writeFile(data: {
        filePath: string;
        content: string | Buffer;
    }): Promise<{ success: boolean; error?: string }>;

    /**
     * Gets application information.
     */
    getAppInfo(): Promise<{
        name: string;
        version: string;
        platform: string;
        arch: string;
        isPackaged: boolean;
        userDataPath: string;
    }>;

    /**
     * Platform information.
     */
    platform: string;

    /**
     * Whether the app is running in development mode.
     */
    isDev: boolean;
}

/**
 * Options for the save dialog.
 */
interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    filters?: Array<{
        name: string;
        extensions: string[];
    }>;
}

/**
 * Options for the open dialog.
 */
interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
    filters?: Array<{
        name: string;
        extensions: string[];
    }>;
}

/**
 * Version information exposed by the preload script.
 */
interface VersionInfo {
    /** Node.js version */
    node: string;
    /** Chrome version */
    chrome: string;
    /** Electron version */
    electron: string;
    /** V8 version */
    v8: string;
    /** ZYNC app version */
    app: string;
}

/**
 * Augment the global Window interface to include our exposed APIs.
 */
declare global {
    interface Window {
        /**
         * Electron API exposed by the preload script via contextBridge.
         *
         * Available in all renderer processes (main window, settings, etc.)
         */
        electron: ElectronAPI;

        /**
         * Runtime version information.
         *
         * Contains version strings for Node.js, Chrome, Electron, V8,
         * and the ZYNC application itself.
         */
        versions: VersionInfo;
    }
}

export {};
