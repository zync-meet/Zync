import { BrowserWindow } from 'electron';
export interface ContentProtectionConfig {
    preventScreenCapture: boolean;
    protectAllWindows: boolean;
    excludeWindows: Set<string>;
}
export interface ContentProtectionState {
    isProtected: boolean;
    protectedWindowCount: number;
    platformSupported: boolean;
}
export declare function initContentProtection(options?: Partial<ContentProtectionConfig>): void;
export declare function enableProtection(window: BrowserWindow): void;
export declare function disableProtection(window: BrowserWindow): void;
export declare function toggleProtection(window: BrowserWindow): boolean;
export declare function applyToAllWindows(enabled: boolean): void;
export declare function isWindowProtected(window: BrowserWindow): boolean;
export declare function getProtectionState(): ContentProtectionState;
export declare function getProtectionConfig(): ContentProtectionConfig;
