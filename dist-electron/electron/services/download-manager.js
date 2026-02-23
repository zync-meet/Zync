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
import { session, app } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';
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
    window;
    /** Configuration */
    config;
    /** Active downloads mapped by ID */
    downloads = new Map();
    /** Completed download history */
    history = [];
    /** Progress callbacks */
    progressCallbacks = new Set();
    /** Completion callbacks */
    completionCallbacks = new Set();
    /** Counter for generating unique IDs */
    idCounter = 0;
    /** Logger instance */
    log = logger;
    /**
     * Create a new DownloadManagerService.
     *
     * @param {BrowserWindow} window - Parent window for dialogs
     * @param {DownloadManagerConfig} [config] - Configuration
     */
    constructor(window, config = {}) {
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
    initialize() {
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
    handleNewDownload(item) {
        const id = `dl_${++this.idCounter}_${Date.now()}`;
        const filename = item.getFilename() || 'download';
        const savePath = path.join(this.config.defaultDirectory, filename);
        // Set save path
        if (!this.config.showSaveDialog) {
            item.setSavePath(savePath);
        }
        const progress = {
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
            if (!entry)
                return;
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
            if (!entry)
                return;
            const finalState = state === 'completed' ? 'completed' :
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
    pause(id) {
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
    resume(id) {
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
    cancel(id) {
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
    cancelAll() {
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
    getActive() {
        return Array.from(this.downloads.values()).map((e) => ({ ...e.progress }));
    }
    /**
     * Get download history.
     *
     * @param {number} [limit=50] - Maximum number of items
     * @returns {DownloadProgress[]} Recent download history
     */
    getHistory(limit = 50) {
        return this.history.slice(-limit).reverse();
    }
    /**
     * Clear download history.
     */
    clearHistory() {
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
    onProgress(callback) {
        this.progressCallbacks.add(callback);
        return () => this.progressCallbacks.delete(callback);
    }
    /**
     * Register a callback for download completions.
     *
     * @param {DownloadEventCallback} callback - Callback
     * @returns {() => void} Unsubscribe function
     */
    onCompletion(callback) {
        this.completionCallbacks.add(callback);
        return () => this.completionCallbacks.delete(callback);
    }
    emitProgress(info) {
        for (const cb of this.progressCallbacks) {
            try {
                cb(info);
            }
            catch (e) {
                this.log.error('Download progress callback error:', e);
            }
        }
    }
    emitCompletion(info) {
        for (const cb of this.completionCallbacks) {
            try {
                cb(info);
            }
            catch (e) {
                this.log.error('Download completion callback error:', e);
            }
        }
    }
    // =========================================================================
    // Cleanup
    // =========================================================================
    /**
     * Dispose of the download manager.
     */
    dispose() {
        this.cancelAll();
        this.progressCallbacks.clear();
        this.completionCallbacks.clear();
        this.downloads.clear();
        this.log.info('Download manager disposed');
    }
}
//# sourceMappingURL=download-manager.js.map