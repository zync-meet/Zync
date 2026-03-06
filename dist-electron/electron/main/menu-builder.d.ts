import { Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron';
export declare function buildMenuTemplate(mainWindow: BrowserWindow | null): MenuItemConstructorOptions[];
export declare function applyApplicationMenu(mainWindow: BrowserWindow | null): void;
export declare function createContextMenu(window: BrowserWindow, options?: MenuItemConstructorOptions[]): Menu;
export declare function disableMenu(): void;
