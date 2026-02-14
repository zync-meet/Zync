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

import { BrowserWindow, DownloadItem, session, dialog, app } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';

// =============================================================================
// Types
// =============================================================================

/** State of a download */
export type DownloadState =
    | 'pending'
    | 'progressing'
    | 'paused'
    | 'completed'
    | 'cancelled'
    | 'interrupted';

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

// =============================================================================
// Download Manager
// =============================================================================

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
export class DownloadManagerService {
    /** The parent browser window */
    private window: BrowserWindow;

    /** Configuration */
    private config: Required<DownloadManagerConfig>;

    /** Active downloads mapped by ID */
    private downloads: Map<string, { item: DownloadItem; progress: DownloadProgress }> = new Map();

    /** Completed download history */
    private history: DownloadProgress[] = [];

    /** Progress callbacks */
    private progressCallbacks: Set<DownloadEventCallback> = new Set();

    /** Completion callbacks */
    private completionCallbacks: Set<DownloadEventCallback> = new Set();

    /** Counter for generating unique IDs */
    private idCounter = 0;

    /** Logger instance */
    private log = logger;

    /**
     * Create a new DownloadManagerService.
     *
     * @param {BrowserWindow} window - Parent window for dialogs
     * @param {DownloadManagerConfig} [config] - Configuration
     */
    constructor(window: BrowserWindow, config: DownloadManagerConfig = {}) {
        this.window = window;
        this.config = {
            defaultDirectory: config.defaultDirectory ?? app.getPath('downloads'),
            showSaveDialog: config.showSaveDialog ?? true,
            maxConcurrent: config.maxConcurrent ?? 5,
            overwrite: config.overwrite ?? false,
        };
    }

    // =========================================================================
    // Initialization
    // =========================================================================

    /**
     * Initialize the download manager by attaching to the session's
     * will-download event.
     */
    initialize(): void {
        const ses = this.window.webContents.session || session.defaultSession;

        ses.on('will-download', (_event, item) => {
            this.handleNewDownload(item);
        });

        this.log.info('Download manager initialized');
    }

    // =========================================================================
    // Download Handling
    // =========================================================================

    /**
     * Handle a new download from the browser session.
     *
     * @param {DownloadItem} item - The Electron DownloadItem
     */
    private handleNewDownload(item: DownloadItem): void {
        const id = `dl_${++this.idCounter}_${Date.now()}`;
        const filename = item.getFilename() || 'download';
        const savePath = path.join(this.config.defaultDirectory, filename);

        // Set save path
        if (!this.config.showSaveDialog) {
            item.setSavePath(savePath);
        }

        const progress: DownloadProgress = {
            id,
            url: item.getURL(),
            filename,
            savePath: item.getSavePath() || savePath,
            state: 'pending',
            receivedBytes: 0,
            totalBytes: item.getTotalBytes(),
            speed: 0,
            eta: 0,
            percent: 0,
            canResume: item.canResume(),
            startedAt: new Date().toISOString(),
            completedAt: null,
            mimeType: item.getMimeType(),
        };

        this.downloads.set(id, { item, progress });

        let lastReceivedBytes = 0;
        let lastTimestamp = Date.now();

        // Track progress
        item.on('updated', (_event, state) => {
            const entry = this.downloads.get(id);
            if (!entry) return;

            const now = Date.now();
            const elapsed = (now - lastTimestamp) / 1000;
            const receivedBytes = item.getReceivedBytes();
            const totalBytes = item.getTotalBytes();

            // Calculate speed
            const bytesThisInterval = receivedBytes - lastReceivedBytes;
            const speed = elapsed > 0 ? bytesThisInterval / elapsed : 0;

            // Calculate ETA
            const remainingBytes = totalBytes > 0 ? totalBytes - receivedBytes : 0;
            const eta = speed > 0 ? remainingBytes / speed : 0;

            // Calculate percentage
            const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0;

            entry.progress = {
                ...entry.progress,
                state: state === 'progressing' ? 'progressing' : 'paused',
                receivedBytes,
                totalBytes,
                speed: Math.round(speed),
                eta: Math.round(eta),
                percent,
                canResume: item.canResume(),
                savePath: item.getSavePath() || savePath,
            };

            lastReceivedBytes = receivedBytes;
            lastTimestamp = now;

            this.emitProgress(entry.progress);
        });

        // Handle completion
        item.once('done', (_event, state) => {
            const entry = this.downloads.get(id);
            if (!entry) return;

            const finalState: DownloadState =
                state === 'completed' ? 'completed' :
                state === 'cancelled' ? 'cancelled' :
                'interrupted';

            entry.progress = {
                ...entry.progress,
                state: finalState,
                completedAt: new Date().toISOString(),
                receivedBytes: item.getReceivedBytes(),
                percent: finalState === 'completed' ? 100 : entry.progress.percent,
                speed: 0,
                eta: 0,
            };

            // Move to history
            this.history.push(entry.progress);
            this.downloads.delete(id);

            this.emitCompletion(entry.progress);
            this.log.info(`Download ${finalState}: ${filename}`);
        });

        this.log.info(`Download started: ${filename} (${id})`);
    }

