import { session, app } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';
export class DownloadManagerService {
    window;
    config;
    downloads = new Map();
    history = [];
    progressCallbacks = new Set();
    completionCallbacks = new Set();
    idCounter = 0;
    log = logger;
    constructor(window, config = {}) {
        this.window = window;
        this.config = {
            defaultDirectory: config.defaultDirectory ?? app.getPath('downloads'),
            showSaveDialog: config.showSaveDialog ?? true,
            maxConcurrent: config.maxConcurrent ?? 5,
            overwrite: config.overwrite ?? false,
        };
    }
    initialize() {
        const ses = this.window.webContents.session || session.defaultSession;
        ses.on('will-download', (_event, item) => {
            this.handleNewDownload(item);
        });
        this.log.info('Download manager initialized');
    }
    handleNewDownload(item) {
        const id = `dl_${++this.idCounter}_${Date.now()}`;
        const filename = item.getFilename() || 'download';
        const savePath = path.join(this.config.defaultDirectory, filename);
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
        item.on('updated', (_event, state) => {
            const entry = this.downloads.get(id);
            if (!entry)
                return;
            const now = Date.now();
            const elapsed = (now - lastTimestamp) / 1000;
            const receivedBytes = item.getReceivedBytes();
            const totalBytes = item.getTotalBytes();
            const bytesThisInterval = receivedBytes - lastReceivedBytes;
            const speed = elapsed > 0 ? bytesThisInterval / elapsed : 0;
            const remainingBytes = totalBytes > 0 ? totalBytes - receivedBytes : 0;
            const eta = speed > 0 ? remainingBytes / speed : 0;
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
            this.history.push(entry.progress);
            this.downloads.delete(id);
            this.emitCompletion(entry.progress);
            this.log.info(`Download ${finalState}: ${filename}`);
        });
        this.log.info(`Download started: ${filename} (${id})`);
    }
    pause(id) {
        const entry = this.downloads.get(id);
        if (entry && entry.progress.state === 'progressing') {
            entry.item.pause();
            return true;
        }
        return false;
    }
    resume(id) {
        const entry = this.downloads.get(id);
        if (entry && entry.item.canResume()) {
            entry.item.resume();
            return true;
        }
        return false;
    }
    cancel(id) {
        const entry = this.downloads.get(id);
        if (entry) {
            entry.item.cancel();
            return true;
        }
        return false;
    }
    cancelAll() {
        for (const [id] of this.downloads) {
            this.cancel(id);
        }
    }
    getActive() {
        return Array.from(this.downloads.values()).map((e) => ({ ...e.progress }));
    }
    getHistory(limit = 50) {
        return this.history.slice(-limit).reverse();
    }
    clearHistory() {
        this.history = [];
    }
    onProgress(callback) {
        this.progressCallbacks.add(callback);
        return () => this.progressCallbacks.delete(callback);
    }
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
    dispose() {
        this.cancelAll();
        this.progressCallbacks.clear();
        this.completionCallbacks.clear();
        this.downloads.clear();
        this.log.info('Download manager disposed');
    }
}
//# sourceMappingURL=download-manager.js.map