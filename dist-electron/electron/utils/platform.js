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
import { app } from 'electron';
import * as os from 'os';
// =============================================================================
// Platform Constants
// =============================================================================
/** Whether the current platform is macOS */
export const isMacOS = process.platform === 'darwin';
/** Whether the current platform is Windows */
export const isWindows = process.platform === 'win32';
/** Whether the current platform is Linux */
export const isLinux = process.platform === 'linux';
/** Whether the current platform is FreeBSD */
export const isFreeBSD = process.platform === 'freebsd';
/** Whether running on ARM architecture */
export const isARM = process.arch === 'arm64' || process.arch === 'arm';
/** Whether running on x64 architecture */
export const isX64 = process.arch === 'x64';
/** Whether the app is packaged for production */
export const isProduction = app.isPackaged;
/** Whether the app is running in development mode */
export const isDevelopment = !app.isPackaged;
/**
 * Detect the current Linux desktop environment.
 *
 * Uses the XDG_CURRENT_DESKTOP and DESKTOP_SESSION environment variables
 * to determine which desktop environment is running.
 *
 * @returns {LinuxDesktopEnvironment} The detected desktop environment
 */
export function detectLinuxDesktop() {
    if (!isLinux)
        return 'unknown';
    const xdgDesktop = (process.env.XDG_CURRENT_DESKTOP || '').toLowerCase();
    const desktopSession = (process.env.DESKTOP_SESSION || '').toLowerCase();
    const combined = `${xdgDesktop} ${desktopSession}`;
    if (combined.includes('gnome'))
        return 'gnome';
    if (combined.includes('kde') || combined.includes('plasma'))
        return 'kde';
    if (combined.includes('xfce'))
        return 'xfce';
    if (combined.includes('cinnamon'))
        return 'cinnamon';
    if (combined.includes('mate'))
        return 'mate';
    if (combined.includes('lxqt'))
        return 'lxqt';
    if (combined.includes('lxde'))
        return 'lxde';
    if (combined.includes('budgie'))
        return 'budgie';
    if (combined.includes('deepin'))
        return 'deepin';
    if (combined.includes('pantheon'))
        return 'pantheon';
    if (combined.includes('unity'))
        return 'unity';
    return 'unknown';
}
/**
 * Detect the display server protocol on Linux.
 *
 * @returns {DisplayServer} The detected display server
 */
export function detectDisplayServer() {
    if (!isLinux)
        return 'unknown';
    const waylandDisplay = process.env.WAYLAND_DISPLAY;
    const xdgSessionType = (process.env.XDG_SESSION_TYPE || '').toLowerCase();
    if (waylandDisplay || xdgSessionType === 'wayland')
        return 'wayland';
    if (process.env.DISPLAY || xdgSessionType === 'x11')
        return 'x11';
    return 'unknown';
}
/**
 * Collect comprehensive system information.
 *
 * This is useful for crash reports, about dialogs, and debugging.
 *
 * @returns {SystemInfo} System information object
 */
export function getSystemInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const info = {
        platform: process.platform,
        osRelease: os.release(),
        osType: os.type(),
        arch: process.arch,
        cpuCores: os.cpus().length,
        totalMemory,
        freeMemory,
        memoryUsagePercent: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
        uptime: os.uptime(),
        homeDir: os.homedir(),
        hostname: os.hostname(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        v8Version: process.versions.v8,
        appVersion: app.getVersion(),
    };
    if (isLinux) {
        info.linuxDesktop = detectLinuxDesktop();
        info.displayServer = detectDisplayServer();
    }
    return info;
}
/**
 * Get a human-readable OS name string.
 *
 * @returns {string} Formatted OS name (e.g., "macOS 14.2", "Windows 11", "Ubuntu Linux")
 */
export function getOSDisplayName() {
    if (isMacOS) {
        return `macOS ${os.release()}`;
    }
    if (isWindows) {
        const release = os.release();
        // Windows 11 starts at build 22000
        const buildMatch = release.match(/(\d+)$/);
        const buildNumber = buildMatch ? parseInt(buildMatch[1], 10) : 0;
        const winVersion = buildNumber >= 22000 ? '11' : '10';
        return `Windows ${winVersion} (${release})`;
    }
    if (isLinux) {
        const desktop = detectLinuxDesktop();
        const de = desktop !== 'unknown' ? ` (${desktop})` : '';
        return `Linux ${os.release()}${de}`;
    }
    return `${os.type()} ${os.release()}`;
}
/**
 * Format bytes into a human-readable string.
 *
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "2.5 GB")
 */
export function formatMemory(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = bytes;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
}
// =============================================================================
// Feature Support Checks
// =============================================================================
/**
 * Check if the system tray is supported on the current platform.
 * Some Linux desktop environments have limited tray support.
 *
 * @returns {boolean} True if tray is supported
 */
export function isTraySupported() {
    if (isMacOS || isWindows)
        return true;
    if (isLinux) {
        const desktop = detectLinuxDesktop();
        // Most modern DEs support the StatusNotifierItem protocol
        return desktop !== 'unknown';
    }
    return false;
}
/**
 * Check if native notifications are supported.
 *
 * @returns {boolean} True if notifications are supported
 */
export function isNotificationsSupported() {
    // Electron supports notifications on all major platforms
    return isMacOS || isWindows || isLinux;
}
/**
 * Check if the platform supports the global shortcut API.
 *
 * @returns {boolean} True if global shortcuts are supported
 */
export function isGlobalShortcutsSupported() {
    if (isLinux) {
        // Wayland doesn't support global shortcuts via X11 protocol
        return detectDisplayServer() !== 'wayland';
    }
    return true;
}
//# sourceMappingURL=platform.js.map