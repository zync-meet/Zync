/**
 * =============================================================================
 * Platform Detection Utilities — ZYNC Desktop
 * =============================================================================
 *
 * Provides comprehensive platform detection and OS-specific feature checks.
 * Use these utilities to conditionally enable features based on the user's
 * operating system, desktop environment, or system capabilities.
 *
 * @module electron/utils/platform
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/** Whether the current platform is macOS */
export declare const isMacOS: boolean;
/** Whether the current platform is Windows */
export declare const isWindows: boolean;
/** Whether the current platform is Linux */
export declare const isLinux: boolean;
/** Whether the current platform is FreeBSD */
export declare const isFreeBSD: boolean;
/** Whether running on ARM architecture */
export declare const isARM: boolean;
/** Whether running on x64 architecture */
export declare const isX64: boolean;
/** Whether the app is packaged for production */
export declare const isProduction: boolean;
/** Whether the app is running in development mode */
export declare const isDevelopment: boolean;
/**
 * Supported Linux desktop environments.
 */
export type LinuxDesktopEnvironment = 'gnome' | 'kde' | 'xfce' | 'cinnamon' | 'mate' | 'lxde' | 'lxqt' | 'budgie' | 'deepin' | 'pantheon' | 'unity' | 'unknown';
/**
 * Detect the current Linux desktop environment.
 *
 * Uses the XDG_CURRENT_DESKTOP and DESKTOP_SESSION environment variables
 * to determine which desktop environment is running.
 *
 * @returns {LinuxDesktopEnvironment} The detected desktop environment
 */
export declare function detectLinuxDesktop(): LinuxDesktopEnvironment;
/**
 * Display server types used on Linux.
 */
export type DisplayServer = 'x11' | 'wayland' | 'unknown';
/**
 * Detect the display server protocol on Linux.
 *
 * @returns {DisplayServer} The detected display server
 */
export declare function detectDisplayServer(): DisplayServer;
/**
 * Comprehensive system information object.
 */
export interface SystemInfo {
    /** Operating system platform */
    platform: NodeJS.Platform;
    /** OS release version */
    osRelease: string;
    /** OS type (Linux, Darwin, Windows_NT) */
    osType: string;
    /** CPU architecture */
    arch: string;
    /** Number of CPU cores */
    cpuCores: number;
    /** Total system memory in bytes */
    totalMemory: number;
    /** Available system memory in bytes */
    freeMemory: number;
    /** Memory usage percentage */
    memoryUsagePercent: number;
    /** System uptime in seconds */
    uptime: number;
    /** Current user's home directory */
    homeDir: string;
    /** System hostname */
    hostname: string;
    /** Electron version */
    electronVersion: string;
    /** Node.js version */
    nodeVersion: string;
    /** Chromium version */
    chromeVersion: string;
    /** V8 engine version */
    v8Version: string;
    /** Application version */
    appVersion: string;
    /** Linux desktop environment (if applicable) */
    linuxDesktop?: LinuxDesktopEnvironment;
    /** Display server (if Linux) */
    displayServer?: DisplayServer;
}
/**
 * Collect comprehensive system information.
 *
 * This is useful for crash reports, about dialogs, and debugging.
 *
 * @returns {SystemInfo} System information object
 */
export declare function getSystemInfo(): SystemInfo;
/**
 * Get a human-readable OS name string.
 *
 * @returns {string} Formatted OS name (e.g., "macOS 14.2", "Windows 11", "Ubuntu Linux")
 */
export declare function getOSDisplayName(): string;
/**
 * Format bytes into a human-readable string.
 *
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "2.5 GB")
 */
export declare function formatMemory(bytes: number): string;
/**
 * Check if the system tray is supported on the current platform.
 * Some Linux desktop environments have limited tray support.
 *
 * @returns {boolean} True if tray is supported
 */
export declare function isTraySupported(): boolean;
/**
 * Check if native notifications are supported.
 *
 * @returns {boolean} True if notifications are supported
 */
export declare function isNotificationsSupported(): boolean;
/**
 * Check if the platform supports the global shortcut API.
 *
 * @returns {boolean} True if global shortcuts are supported
 */
export declare function isGlobalShortcutsSupported(): boolean;
