import { nativeTheme, ipcMain, BrowserWindow } from 'electron';
import { logger } from '../utils/logger.js';


export type ThemeSource = 'system' | 'light' | 'dark';


export interface ThemeInfo {

    effectiveTheme: 'light' | 'dark';

    themeSource: ThemeSource;

    highContrast: boolean;

    invertedColors: boolean;
}


let initialized = false;


const log = logger;


export function initNativeTheme(): void {
    if (initialized) {return;}


    ipcMain.handle('theme:get', (): ThemeInfo => {
        return getCurrentThemeInfo();
    });


    ipcMain.handle('theme:set', (_event, source: ThemeSource): ThemeInfo => {
        setThemeSource(source);
        return getCurrentThemeInfo();
    });


    ipcMain.handle('theme:toggle', (): ThemeInfo => {
        const newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
        setThemeSource(newTheme);
        return getCurrentThemeInfo();
    });


    nativeTheme.on('updated', () => {
        const info = getCurrentThemeInfo();
        log.info(`System theme changed: ${info.effectiveTheme}`);
        broadcastThemeChange(info);
    });

    initialized = true;
    log.info(`Native theme initialized (effective: ${getCurrentThemeInfo().effectiveTheme})`);
}


export function getCurrentThemeInfo(): ThemeInfo {
    return {
        effectiveTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
        themeSource: nativeTheme.themeSource as ThemeSource,
        highContrast: nativeTheme.shouldUseHighContrastColors,
        invertedColors: nativeTheme.shouldUseInvertedColorScheme,
    };
}


export function setThemeSource(source: ThemeSource): void {
    nativeTheme.themeSource = source;
    log.info(`Theme source set to: ${source}`);
}


export function isDarkMode(): boolean {
    return nativeTheme.shouldUseDarkColors;
}


function broadcastThemeChange(info: ThemeInfo): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        if (!win.isDestroyed()) {
            win.webContents.send('theme:changed', info);
        }
    }
}
