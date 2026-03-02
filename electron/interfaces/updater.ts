export interface UpdateCheckResult {

    updateAvailable: boolean;


    updateInfo?: UpdateReleaseInfo;


    cancellationToken?: unknown;
}


export interface UpdateReleaseInfo {

    version: string;


    releaseNotes?: string | ReleaseNoteEntry[] | null;


    releaseDate: string;


    releaseName?: string | null;


    sha512?: string;


    minimumSystemVersion?: string;


    size?: number;


    isPrerelease?: boolean;
}


export interface ReleaseNoteEntry {

    version: string;


    note: string;
}


export interface DownloadProgressInfo {

    bytesPerSecond: number;


    percent: number;


    transferred: number;


    total: number;


    estimatedTimeRemaining?: number;
}


export enum UpdateState {

    IDLE = 'idle',


    CHECKING = 'checking',


    AVAILABLE = 'available',


    NOT_AVAILABLE = 'not-available',


    DOWNLOADING = 'downloading',


    DOWNLOADED = 'downloaded',


    ERROR = 'error',
}


export interface UpdateStatusSnapshot {

    state: UpdateState;


    version?: string;


    progress?: DownloadProgressInfo;


    error?: UpdateError;


    lastChanged: string;


    lastChecked?: string;
}


export interface UpdateError {

    message: string;


    code?: string;


    stack?: string;
}


export interface UpdateConfig {

    owner: string;


    repo: string;


    allowPrerelease: boolean;


    autoDownload: boolean;


    autoInstallOnAppQuit: boolean;


    checkInterval: number;


    initialDelay: number;
}


export const DEFAULT_UPDATE_CONFIG: UpdateConfig = {
    owner: 'ChitkulLakshya',
    repo: 'Zync',
    allowPrerelease: false,
    autoDownload: false,
    autoInstallOnAppQuit: true,
    checkInterval: 4 * 60 * 60 * 1000,
    initialDelay: 10 * 1000,
};
