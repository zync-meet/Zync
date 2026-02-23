/**
 * =============================================================================
 * Download Manager Service — ZYNC Desktop
 * =============================================================================
 *
 * Manages file downloads initiated from the renderer process, providing
 * progress tracking, pause/resume, and download history.
 *
 * @module electron/services/download-manager
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow } from 'electron';
/** State of a download */
export type DownloadState = 'pending' | 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted';
/** Download progress information */
export interface DownloadProgress {
    /** Unique download ID */
    id: string;
    /** URL being downloaded */
    url: string;
    /** Filename */
    filename: string;
    /** Save path on disk */
    savePath: string;
    /** Current state */
    state: DownloadState;
    /** Bytes received so far */
    receivedBytes: number;
    /** Total bytes (0 if unknown) */
    totalBytes: number;
    /** Download speed in bytes per second */
    speed: number;
    /** Estimated time remaining in seconds */
    eta: number;
    /** Progress percentage (0-100) */
    percent: number;
    /** Whether the download can be resumed */
    canResume: boolean;
    /** Start time ISO string */
    startedAt: string;
    /** Completion time ISO string (null if in progress) */
    completedAt: string | null;
    /** MIME type */
    mimeType: string;
}
/** Download event callback */
export type DownloadEventCallback = (download: DownloadProgress) => void;
/** Download manager configuration */
export interface DownloadManagerConfig {
    /** Default download directory */
    defaultDirectory?: string;
    /** Whether to show save dialog for each download */
    showSaveDialog?: boolean;
    /** Maximum concurrent downloads */
    maxConcurrent?: number;
    /** Whether to overwrite existing files */
    overwrite?: boolean;
}
/**
 * DownloadManagerService provides centralized download management for the
 * application, with progress tracking, pause/resume support, and event
 * callbacks.
 *
 * @example
 * ```typescript
 * const dm = new DownloadManagerService(mainWindow, {
 *   defaultDirectory: app.getPath('downloads'),
 *   showSaveDialog: true,
 * });
 *
 * dm.onProgress((info) => {
 *   console.log(`${info.filename}: ${info.percent}%`);
 * });
 *
 * dm.initialize();
 * ```
 */
export declare class DownloadManagerService {
    /** The parent browser window */
    private window;
    /** Configuration */
    private config;
    /** Active downloads mapped by ID */
    private downloads;
    /** Completed download history */
    private history;
    /** Progress callbacks */
    private progressCallbacks;
    /** Completion callbacks */
    private completionCallbacks;
    /** Counter for generating unique IDs */
    private idCounter;
    /** Logger instance */
    private log;
    /**
     * Create a new DownloadManagerService.
     *
     * @param {BrowserWindow} window - Parent window for dialogs
     * @param {DownloadManagerConfig} [config] - Configuration
     */
    constructor(window: BrowserWindow, config?: DownloadManagerConfig);
    /**
     * Initialize the download manager by attaching to the session's
     * will-download event.
     */
    initialize(): void;
    /**
     * Handle a new download from the browser session.
     *
     * @param {DownloadItem} item - The Electron DownloadItem
     */
    private handleNewDownload;
    /**
     * Pause a download.
     *
     * @param {string} id - Download ID
     * @returns {boolean} True if paused successfully
     */
    pause(id: string): boolean;
    /**
     * Resume a paused download.
     *
     * @param {string} id - Download ID
     * @returns {boolean} True if resumed successfully
     */
    resume(id: string): boolean;
    /**
     * Cancel a download.
     *
     * @param {string} id - Download ID
     * @returns {boolean} True if cancelled
     */
    cancel(id: string): boolean;
    /**
     * Cancel all active downloads.
     */
    cancelAll(): void;
    /**
     * Get all active downloads.
     *
     * @returns {DownloadProgress[]} Active download list
     */
    getActive(): DownloadProgress[];
    /**
     * Get download history.
     *
     * @param {number} [limit=50] - Maximum number of items
     * @returns {DownloadProgress[]} Recent download history
     */
    getHistory(limit?: number): DownloadProgress[];
    /**
     * Clear download history.
     */
    clearHistory(): void;
    /**
     * Register a callback for download progress updates.
     *
     * @param {DownloadEventCallback} callback - Callback
     * @returns {() => void} Unsubscribe function
     */
    onProgress(callback: DownloadEventCallback): () => void;
    /**
     * Register a callback for download completions.
     *
     * @param {DownloadEventCallback} callback - Callback
     * @returns {() => void} Unsubscribe function
     */
    onCompletion(callback: DownloadEventCallback): () => void;
    private emitProgress;
    private emitCompletion;
    /**
     * Dispose of the download manager.
     */
    dispose(): void;
}
