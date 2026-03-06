import { nativeTheme, ipcMain, BrowserWindow } from 'electron';
import { logger } from '../utils/logger.js';
let initialized = false;
const log = logger;
export function initNativeTheme() {
    if (initialized)
        return;
    ipcMain.handle('theme:get', () => {
        return getCurrentThemeInfo();
    });
    ipcMain.handle('theme:set', (_event, source) => {
        setThemeSource(source);
        return getCurrentThemeInfo();
    });
    ipcMain.handle('theme:toggle', () => {
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
export function getCurrentThemeInfo() {
    return {
        effectiveTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
        themeSource: nativeTheme.themeSource,
        highContrast: nativeTheme.shouldUseHighContrastColors,
        invertedColors: nativeTheme.shouldUseInvertedColorScheme,
    };
}
export function setThemeSource(source) {
    nativeTheme.themeSource = source;
    log.info(`Theme source set to: ${source}`);
}
export function isDarkMode() {
    return nativeTheme.shouldUseDarkColors;
}
function broadcastThemeChange(info) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        if (!win.isDestroyed()) {
            win.webContents.send('theme:changed', info);
        }
    }
}
//# sourceMappingURL=native-theme.js.map