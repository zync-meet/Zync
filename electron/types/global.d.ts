interface ElectronAPI {

    ipcRenderer: {

        invoke(channel: string, ...args: unknown[]): Promise<unknown>;


        send(channel: string, ...args: unknown[]): void;


        on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): () => void;


        once(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;


        removeListener(channel: string, listener: (...args: unknown[]) => void): void;


        removeAllListeners(channel: string): void;
    };


    downloadPlatform(platform: string): void;


    openSettings(): void;


    window: {

        minimize(): void;

        maximize(): void;

        close(): void;

        isMaximized(): Promise<boolean>;
    };


    dialog: {

        showSaveDialog(options: SaveDialogOptions): Promise<{
            filePath?: string;
            canceled: boolean;
        }>;


        showOpenDialog(options: OpenDialogOptions): Promise<{
            filePaths: string[];
            canceled: boolean;
        }>;
    };


    writeFile(data: {
        filePath: string;
        content: string | Buffer;
    }): Promise<{ success: boolean; error?: string }>;


    getAppInfo(): Promise<{
        name: string;
        version: string;
        platform: string;
        arch: string;
        isPackaged: boolean;
        userDataPath: string;
    }>;


    platform: string;


    isDev: boolean;
}


interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    filters?: Array<{
        name: string;
        extensions: string[];
    }>;
}


interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
    filters?: Array<{
        name: string;
        extensions: string[];
    }>;
}


interface VersionInfo {

    node: string;

    chrome: string;

    electron: string;

    v8: string;

    app: string;
}


declare global {
    interface Window {

        electron: ElectronAPI;


        versions: VersionInfo;
    }
}

export {};
