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
import { BrowserWindow } from 'electron';
/**
 * Manages the application's automatic update lifecycle.
 */
export declare class AutoUpdaterService {
    private mainWindow;
    private checkInterval;
    private initialCheckTimeout;
    private isDownloading;
    private isAutoCheckEnabled;
    private pendingUpdate;
    constructor(mainWindow: BrowserWindow | null);
    /** Start periodic update checking */
    initialize(): void;
    /** Check for available updates */
    checkForUpdates(): Promise<void>;
    /** Handle update-available event */
    private onUpdateAvailable;
    /** Send download progress to renderer */
    private onDownloadProgress;
    /** Handle update-downloaded event */
    private onUpdateDownloaded;
    setAutoCheckEnabled(enabled: boolean): void;
    setMainWindow(window: BrowserWindow | null): void;
    /** Clean up timers */
    dispose(): void;
}
