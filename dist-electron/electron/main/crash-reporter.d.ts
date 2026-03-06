import { BrowserWindow } from 'electron';
export interface CrashReporterConfig {
    enabled: boolean;
    submitURL?: string;
    uploadToServer: boolean;
    extra?: Record<string, string>;
    maxLocalLogs: number;
    showCrashDialog: boolean;
    autoRecoverRenderer: boolean;
}
export interface CrashEvent {
    id: string;
    timestamp: string;
    type: 'renderer-crash' | 'renderer-killed' | 'unhandled-exception' | 'unhandled-rejection' | 'native-crash';
    message: string;
    stack?: string;
    process: 'main' | 'renderer' | 'gpu' | 'utility';
    reason?: string;
    exitCode?: number;
    appVersion: string;
    electronVersion: string;
    platform: string;
    arch: string;
}
export declare function initCrashReporter(userConfig?: Partial<CrashReporterConfig>): void;
export declare function attachRendererCrashHandler(window: BrowserWindow, label?: string): void;
export declare function getRecentCrashes(limit?: number): CrashEvent[];
export declare function getCrashCount(): number;
export declare function getCrashLogDir(): string;
export declare function readCrashLogs(): Promise<CrashEvent[]>;
export declare function clearCrashLogs(): Promise<number>;
export declare function rotateCrashLogs(): Promise<number>;
