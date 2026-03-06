export interface WindowCreationConfig {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    title: string;
    x?: number;
    y?: number;
    frame: boolean;
    transparent: boolean;
    resizable: boolean;
    preloadScript: string;
    devTools: boolean;
    icon?: string;
    show: boolean;
    backgroundColor: string;
    fullscreen: boolean;
    maximized: boolean;
    alwaysOnTop: boolean;
    nodeIntegration: boolean;
    contextIsolation: boolean;
    sandbox: boolean;
}
export interface WindowBoundsConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
    isFullScreen: boolean;
    displayId?: number;
    savedAt?: string;
}
export interface CSPDirectives {
    'default-src'?: string[];
    'script-src'?: string[];
    'style-src'?: string[];
    'font-src'?: string[];
    'img-src'?: string[];
    'connect-src'?: string[];
    'frame-src'?: string[];
    'media-src'?: string[];
    'object-src'?: string[];
    'base-uri'?: string[];
    'form-action'?: string[];
    'frame-ancestors'?: string[];
    'worker-src'?: string[];
    'child-src'?: string[];
    'manifest-src'?: string[];
    'prefetch-src'?: string[];
    [key: string]: string[] | undefined;
}
export interface AppConstants {
    appName: string;
    appDescription: string;
    githubRepoUrl: string;
    githubIssuesUrl: string;
    githubReleasesUrl: string;
    webAppUrl: string;
    devServerUrl: string;
    defaultWindowWidth: number;
    defaultWindowHeight: number;
    minWindowWidth: number;
    minWindowHeight: number;
    updateCheckInterval: number;
}
export interface BuildConfig {
    appId: string;
    productName: string;
    directories: {
        output: string;
        buildResources: string;
    };
    files: string[];
    win?: {
        target: string;
        icon: string;
    };
    mac?: {
        target: string;
        icon: string;
        category: string;
    };
    linux?: {
        target: string;
        category: string;
    };
}
export interface DeepLinkConfig {
    protocol: string;
    isDefaultHandler: boolean;
    supportedRoutes: string[];
}
export interface NotificationConfig {
    enabled: boolean;
    sound: boolean;
    duration: number;
    showWhenFocused: boolean;
}
export interface LoggingConfig {
    level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    fileLogging: boolean;
    maxFileSize: number;
    maxFiles: number;
    logDirectory: string;
}
