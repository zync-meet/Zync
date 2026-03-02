import { app } from 'electron';
import * as os from 'os';


export interface CPUUsageInfo {

    percentCPUUsage: number;

    idleWakeupsPerSecond: number;
}


export interface MemoryInfo {

    rss: number;

    heapUsed: number;

    heapTotal: number;

    external: number;

    arrayBuffers: number;
}


export interface GPUInfo {

    vendor: string;

    renderer: string;

    hardwareAcceleration: boolean;
}


export interface DiagnosticReport {

    app: {
        name: string;
        version: string;
        isPackaged: boolean;
        locale: string;
        uptime: number;
    };

    runtime: {
        electron: string;
        node: string;
        chrome: string;
        v8: string;
    };

    os: {
        platform: NodeJS.Platform;
        release: string;
        type: string;
        arch: string;
        hostname: string;
    };

    hardware: {
        cpuModel: string;
        cpuCores: number;
        totalMemory: string;
        freeMemory: string;
        memoryUsage: string;
    };

    process: {
        pid: number;
        memory: MemoryInfo;
        uptime: number;
    };

    paths: {
        userData: string;
        temp: string;
        logs: string;
        exe: string;
    };

    timestamp: string;
}


function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}


function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}


export function getMemoryUsage(): MemoryInfo {
    const usage = process.memoryUsage();
    return {
        rss: usage.rss,
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0,
    };
}


export function getFormattedMemoryUsage(): Record<string, string> {
    const mem = getMemoryUsage();
    return {
        rss: formatBytes(mem.rss),
        heapUsed: formatBytes(mem.heapUsed),
        heapTotal: formatBytes(mem.heapTotal),
        external: formatBytes(mem.external),
        arrayBuffers: formatBytes(mem.arrayBuffers),
    };
}


export function getSystemMemory(): {
    total: string;
    free: string;
    used: string;
    usagePercent: number;
} {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
        total: formatBytes(total),
        free: formatBytes(free),
        used: formatBytes(used),
        usagePercent: Math.round((used / total) * 100),
    };
}


export function getCPUInfo(): { model: string; cores: number; speed: number } {
    const cpus = os.cpus();
    return {
        model: cpus.length > 0 ? cpus[0].model.trim() : 'Unknown',
        cores: cpus.length,
        speed: cpus.length > 0 ? cpus[0].speed : 0,
    };
}


export function getAppUptime(): string {
    return formatDuration(process.uptime());
}


export function getSystemUptime(): string {
    return formatDuration(os.uptime());
}


export function generateDiagnosticReport(): DiagnosticReport {
    const cpuInfo = getCPUInfo();
    const sysMemory = getSystemMemory();

    return {
        app: {
            name: app.getName(),
            version: app.getVersion(),
            isPackaged: app.isPackaged,
            locale: app.getLocale(),
            uptime: process.uptime(),
        },
        runtime: {
            electron: process.versions.electron,
            node: process.versions.node,
            chrome: process.versions.chrome,
            v8: process.versions.v8,
        },
        os: {
            platform: process.platform,
            release: os.release(),
            type: os.type(),
            arch: process.arch,
            hostname: os.hostname(),
        },
        hardware: {
            cpuModel: cpuInfo.model,
            cpuCores: cpuInfo.cores,
            totalMemory: sysMemory.total,
            freeMemory: sysMemory.free,
            memoryUsage: `${sysMemory.usagePercent}%`,
        },
        process: {
            pid: process.pid,
            memory: getMemoryUsage(),
            uptime: process.uptime(),
        },
        paths: {
            userData: app.getPath('userData'),
            temp: app.getPath('temp'),
            logs: app.getPath('logs'),
            exe: app.getPath('exe'),
        },
        timestamp: new Date().toISOString(),
    };
}


export function getDiagnosticSummary(): string {
    const report = generateDiagnosticReport();
    const lines = [
        `ZYNC Diagnostic Summary`,
        `═══════════════════════════════════`,
        `App: ${report.app.name} v${report.app.version} (${report.app.isPackaged ? 'production' : 'development'})`,
        `Electron: ${report.runtime.electron} | Node: ${report.runtime.node} | Chrome: ${report.runtime.chrome}`,
        `OS: ${report.os.type} ${report.os.release} (${report.os.arch})`,
        `CPU: ${report.hardware.cpuModel} (${report.hardware.cpuCores} cores)`,
        `Memory: ${report.hardware.memoryUsage} used (${report.hardware.freeMemory} free / ${report.hardware.totalMemory} total)`,
        `Process RSS: ${formatBytes(report.process.memory.rss)}`,
        `App Uptime: ${getAppUptime()}`,
        `PID: ${report.process.pid}`,
        `Generated: ${report.timestamp}`,
    ];
    return lines.join('\n');
}
