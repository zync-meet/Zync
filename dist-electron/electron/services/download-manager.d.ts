import { BrowserWindow } from 'electron';
export type DownloadState = 'pending' | 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted';
export interface DownloadProgress {
    id: string;
    url: string;
    filename: string;
    savePath: string;
    state: DownloadState;
    receivedBytes: number;
    totalBytes: number;
    speed: number;
    eta: number;
    percent: number;
    canResume: boolean;
    startedAt: string;
    completedAt: string | null;
    mimeType: string;
}
export type DownloadEventCallback = (download: DownloadProgress) => void;
export interface DownloadManagerConfig {
    defaultDirectory?: string;
    showSaveDialog?: boolean;
    maxConcurrent?: number;
    overwrite?: boolean;
}
export declare class DownloadManagerService {
    private window;
    private config;
    private downloads;
    private history;
    private progressCallbacks;
    private completionCallbacks;
    private idCounter;
    private log;
    constructor(window: BrowserWindow, config?: DownloadManagerConfig);
    initialize(): void;
    private handleNewDownload;
    pause(id: string): boolean;
    resume(id: string): boolean;
    cancel(id: string): boolean;
    cancelAll(): void;
    getActive(): DownloadProgress[];
    getHistory(limit?: number): DownloadProgress[];
    clearHistory(): void;
    onProgress(callback: DownloadEventCallback): () => void;
    onCompletion(callback: DownloadEventCallback): () => void;
    private emitProgress;
    private emitCompletion;
    dispose(): void;
}
