import { Tray, BrowserWindow } from 'electron';
export declare function initTray(mainWindow: BrowserWindow | null): Tray | null;
export declare function updateTrayMenu(mainWindow: BrowserWindow | null, options?: {
    isVisible?: boolean;
    hasUpdate?: boolean;
    updateVersion?: string;
}): void;
export declare function updateTrayIcon(isDark?: boolean): void;
export declare function setTrayTooltip(text?: string): void;
export declare function showTrayBalloon(title: string, content: string): void;
export declare function destroyTray(): void;
export declare function getTray(): Tray | null;