    // =========================================================================
    // Download Control
    // =========================================================================

    /**
     * Pause a download.
     *
     * @param {string} id - Download ID
     * @returns {boolean} True if paused successfully
     */
    pause(id: string): boolean {
        const entry = this.downloads.get(id);
        if (entry && entry.progress.state === 'progressing') {
            entry.item.pause();
            return true;
        }
        return false;
    }

    /**
     * Resume a paused download.
     *
     * @param {string} id - Download ID
     * @returns {boolean} True if resumed successfully
     */
    resume(id: string): boolean {
        const entry = this.downloads.get(id);
        if (entry && entry.item.canResume()) {
            entry.item.resume();
            return true;
        }
        return false;
    }

    /**
     * Cancel a download.
     *
     * @param {string} id - Download ID
     * @returns {boolean} True if cancelled
     */
    cancel(id: string): boolean {
        const entry = this.downloads.get(id);
        if (entry) {
            entry.item.cancel();
            return true;
        }
        return false;
    }

    /**
     * Cancel all active downloads.
     */
    cancelAll(): void {
        for (const [id] of this.downloads) {
            this.cancel(id);
        }
    }

    // =========================================================================
    // Query
    // =========================================================================

    /**
     * Get all active downloads.
     *
     * @returns {DownloadProgress[]} Active download list
     */
    getActive(): DownloadProgress[] {
        return Array.from(this.downloads.values()).map((e) => ({ ...e.progress }));
    }

    /**
     * Get download history.
     *
     * @param {number} [limit=50] - Maximum number of items
     * @returns {DownloadProgress[]} Recent download history
     */
    getHistory(limit = 50): DownloadProgress[] {
        return this.history.slice(-limit).reverse();
    }

    /**
     * Clear download history.
     */
    clearHistory(): void {
        this.history = [];
    }

    // =========================================================================
    // Events
    // =========================================================================

    /**
     * Register a callback for download progress updates.
     *
     * @param {DownloadEventCallback} callback - Callback
     * @returns {() => void} Unsubscribe function
     */
    onProgress(callback: DownloadEventCallback): () => void {
        this.progressCallbacks.add(callback);
        return () => this.progressCallbacks.delete(callback);
    }

    /**
     * Register a callback for download completions.
     *
     * @param {DownloadEventCallback} callback - Callback
     * @returns {() => void} Unsubscribe function
     */
    onCompletion(callback: DownloadEventCallback): () => void {
        this.completionCallbacks.add(callback);
        return () => this.completionCallbacks.delete(callback);
    }

    private emitProgress(info: DownloadProgress): void {
        for (const cb of this.progressCallbacks) {
            try { cb(info); } catch (e) { this.log.error('Download progress callback error:', e); }
        }
    }

    private emitCompletion(info: DownloadProgress): void {
        for (const cb of this.completionCallbacks) {
            try { cb(info); } catch (e) { this.log.error('Download completion callback error:', e); }
        }
    }

    // =========================================================================
    // Cleanup
    // =========================================================================

    /**
     * Dispose of the download manager.
     */
    dispose(): void {
        this.cancelAll();
        this.progressCallbacks.clear();
        this.completionCallbacks.clear();
        this.downloads.clear();
        this.log.info('Download manager disposed');
    }
}
