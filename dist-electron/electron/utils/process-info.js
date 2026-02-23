/**
 * =============================================================================
 * Process Information Collector — ZYNC Desktop
 * =============================================================================
 *
 * Collects and formats system process and performance metrics for diagnostics,
 * crash reports, and the "About" dialog in settings.
 *
 * @module electron/utils/process-info
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { app } from 'electron';
import * as os from 'os';
// =============================================================================
// Utility Functions
// =============================================================================
/**
 * Format bytes into a human-readable string.
 *
 * @param {number} bytes - Number of bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted string (e.g., "256.12 MB")
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
/**
 * Format seconds into a human-readable duration string.
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string (e.g., "2h 15m 30s")
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}
// =============================================================================
// Process Info Functions
// =============================================================================
/**
 * Get the current process memory usage.
 *
 * @returns {MemoryInfo} Memory usage in bytes
 */
export function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss: usage.rss,
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0,
    };
}
/**
 * Get formatted memory usage for display.
 *
 * @returns {Record<string, string>} Formatted memory values
 */
export function getFormattedMemoryUsage() {
    const mem = getMemoryUsage();
    return {
        rss: formatBytes(mem.rss),
        heapUsed: formatBytes(mem.heapUsed),
        heapTotal: formatBytes(mem.heapTotal),
        external: formatBytes(mem.external),
        arrayBuffers: formatBytes(mem.arrayBuffers),
    };
}
/**
 * Get system memory information.
 *
 * @returns {{ total: string; free: string; used: string; usagePercent: number }}
 */
export function getSystemMemory() {
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
/**
 * Get CPU model and core count.
 *
 * @returns {{ model: string; cores: number; speed: number }}
 */
export function getCPUInfo() {
    const cpus = os.cpus();
    return {
        model: cpus.length > 0 ? cpus[0].model.trim() : 'Unknown',
        cores: cpus.length,
        speed: cpus.length > 0 ? cpus[0].speed : 0,
    };
}
/**
 * Get app uptime in a human-readable format.
 *
 * @returns {string} Formatted uptime (e.g., "1h 30m 15s")
 */
export function getAppUptime() {
    return formatDuration(process.uptime());
}
/**
 * Get system uptime in a human-readable format.
 *
 * @returns {string} Formatted uptime
 */
export function getSystemUptime() {
    return formatDuration(os.uptime());
}
/**
 * Generate a complete diagnostic report.
 *
 * This report is useful for crash reports, bug reports, and the
 * settings → About section.
 *
 * @returns {DiagnosticReport} Full diagnostic report
 */
export function generateDiagnosticReport() {
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
/**
 * Generate a summary string for quick diagnostics.
 *
 * @returns {string} Multi-line summary string
 */
export function getDiagnosticSummary() {
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
//# sourceMappingURL=process-info.js.map