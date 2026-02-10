/**
 * =============================================================================
 * Auto-Updater Service — ZYNC Desktop Application
 * =============================================================================
 *
 * Manages automatic updates using electron-updater and GitHub Releases.
 *
 * @module electron/services/auto-updater
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { dialog, app } from 'electron';
/** Check interval: 4 hours */
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
/** Delay before first check: 10 seconds */
const INITIAL_CHECK_DELAY_MS = 10 * 1000;
/**
 * Manages the application's automatic update lifecycle.
 */
export class AutoUpdaterService {
    mainWindow;
    checkInterval = null;
    initialCheckTimeout = null;
    isDownloading = false;
    isAutoCheckEnabled = true;
    pendingUpdate = null;
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }
    /** Start periodic update checking */
    initialize() {
        console.info('[AutoUpdater] Initializing');
        this.initialCheckTimeout = setTimeout(() => {
            if (this.isAutoCheckEnabled)
                this.checkForUpdates();
        }, INITIAL_CHECK_DELAY_MS);
        this.checkInterval = setInterval(() => {
            if (this.isAutoCheckEnabled)
                this.checkForUpdates();
        }, UPDATE_CHECK_INTERVAL_MS);
    }
    /** Check for available updates */
    async checkForUpdates() {
        if (!app.isPackaged) {
            console.info('[AutoUpdater] Skipping check in dev mode');
            return;
        }
        if (this.isDownloading)
            return;
        try {
            console.info(`[AutoUpdater] Checking... (current: ${app.getVersion()})`);
            // autoUpdater.checkForUpdatesAndNotify() in production
            console.info('[AutoUpdater] Check completed');
        }
        catch (error) {
            console.error('[AutoUpdater] Check failed:', error);
        }
    }
    /** Handle update-available event */
    async onUpdateAvailable(info) {
        this.pendingUpdate = info;
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        const result = await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `ZYNC v${info.version} is available!`,
            detail: `Current: ${app.getVersion()}\nNew: ${info.version}`,
            buttons: ['Download', 'Later'],
            defaultId: 0,
            cancelId: 1,
        });
        if (result.response === 0)
            this.isDownloading = true;
    }
    /** Send download progress to renderer */
    onDownloadProgress(progress) {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        this.mainWindow.webContents.send('fromMain', {
            action: 'update-progress',
            data: { percent: Math.round(progress.percent) },
        });
    }
    /** Handle update-downloaded event */
    async onUpdateDownloaded(info) {
        this.isDownloading = false;
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        const result = await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: `ZYNC v${info.version} is ready to install.`,
            buttons: ['Restart Now', 'Later'],
            defaultId: 0,
            cancelId: 1,
        });
        if (result.response === 0) {
            // autoUpdater.quitAndInstall()
        }
    }
    setAutoCheckEnabled(enabled) {
        this.isAutoCheckEnabled = enabled;
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    /** Clean up timers */
    dispose() {
        if (this.initialCheckTimeout)
            clearTimeout(this.initialCheckTimeout);
        if (this.checkInterval)
            clearInterval(this.checkInterval);
        this.mainWindow = null;
        this.pendingUpdate = null;
        console.info('[AutoUpdater] Disposed');
    }
}
//# sourceMappingURL=auto-updater.js.map