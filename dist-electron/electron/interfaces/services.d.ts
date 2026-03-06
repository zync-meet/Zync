import { BrowserWindow } from 'electron';
export interface IService {
    initialize(): Promise<void> | void;
    dispose(): Promise<void> | void;
    isRunning(): boolean;
}
export interface IAutoUpdaterService extends IService {
    checkForUpdates(): Promise<void>;
    setAutoCheckEnabled(enabled: boolean): void;
    setMainWindow(window: BrowserWindow | null): void;
    isDownloading(): boolean;
    getPendingVersion(): string | null;
}
export interface UpdateProgress {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
}
export interface UpdateInfo {
    version: string;
    releaseNotes?: string | null;
    releaseDate?: string;
    releaseName?: string | null;
    sha512?: string;
}
export interface INotificationService extends IService {
    show(title: string, body: string, options?: NotificationOptions): string;
    isSupported(): boolean;
}
export interface NotificationOptions {
    icon?: string;
    silent?: boolean;
    requireInteraction?: boolean;
    urgency?: 'low' | 'normal' | 'critical';
    onClick?: () => void;
    onClose?: () => void;
    timeoutMs?: number;
}
export interface ICrashReporterService extends IService {
    start(config?: CrashReporterConfig): void;
    reportError(error: Error, context?: Record<string, unknown>): void;
    getCrashDumpsPath(): string;
}
export interface CrashReporterConfig {
    submitUrl?: string;
    productName?: string;
    uploadToServer?: boolean;
    extra?: Record<string, string>;
}
export interface IDeepLinkHandler {
    register(): void;
    handleUrl(url: string): void;
    isRegistered(): boolean;
}
export interface DeepLinkData {
    protocol: string;
    path: string;
    segments: string[];
    params: Record<string, string>;
    raw: string;
}
