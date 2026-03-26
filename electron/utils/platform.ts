import { app } from 'electron';
import * as os from 'os';


export const isMacOS: boolean = process.platform === 'darwin';


export const isWindows: boolean = process.platform === 'win32';


export const isLinux: boolean = process.platform === 'linux';


export const isFreeBSD: boolean = process.platform === 'freebsd';


export const isARM: boolean = process.arch === 'arm64' || process.arch === 'arm';


export const isX64: boolean = process.arch === 'x64';


export const isProduction: boolean = app.isPackaged;


export const isDevelopment: boolean = !app.isPackaged;


export type LinuxDesktopEnvironment =
    | 'gnome'
    | 'kde'
    | 'xfce'
    | 'cinnamon'
    | 'mate'
    | 'lxde'
    | 'lxqt'
    | 'budgie'
    | 'deepin'
    | 'pantheon'
    | 'unity'
    | 'unknown';


export function detectLinuxDesktop(): LinuxDesktopEnvironment {
    if (!isLinux) {return 'unknown';}

    const xdgDesktop = (process.env.XDG_CURRENT_DESKTOP || '').toLowerCase();
    const desktopSession = (process.env.DESKTOP_SESSION || '').toLowerCase();
    const combined = `${xdgDesktop} ${desktopSession}`;

    if (combined.includes('gnome')) {return 'gnome';}
    if (combined.includes('kde') || combined.includes('plasma')) {return 'kde';}
    if (combined.includes('xfce')) {return 'xfce';}
    if (combined.includes('cinnamon')) {return 'cinnamon';}
    if (combined.includes('mate')) {return 'mate';}
    if (combined.includes('lxqt')) {return 'lxqt';}
    if (combined.includes('lxde')) {return 'lxde';}
    if (combined.includes('budgie')) {return 'budgie';}
    if (combined.includes('deepin')) {return 'deepin';}
    if (combined.includes('pantheon')) {return 'pantheon';}
    if (combined.includes('unity')) {return 'unity';}

    return 'unknown';
}


export type DisplayServer = 'x11' | 'wayland' | 'unknown';


export function detectDisplayServer(): DisplayServer {
    if (!isLinux) {return 'unknown';}

    const waylandDisplay = process.env.WAYLAND_DISPLAY;
    const xdgSessionType = (process.env.XDG_SESSION_TYPE || '').toLowerCase();

    if (waylandDisplay || xdgSessionType === 'wayland') {return 'wayland';}
    if (process.env.DISPLAY || xdgSessionType === 'x11') {return 'x11';}

    return 'unknown';
}


export interface SystemInfo {

    platform: NodeJS.Platform;

    osRelease: string;

    osType: string;

    arch: string;

    cpuCores: number;

    totalMemory: number;

    freeMemory: number;

    memoryUsagePercent: number;

    uptime: number;

    homeDir: string;

    hostname: string;

    electronVersion: string;

    nodeVersion: string;

    chromeVersion: string;

    v8Version: string;

    appVersion: string;

    linuxDesktop?: LinuxDesktopEnvironment;

    displayServer?: DisplayServer;
}


export function getSystemInfo(): SystemInfo {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    const info: SystemInfo = {
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


export function getOSDisplayName(): string {
    if (isMacOS) {
        return `macOS ${os.release()}`;
    }
    if (isWindows) {
        const release = os.release();

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


export function formatMemory(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
}


export function isTraySupported(): boolean {
    if (isMacOS || isWindows) {return true;}
    if (isLinux) {
        const desktop = detectLinuxDesktop();

        return desktop !== 'unknown';
    }
    return false;
}


export function isNotificationsSupported(): boolean {

    return isMacOS || isWindows || isLinux;
}


export function isGlobalShortcutsSupported(): boolean {
    if (isLinux) {

        return detectDisplayServer() !== 'wayland';
    }
    return true;
}
