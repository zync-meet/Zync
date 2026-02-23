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
/** CPU usage information */
export interface CPUUsageInfo {
    /** Percentage of CPU time spent in user mode (0-100) */
    percentCPUUsage: number;
    /** Number of microseconds of idle CPU time since last call */
    idleWakeupsPerSecond: number;
}
/** Memory usage information in bytes */
export interface MemoryInfo {
    /** RSS (Resident Set Size) - total memory allocated */
    rss: number;
    /** Memory used by V8 heap */
    heapUsed: number;
    /** Total V8 heap allocated */
    heapTotal: number;
    /** Memory used outside V8 heap (Buffers, etc.) */
    external: number;
    /** Array buffers size */
    arrayBuffers: number;
}
/** GPU information */
export interface GPUInfo {
    /** GPU vendor string */
    vendor: string;
    /** GPU renderer string */
    renderer: string;
    /** Whether hardware acceleration is enabled */
    hardwareAcceleration: boolean;
}
/** Complete diagnostic report */
export interface DiagnosticReport {
    /** Application info */
    app: {
        name: string;
        version: string;
        isPackaged: boolean;
        locale: string;
        uptime: number;
    };
    /** Electron/Node/Chrome versions */
    runtime: {
        electron: string;
        node: string;
        chrome: string;
        v8: string;
    };
    /** Operating system info */
    os: {
        platform: NodeJS.Platform;
        release: string;
        type: string;
        arch: string;
        hostname: string;
    };
    /** Hardware info */
    hardware: {
        cpuModel: string;
        cpuCores: number;
        totalMemory: string;
        freeMemory: string;
        memoryUsage: string;
    };
    /** Process metrics */
    process: {
        pid: number;
        memory: MemoryInfo;
        uptime: number;
    };
    /** Paths */
    paths: {
        userData: string;
        temp: string;
        logs: string;
        exe: string;
    };
    /** Timestamp */
    timestamp: string;
}
/**
 * Get the current process memory usage.
 *
 * @returns {MemoryInfo} Memory usage in bytes
 */
export declare function getMemoryUsage(): MemoryInfo;
/**
 * Get formatted memory usage for display.
 *
 * @returns {Record<string, string>} Formatted memory values
 */
export declare function getFormattedMemoryUsage(): Record<string, string>;
/**
 * Get system memory information.
 *
 * @returns {{ total: string; free: string; used: string; usagePercent: number }}
 */
export declare function getSystemMemory(): {
    total: string;
    free: string;
    used: string;
    usagePercent: number;
};
/**
 * Get CPU model and core count.
 *
 * @returns {{ model: string; cores: number; speed: number }}
 */
export declare function getCPUInfo(): {
    model: string;
    cores: number;
    speed: number;
};
/**
 * Get app uptime in a human-readable format.
 *
 * @returns {string} Formatted uptime (e.g., "1h 30m 15s")
 */
export declare function getAppUptime(): string;
/**
 * Get system uptime in a human-readable format.
 *
 * @returns {string} Formatted uptime
 */
export declare function getSystemUptime(): string;
/**
 * Generate a complete diagnostic report.
 *
 * This report is useful for crash reports, bug reports, and the
 * settings → About section.
 *
 * @returns {DiagnosticReport} Full diagnostic report
 */
export declare function generateDiagnosticReport(): DiagnosticReport;
/**
 * Generate a summary string for quick diagnostics.
 *
 * @returns {string} Multi-line summary string
 */
export declare function getDiagnosticSummary(): string;
