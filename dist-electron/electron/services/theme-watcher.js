import { nativeTheme, BrowserWindow } from 'electron';
import { logger } from '../utils/logger.js';
export class ThemeWatcherService {
    mode;
    isWatching = false;
    callbacks = new Set();
    notifyRenderers;
    ipcChannel;
    log = logger;
    nativeThemeHandler = null;
    constructor(config = {}) {
        this.mode = config.initialMode ?? 'system';
        this.notifyRenderers = config.notifyRenderers ?? true;
        this.ipcChannel = config.ipcChannel ?? 'theme:changed';
    }
    get currentTheme() {
        if (this.mode === 'system') {
            return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        }
        return this.mode;
    }
    get currentMode() {
        return this.mode;
    }
    get isDarkMode() {
        return this.currentTheme === 'dark';
    }
    setMode(mode) {
        const oldTheme = this.currentTheme;
        this.mode = mode;
        switch (mode) {
            case 'dark':
                nativeTheme.themeSource = 'dark';
                break;
            case 'light':
                nativeTheme.themeSource = 'light';
                break;
            case 'system':
                nativeTheme.themeSource = 'system';
                break;
        }
        const newTheme = this.currentTheme;
        if (oldTheme !== newTheme) {
            this.notifyChange(newTheme);
        }
        this.log.info(`Theme mode set to: ${mode} (resolved: ${this.currentTheme})`);
    }
    toggle() {
        const newMode = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setMode(newMode);
        return newMode;
    }
    start() {
        if (this.isWatching)
            return;
        this.nativeThemeHandler = () => {
            if (this.mode === 'system') {
                const theme = this.currentTheme;
                this.log.info(`System theme changed to: ${theme}`);
                this.notifyChange(theme);
            }
        };
        nativeTheme.on('updated', this.nativeThemeHandler);
        this.isWatching = true;
        this.setMode(this.mode);
        this.log.info('Theme watcher started');
    }
    stop() {
        if (!this.isWatching)
            return;
        if (this.nativeThemeHandler) {
            nativeTheme.removeListener('updated', this.nativeThemeHandler);
            this.nativeThemeHandler = null;
        }
        this.isWatching = false;
        this.log.info('Theme watcher stopped');
    }
    onChange(callback) {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }
    notifyChange(theme) {
        for (const callback of this.callbacks) {
            try {
                callback(theme);
            }
            catch (err) {
                this.log.error('Theme change callback error:', err);
            }
        }
        if (this.notifyRenderers) {
            const windows = BrowserWindow.getAllWindows();
            for (const win of windows) {
                if (!win.isDestroyed()) {
                    win.webContents.send(this.ipcChannel, theme);
                }
            }
        }
    }
    dispose() {
        this.stop();
        this.callbacks.clear();
        this.log.info('Theme watcher disposed');
    }
}
let themeWatcherInstance = null;
export function getThemeWatcher(config) {
    if (!themeWatcherInstance) {
        themeWatcherInstance = new ThemeWatcherService(config);
    }
    return themeWatcherInstance;
}
//# sourceMappingURL=theme-watcher.js.map