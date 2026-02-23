/**
 * =============================================================================
 * Configuration Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript interfaces that define the shape of all configuration objects
 * used throughout the Electron main process. These interfaces enforce type
 * safety and provide IntelliSense documentation for configuration values.
 *
 * Configuration objects are used by:
 * - Window creation (WindowConfig, WindowBoundsConfig)
 * - Content Security Policy (CSPDirectives)
 * - Application constants (AppConstants)
 * - Build configuration (BuildConfig)
 *
 * @module electron/interfaces/config
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/**
 * Configuration for creating a BrowserWindow instance.
 *
 * This interface extends the basic WindowConfig from the main interfaces
 * module with additional properties specific to the creation of Electron
 * BrowserWindow instances. It provides a type-safe way to pass configuration
 * options to the window creation function.
 *
 * @interface WindowCreationConfig
 *
 * @example
 * ```typescript
 * const config: WindowCreationConfig = {
 *   width: 1200,
 *   height: 800,
 *   minWidth: 800,
 *   minHeight: 600,
 *   title: 'ZYNC',
 *   frame: true,
 *   transparent: false,
 *   resizable: true,
 *   preloadScript: '/path/to/preload.js',
 *   devTools: true,
 * };
 * ```
 */
export interface WindowCreationConfig {
    /** Window width in pixels */
    width: number;
    /** Window height in pixels */
    height: number;
    /** Minimum allowed window width */
    minWidth: number;
    /** Minimum allowed window height */
    minHeight: number;
    /** Window title displayed in the title bar */
    title: string;
    /** Optional X position of the window on screen */
    x?: number;
    /** Optional Y position of the window on screen */
    y?: number;
    /** Whether the window should have a native frame (title bar + borders) */
    frame: boolean;
    /** Whether the window background should be transparent */
    transparent: boolean;
    /** Whether the window can be resized by the user */
    resizable: boolean;
    /** Absolute path to the preload script */
    preloadScript: string;
    /** Whether to enable DevTools (typically true in development) */
    devTools: boolean;
    /** Optional path to the window icon file */
    icon?: string;
    /** Whether to show the window immediately upon creation */
    show: boolean;
    /** Background color of the window before content loads */
    backgroundColor: string;
    /** Whether the window should start in fullscreen mode */
    fullscreen: boolean;
    /** Whether the window should start maximized */
    maximized: boolean;
    /** Whether the window should always be on top of other windows */
    alwaysOnTop: boolean;
    /** Whether to enable node integration in the renderer process (security risk!) */
    nodeIntegration: boolean;
    /** Whether to enable context isolation (security feature) */
    contextIsolation: boolean;
    /** Whether to enable the sandbox for the renderer process */
    sandbox: boolean;
}
/**
 * Persisted window bounds for state restoration.
 *
 * This interface represents the window position and size that is saved
 * to disk and restored when the application starts. It includes validation
 * metadata to ensure the saved state is still valid.
 *
 * @interface WindowBoundsConfig
 */
export interface WindowBoundsConfig {
    /** Window X position on screen */
    x: number;
    /** Window Y position on screen */
    y: number;
    /** Window width in pixels */
    width: number;
    /** Window height in pixels */
    height: number;
    /** Whether the window was maximized when last closed */
    isMaximized: boolean;
    /** Whether the window was in fullscreen mode when last closed */
    isFullScreen: boolean;
    /** The display ID where the window was last positioned */
    displayId?: number;
    /** Timestamp of when this state was last saved (ISO 8601 string) */
    savedAt?: string;
}
/**
 * Content Security Policy directive configuration.
 *
 * Maps CSP directive names to their allowed source values. This interface
 * ensures that all CSP directives are properly typed and that source values
 * are string arrays.
 *
 * @interface CSPDirectives
 *
 * @example
 * ```typescript
 * const csp: CSPDirectives = {
 *   'default-src': ["'self'"],
 *   'script-src': ["'self'", "'unsafe-inline'"],
 *   'style-src': ["'self'", "'unsafe-inline'"],
 *   'img-src': ["'self'", 'data:', 'https:'],
 * };
 * ```
 */
