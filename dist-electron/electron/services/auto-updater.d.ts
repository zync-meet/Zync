import { BrowserWindow } from 'electron';
export declare class AutoUpdaterService {
    private mainWindow;
    private checkInterval;
    private initialCheckTimeout;
    private isDownloading;
    private isAutoCheckEnabled;
    private pendingUpdate;
    constructor(mainWindow: BrowserWindow | null);
    initialize(): void;
    checkForUpdates(): Promise<void>;
    private onUpdateAvailable;
    private onDownloadProgress;
    private onUpdateDownloaded;
    setAutoCheckEnabled(enabled: boolean): void;
    setMainWindow(window: BrowserWindow | null): void;
    dispose(): void;
}
