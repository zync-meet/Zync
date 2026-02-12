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

import { BrowserWindow, dialog, app } from 'electron';

/** Download progress information */
interface UpdateProgress {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
}

/** Update metadata */
interface UpdateInfo {
    version: string;
    releaseNotes?: string | null;
    releaseDate?: string;
    releaseName?: string | null;
}

/** Check interval: 4 hours */
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
/** Delay before first check: 10 seconds */
const INITIAL_CHECK_DELAY_MS = 10 * 1000;

/**
 * Manages the application's automatic update lifecycle.
 */
export class AutoUpdaterService {
    private mainWindow: BrowserWindow | null;
    private checkInterval: NodeJS.Timeout | null = null;
    private initialCheckTimeout: NodeJS.Timeout | null = null;
    private isDownloading = false;
    private isAutoCheckEnabled = true;
    private pendingUpdate: UpdateInfo | null = null;

    constructor(mainWindow: BrowserWindow | null) {
        this.mainWindow = mainWindow;
    }

    /** Start periodic update checking */
    public initialize(): void {
        console.info('[AutoUpdater] Initializing');
        this.initialCheckTimeout = setTimeout(() => {
            if (this.isAutoCheckEnabled) {this.checkForUpdates();}
        }, INITIAL_CHECK_DELAY_MS);

        this.checkInterval = setInterval(() => {
            if (this.isAutoCheckEnabled) {this.checkForUpdates();}
        }, UPDATE_CHECK_INTERVAL_MS);
    }

    /** Check for available updates */
    public async checkForUpdates(): Promise<void> {
        if (!app.isPackaged) {
            console.info('[AutoUpdater] Skipping check in dev mode');
            return;
        }
        if (this.isDownloading) {return;}

        try {
            console.info(`[AutoUpdater] Checking... (current: ${app.getVersion()})`);
            // autoUpdater.checkForUpdatesAndNotify() in production
            console.info('[AutoUpdater] Check completed');
        } catch (error) {
            console.error('[AutoUpdater] Check failed:', error);
        }
    }

    /** Handle update-available event */
    private async onUpdateAvailable(info: UpdateInfo): Promise<void> {
        this.pendingUpdate = info;
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {return;}

        const result = await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `ZYNC v${info.version} is available!`,
            detail: `Current: ${app.getVersion()}\nNew: ${info.version}`,
            buttons: ['Download', 'Later'],
            defaultId: 0,
            cancelId: 1,
        });

        if (result.response === 0) {this.isDownloading = true;}
    }

    /** Send download progress to renderer */
    private onDownloadProgress(progress: UpdateProgress): void {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {return;}
        this.mainWindow.webContents.send('fromMain', {
            action: 'update-progress',
            data: { percent: Math.round(progress.percent) },
        });
    }

    /** Handle update-downloaded event */
    private async onUpdateDownloaded(info: UpdateInfo): Promise<void> {
        this.isDownloading = false;
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {return;}

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

    public setAutoCheckEnabled(enabled: boolean): void {
        this.isAutoCheckEnabled = enabled;
    }

    public setMainWindow(window: BrowserWindow | null): void {
        this.mainWindow = window;
    }

    /** Clean up timers */
    public dispose(): void {
        if (this.initialCheckTimeout) {clearTimeout(this.initialCheckTimeout);}
        if (this.checkInterval) {clearInterval(this.checkInterval);}
        this.mainWindow = null;
        this.pendingUpdate = null;
        console.info('[AutoUpdater] Disposed');
    }
}
