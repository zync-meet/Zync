import { BrowserWindow, dialog, app } from 'electron';


interface UpdateProgress {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
}


interface UpdateInfo {
    version: string;
    releaseNotes?: string | null;
    releaseDate?: string;
    releaseName?: string | null;
}


const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

const INITIAL_CHECK_DELAY_MS = 10 * 1000;


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


    public initialize(): void {
        console.info('[AutoUpdater] Initializing');
        this.initialCheckTimeout = setTimeout(() => {
            if (this.isAutoCheckEnabled) {this.checkForUpdates();}
        }, INITIAL_CHECK_DELAY_MS);

        this.checkInterval = setInterval(() => {
            if (this.isAutoCheckEnabled) {this.checkForUpdates();}
        }, UPDATE_CHECK_INTERVAL_MS);
    }


    public async checkForUpdates(): Promise<void> {
        if (!app.isPackaged) {
            console.info('[AutoUpdater] Skipping check in dev mode');
            return;
        }
        if (this.isDownloading) {return;}

        try {
            console.info(`[AutoUpdater] Checking... (current: ${app.getVersion()})`);

            console.info('[AutoUpdater] Check completed');
        } catch (error) {
            console.error('[AutoUpdater] Check failed:', error);
        }
    }


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


    private onDownloadProgress(progress: UpdateProgress): void {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {return;}
        this.mainWindow.webContents.send('fromMain', {
            action: 'update-progress',
            data: { percent: Math.round(progress.percent) },
        });
    }


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
            // TODO: Materialize the restart and install logic here
            // this.autoUpdater.quitAndInstall();
        }
    }

    public setAutoCheckEnabled(enabled: boolean): void {
        this.isAutoCheckEnabled = enabled;
    }

    public setMainWindow(window: BrowserWindow | null): void {
        this.mainWindow = window;
    }


    public dispose(): void {
        if (this.initialCheckTimeout) {clearTimeout(this.initialCheckTimeout);}
        if (this.checkInterval) {clearInterval(this.checkInterval);}
        this.mainWindow = null;
        this.pendingUpdate = null;
        console.info('[AutoUpdater] Disposed');
    }
}