export interface CSPDirectives {
    /** Default sources for all fetch directives */
    'default-src'?: string[];
    /** Sources for JavaScript execution */
    'script-src'?: string[];
    /** Sources for CSS stylesheets */
    'style-src'?: string[];
    /** Sources for font files */
    'font-src'?: string[];
    /** Sources for images */
    'img-src'?: string[];
    /** Sources for XMLHttpRequest, WebSocket, and fetch() */
    'connect-src'?: string[];
    /** Sources for frames (iframes, frame, object, embed) */
    'frame-src'?: string[];
    /** Sources for audio and video elements */
    'media-src'?: string[];
    /** Sources for <object>, <embed>, and <applet> elements */
    'object-src'?: string[];
    /** Restricts the base URL for relative URLs */
    'base-uri'?: string[];
    /** Restricts form submission targets */
    'form-action'?: string[];
    /** Restricts which parents can embed this page */
    'frame-ancestors'?: string[];
    /** Restricts the origins for Web Workers */
    'worker-src'?: string[];
    /** Restricts the origins for the document's base URI */
    'child-src'?: string[];
    /** Restricts the origins for manifest files */
    'manifest-src'?: string[];
    /** Restricts prefetching and prerendering */
    'prefetch-src'?: string[];
    /** Additional string-keyed directives for forward compatibility */
    [key: string]: string[] | undefined;
}
/**
 * Application-wide constants configuration.
 *
 * Defines the shape of the constants object that holds all application
 * metadata, URLs, and dimensional defaults. This interface ensures that
 * any changes to the constants file maintain type compatibility.
 *
 * @interface AppConstants
 */
export interface AppConstants {
    /** Application display name */
    appName: string;
    /** Application description text */
    appDescription: string;
    /** GitHub repository URL */
    githubRepoUrl: string;
    /** GitHub issues page URL */
    githubIssuesUrl: string;
    /** GitHub releases page URL */
    githubReleasesUrl: string;
    /** Production web application URL */
    webAppUrl: string;
    /** Development server URL */
    devServerUrl: string;
    /** Default window width in pixels */
    defaultWindowWidth: number;
    /** Default window height in pixels */
    defaultWindowHeight: number;
    /** Minimum window width in pixels */
    minWindowWidth: number;
    /** Minimum window height in pixels */
    minWindowHeight: number;
    /** Auto-update check interval in milliseconds */
    updateCheckInterval: number;
}
/**
 * Build configuration for electron-builder.
 *
 * This interface documents the expected shape of the build configuration,
 * making it easier to understand and maintain the electron-builder.yml file.
 *
 * @interface BuildConfig
 */
export interface BuildConfig {
    /** Application ID (reverse domain notation) */
    appId: string;
    /** Display name of the application */
    productName: string;
    /** Build output directories */
    directories: {
        /** Output directory for build artifacts */
        output: string;
        /** Directory containing build resources (icons, etc.) */
        buildResources: string;
    };
    /** File patterns to include in the build */
    files: string[];
    /** Windows-specific build configuration */
    win?: {
        /** Build target format */
        target: string;
        /** Path to Windows icon (.ico) */
        icon: string;
    };
    /** macOS-specific build configuration */
    mac?: {
        /** Build target format */
        target: string;
        /** Path to macOS icon (.icns) */
        icon: string;
        /** Mac App Store category */
        category: string;
    };
    /** Linux-specific build configuration */
    linux?: {
        /** Build target format */
        target: string;
        /** Freedesktop.org application category */
        category: string;
    };
}
/**
 * Deep link configuration for the zync:// protocol handler.
 *
 * @interface DeepLinkConfig
 */
export interface DeepLinkConfig {
    /** The protocol scheme (e.g., 'zync') */
    protocol: string;
    /** Whether the protocol is registered as the default handler */
    isDefaultHandler: boolean;
    /** Supported deep link routes */
    supportedRoutes: string[];
}
/**
 * Notification configuration.
 *
 * @interface NotificationConfig
 */
export interface NotificationConfig {
    /** Whether notifications are enabled */
    enabled: boolean;
    /** Whether to play a sound with notifications */
    sound: boolean;
    /** Duration to show the notification (ms, 0 = system default) */
    duration: number;
    /** Whether to show notifications when the app is focused */
    showWhenFocused: boolean;
}
/**
 * Logging configuration.
 *
 * @interface LoggingConfig
 */
export interface LoggingConfig {
    /** Minimum log level to output */
    level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    /** Whether to write logs to a file */
    fileLogging: boolean;
    /** Maximum log file size in bytes before rotation */
    maxFileSize: number;
    /** Number of rotated log files to keep */
    maxFiles: number;
    /** Directory path for log files */
    logDirectory: string;
}
