import { BrowserWindow } from 'electron';
interface WindowState {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
}
export declare function loadWindowState(): WindowState;
export declare function trackWindowState(window: BrowserWindow): void;
export {};
