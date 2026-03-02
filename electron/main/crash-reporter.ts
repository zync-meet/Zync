import { app, BrowserWindow, crashReporter, dialog } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';


export interface CrashReporterConfig {

    enabled: boolean;

    submitURL?: string;

    uploadToServer: boolean;

    extra?: Record<string, string>;

    maxLocalLogs: number;

    showCrashDialog: boolean;

    autoRecoverRenderer: boolean;
}


export interface CrashEvent {

    id: string;

    timestamp: string;

    type: 'renderer-crash' | 'renderer-killed' | 'unhandled-exception' | 'unhandled-rejection' | 'native-crash';

    message: string;

    stack?: string;

    process: 'main' | 'renderer' | 'gpu' | 'utility';

    reason?: string;

    exitCode?: number;

    appVersion: string;

    electronVersion: string;

    platform: string;

    arch: string;
}


const DEFAULT_CONFIG: CrashReporterConfig = {
    enabled: true,
    submitURL: undefined,
    uploadToServer: false,
    extra: {},
    maxLocalLogs: 20,
    showCrashDialog: !app.isPackaged,
    autoRecoverRenderer: true,
};


let config: CrashReporterConfig = { ...DEFAULT_CONFIG };


let isInitialized = false;


let crashLogDir: string;


const recentCrashes: CrashEvent[] = [];


const MAX_MEMORY_CRASHES = 50;


export function initCrashReporter(userConfig?: Partial<CrashReporterConfig>): void {
    if (isInitialized) {
        console.warn('[CrashReporter] Already initialized');
        return;
    }

    config = { ...DEFAULT_CONFIG, ...userConfig };
    crashLogDir = join(app.getPath('userData'), 'crash-reports');

    if (!config.enabled) {
        console.info('[CrashReporter] Crash reporting is disabled');
        isInitialized = true;
        return;
    }


    if (config.submitURL) {
        crashReporter.start({
            submitURL: config.submitURL,
            uploadToServer: config.uploadToServer,
            extra: {
                appVersion: app.getVersion(),
                electronVersion: process.versions.electron,
                platform: process.platform,
                arch: process.arch,
                ...config.extra,
            },
        });
        console.info(`[CrashReporter] Native crash reporter started (upload: ${config.uploadToServer})`);
    } else {
        console.info('[CrashReporter] Native crash reporter skipped (no submitURL)');
    }


    process.on('uncaughtException', (error: Error) => {
        const event = createCrashEvent(
            'unhandled-exception',
            error.message,
            'main',
            error.stack,
        );
        recordCrash(event);

        console.error(`[CrashReporter] Uncaught Exception:`, error);

        if (config.showCrashDialog) {
            showCrashDialog(event);
        }
    });


    process.on('unhandledRejection', (reason: unknown) => {
        const message = reason instanceof Error
            ? reason.message
            : String(reason);

        const stack = reason instanceof Error
            ? reason.stack
            : undefined;

        const event = createCrashEvent(
            'unhandled-rejection',
            message,
            'main',
            stack,
        );
        recordCrash(event);

        console.error(`[CrashReporter] Unhandled Rejection:`, reason);
    });


    ensureCrashLogDir().catch((err) => {
        console.error(`[CrashReporter] Failed to create crash log directory: ${err}`);
    });

    isInitialized = true;
    console.info('[CrashReporter] Initialized successfully');
}


export function attachRendererCrashHandler(
    window: BrowserWindow,
    label: string = 'main',
): void {
    window.webContents.on('render-process-gone', (_event, details) => {
        const event = createCrashEvent(
            details.reason === 'killed' ? 'renderer-killed' : 'renderer-crash',
            `Renderer process gone: ${details.reason}`,
            'renderer',
            undefined,
        );
        event.reason = details.reason;
        event.exitCode = details.exitCode;

        recordCrash(event);

        console.error(
            `[CrashReporter] Renderer [${label}] gone: reason=${details.reason}, exitCode=${details.exitCode}`,
        );


        if (config.autoRecoverRenderer && details.reason !== 'killed') {
            console.info(`[CrashReporter] Attempting auto-recovery for window [${label}]...`);

            try {
                if (!window.isDestroyed()) {
                    window.webContents.reload();
                    console.info(`[CrashReporter] Auto-recovery reload triggered for [${label}]`);
                }
            } catch (err) {
                console.error(`[CrashReporter] Auto-recovery failed for [${label}]:`, err);
            }
        }


        if (config.showCrashDialog && details.reason !== 'clean-exit') {
            showCrashDialog(event);
        }
    });


    app.on('child-process-gone', (_event, details) => {
        if (details.type === 'GPU') {
            const event = createCrashEvent(
                'renderer-crash',
                `GPU process gone: ${details.reason}`,
                'gpu',
                undefined,
            );
            event.reason = details.reason;
            event.exitCode = details.exitCode;
            recordCrash(event);
            console.error(`[CrashReporter] GPU process gone: ${details.reason}`);
        }
    });

    console.info(`[CrashReporter] Renderer crash handler attached for window [${label}]`);
}


