import { nativeTheme, BrowserWindow } from 'electron';
import { logger } from '../utils/logger.js';


export type ThemeMode = 'light' | 'dark' | 'system';


export type ThemeChangeCallback = (theme: 'light' | 'dark') => void;


export interface ThemeWatcherConfig {

    initialMode?: ThemeMode;

    notifyRenderers?: boolean;

    ipcChannel?: string;
}


export class ThemeWatcherService {

    private mode: ThemeMode;


    private isWatching = false;


    private callbacks: Set<ThemeChangeCallback> = new Set();


    private notifyRenderers: boolean;


    private ipcChannel: string;


    private log = logger;


    private nativeThemeHandler: (() => void) | null = null;


    constructor(config: ThemeWatcherConfig = {}) {
        this.mode = config.initialMode ?? 'system';
        this.notifyRenderers = config.notifyRenderers ?? true;
        this.ipcChannel = config.ipcChannel ?? 'theme:changed';
    }


    get currentTheme(): 'dark' | 'light' {
        if (this.mode === 'system') {
            return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        }
        return this.mode;
    }


    get currentMode(): ThemeMode {
        return this.mode;
    }


    get isDarkMode(): boolean {
        return this.currentTheme === 'dark';
    }


    setMode(mode: ThemeMode): void {
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


    toggle(): 'dark' | 'light' {
        const newMode = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setMode(newMode);
        return newMode;
    }


    start(): void {
        if (this.isWatching) {return;}

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


    stop(): void {
        if (!this.isWatching) {return;}

        if (this.nativeThemeHandler) {
            nativeTheme.removeListener('updated', this.nativeThemeHandler);
            this.nativeThemeHandler = null;
        }

        this.isWatching = false;
        this.log.info('Theme watcher stopped');
    }


    onChange(callback: ThemeChangeCallback): () => void {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }


    private notifyChange(theme: 'dark' | 'light'): void {

        for (const callback of this.callbacks) {
            try {
                callback(theme);
            } catch (err) {
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


    dispose(): void {
        this.stop();
        this.callbacks.clear();
        this.log.info('Theme watcher disposed');
    }
}


let themeWatcherInstance: ThemeWatcherService | null = null;


export function getThemeWatcher(config?: ThemeWatcherConfig): ThemeWatcherService {
    if (!themeWatcherInstance) {
        themeWatcherInstance = new ThemeWatcherService(config);
    }
    return themeWatcherInstance;
}
