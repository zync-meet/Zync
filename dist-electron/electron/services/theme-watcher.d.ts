export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeChangeCallback = (theme: 'light' | 'dark') => void;
export interface ThemeWatcherConfig {
    initialMode?: ThemeMode;
    notifyRenderers?: boolean;
    ipcChannel?: string;
}
export declare class ThemeWatcherService {
    private mode;
    private isWatching;
    private callbacks;
    private notifyRenderers;
    private ipcChannel;
    private log;
    private nativeThemeHandler;
    constructor(config?: ThemeWatcherConfig);
    get currentTheme(): 'dark' | 'light';
    get currentMode(): ThemeMode;
    get isDarkMode(): boolean;
    setMode(mode: ThemeMode): void;
    toggle(): 'dark' | 'light';
    start(): void;
    stop(): void;
    onChange(callback: ThemeChangeCallback): () => void;
    private notifyChange;
    dispose(): void;
}
export declare function getThemeWatcher(config?: ThemeWatcherConfig): ThemeWatcherService;
