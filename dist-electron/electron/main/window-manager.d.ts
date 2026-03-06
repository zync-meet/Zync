import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
export type WindowType = 'main' | 'settings' | 'splash' | 'about' | 'overlay';
interface WindowEntry {
    window: BrowserWindow;
    type: WindowType;
    createdAt: number;
    persistent: boolean;
}
export interface ManagedWindowOptions extends BrowserWindowConstructorOptions {
    type: WindowType;
    persistent?: boolean;
    loadURL?: string;
    loadFile?: string;
    center?: boolean;
    showOnReady?: boolean;
}
export declare function createManagedWindow(options: ManagedWindowOptions): BrowserWindow;
export declare function getAllWindows(): WindowEntry[];
export declare function getWindowsByType(type: WindowType): WindowEntry[];
export declare function getWindowByType(type: WindowType): WindowEntry | null;
export declare function getWindowById(id: number): WindowEntry | null;
export declare function hasWindowOfType(type: WindowType): boolean;
export declare function getWindowCount(): number;
export declare function focusWindow(type: WindowType): boolean;
export declare function closeWindowsByType(type: WindowType): number;
export declare function closeAllExcept(exceptTypes?: WindowType[]): number;
export declare function broadcastToType(type: WindowType, channel: string, ...args: unknown[]): void;
export declare function broadcastToAll(channel: string, ...args: unknown[]): void;
export declare function destroyAllWindows(): void;
export {};
