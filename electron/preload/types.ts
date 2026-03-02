export interface ElectronAPI {

    downloadPlatform: (platform: string) => void;


    openSettings: () => void;


    openExternalLink: (url: string) => void;


    copyToClipboard: (text: string) => void;


    getAppVersion: () => Promise<string>;


    getAppInfo: () => Promise<AppInfo>;


    getSystemTheme: () => Promise<string>;


    minimizeWindow: () => void;


    maximizeWindow: () => void;


    closeWindow: () => void;


    isWindowMaximized: () => Promise<boolean>;


    showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>;


    showOpenDialog: (options: OpenDialogOptions) => Promise<string[]>;


    writeFile: (data: WriteFileData) => Promise<WriteFileResult>;


    onMainMessage: (callback: (data: MainMessage) => void) => () => void;


    electronVersion: string;


    nodeVersion: string;


    chromeVersion: string;


    platform: string;
}


export interface AppInfo {
    version: string;
    name: string;
    electronVersion: string;
    chromeVersion: string;
    nodeVersion: string;
    v8Version: string;
    platform: string;
    arch: string;
    userDataPath: string;
}


export interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
}


export interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}


export interface FileFilter {
    name: string;
    extensions: string[];
}


export interface WriteFileData {
    filePath: string;
    content: string;
    encoding?: string;
}


export interface WriteFileResult {
    success: boolean;
    error?: string;
}


export interface MainMessage {
    action: string;
    data?: unknown;
}


declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
