import { BrowserWindow } from 'electron';
export interface DevToolsConfig {
    autoOpen: boolean;
    mode: 'right' | 'bottom' | 'undocked' | 'detach';
    reactDevTools: boolean;
    reduxDevTools: boolean;
    sourceMaps: boolean;
    showFPS: boolean;
    paintFlashing: boolean;
    logIPC: boolean;
}
export declare const DEFAULT_DEV_TOOLS_CONFIG: DevToolsConfig;
export declare function configureDevTools(window: BrowserWindow, options?: Partial<DevToolsConfig>): void;
export declare function installReactDevTools(): Promise<boolean>;
export declare function openDevTools(window: BrowserWindow, mode?: DevToolsConfig['mode']): void;
export declare function closeDevTools(window: BrowserWindow): void;
export declare function toggleDevTools(window: BrowserWindow): void;
export declare function isDevToolsOpen(window: BrowserWindow): boolean;
export declare function logRegisteredHandlers(): void;
export declare function enableCSPLogging(window: BrowserWindow): void;