export function getRecentCrashes(limit: number = 10): CrashEvent[] {
    return recentCrashes.slice(-limit).reverse();
}


export function getCrashCount(): number {
    return recentCrashes.length;
}


export function getCrashLogDir(): string {
    return crashLogDir;
}


export async function readCrashLogs(): Promise<CrashEvent[]> {
    try {
        const exists = await directoryExists(crashLogDir);
        if (!exists) return [];

        const files = await fs.readdir(crashLogDir);
        const logs: CrashEvent[] = [];

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            try {
                const content = await fs.readFile(join(crashLogDir, file), 'utf-8');
                const event = JSON.parse(content) as CrashEvent;
                logs.push(event);
            } catch {

            }
        }


        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return logs;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CrashReporter] Failed to read crash logs: ${message}`);
        return [];
    }
}


export async function clearCrashLogs(): Promise<number> {
    let deleted = 0;

    try {
        const exists = await directoryExists(crashLogDir);
        if (!exists) return 0;

        const files = await fs.readdir(crashLogDir);
        for (const file of files) {
            try {
                await fs.unlink(join(crashLogDir, file));
                deleted++;
            } catch {

            }
        }

        recentCrashes.length = 0;
        console.info(`[CrashReporter] Cleared ${deleted} crash logs`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CrashReporter] Failed to clear crash logs: ${message}`);
    }

    return deleted;
}


export async function rotateCrashLogs(): Promise<number> {
    let rotated = 0;

    try {
        const exists = await directoryExists(crashLogDir);
        if (!exists) return 0;

        const files = await fs.readdir(crashLogDir);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        if (jsonFiles.length <= config.maxLocalLogs) return 0;


        jsonFiles.sort();

        const toDelete = jsonFiles.slice(0, jsonFiles.length - config.maxLocalLogs);
        for (const file of toDelete) {
            try {
                await fs.unlink(join(crashLogDir, file));
                rotated++;
            } catch {

            }
        }

        if (rotated > 0) {
            console.info(`[CrashReporter] Rotated ${rotated} crash logs`);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CrashReporter] Failed to rotate crash logs: ${message}`);
    }

    return rotated;
}


function createCrashEvent(
    type: CrashEvent['type'],
    message: string,
    processType: CrashEvent['process'],
    stack?: string,
): CrashEvent {
    return {
        id: `crash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        type,
        message,
        stack,
        process: processType,
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        platform: process.platform,
        arch: process.arch,
    };
}


function recordCrash(event: CrashEvent): void {

    recentCrashes.push(event);
    if (recentCrashes.length > MAX_MEMORY_CRASHES) {
        recentCrashes.shift();
    }


    writeCrashLog(event).catch((err) => {
        console.error(`[CrashReporter] Failed to write crash log: ${err}`);
    });
}


async function writeCrashLog(event: CrashEvent): Promise<void> {
    try {
        await ensureCrashLogDir();

        const filename = `${event.timestamp.replace(/[:.]/g, '-')}_${event.type}_${event.id}.json`;
        const filepath = join(crashLogDir, filename);

        await fs.writeFile(filepath, JSON.stringify(event, null, 2), 'utf-8');


        await rotateCrashLogs();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CrashReporter] Failed to persist crash event: ${message}`);
    }
}


async function ensureCrashLogDir(): Promise<void> {
    try {
        await fs.mkdir(crashLogDir, { recursive: true });
    } catch {

    }
}


async function directoryExists(path: string): Promise<boolean> {
    try {
        const stat = await fs.stat(path);
        return stat.isDirectory();
    } catch {
        return false;
    }
}


function showCrashDialog(event: CrashEvent): void {
    try {
        dialog.showMessageBox({
            type: 'error',
            title: 'ZYNC — Crash Detected',
            message: `A ${event.process} process crash was detected.`,
            detail: [
                `Type: ${event.type}`,
                `Message: ${event.message}`,
                event.reason ? `Reason: ${event.reason}` : null,
                `Time: ${event.timestamp}`,
                '',
                'The crash has been logged locally.',
                'You can continue using the application.',
            ].filter(Boolean).join('\n'),
            buttons: ['OK', 'Open Crash Logs'],
            defaultId: 0,
        }).then((result) => {
            if (result.response === 1) {

                const { shell } = require('electron');
                shell.openPath(crashLogDir);
            }
        }).catch(() => {

        });
    } catch {

        console.error('[CrashReporter] Failed to show crash dialog');
    }
}
