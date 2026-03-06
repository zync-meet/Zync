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
export declare function getMemoryUsage(): MemoryInfo;
export declare function getFormattedMemoryUsage(): Record<string, string>;
export declare function getSystemMemory(): {
    total: string;
    free: string;
    used: string;
    usagePercent: number;
};
export declare function getCPUInfo(): {
    model: string;
    cores: number;
    speed: number;
};
export declare function getAppUptime(): string;
export declare function getSystemUptime(): string;
export declare function generateDiagnosticReport(): DiagnosticReport;
export declare function getDiagnosticSummary(): string;
