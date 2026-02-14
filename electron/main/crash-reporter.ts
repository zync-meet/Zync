/**
 * =============================================================================
 * Crash Reporter Module — ZYNC Desktop Application
 * =============================================================================
 *
 * Initializes and manages Electron's crash reporter for both the main
 * process and renderer processes. Captures unhandled exceptions, promise
 * rejections, and native crashes to help diagnose production issues.
 *
 * Reports are stored locally and can optionally be submitted to a crash
 * reporting endpoint. The module also maintains a rotating log of recent
 * crashes for local inspection.
 *
 * Architecture:
 * 1. Process-level crash reporting via Electron's crashReporter
 * 2. Unhandled exception catching in the main process
 * 3. Unhandled promise rejection catching
 * 4. Renderer process crash detection and recovery
 * 5. Local crash log rotation
 *
 * @module electron/main/crash-reporter
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { app, BrowserWindow, crashReporter, dialog } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Configuration for the crash reporter.
 *
 * @interface CrashReporterConfig
 */
export interface CrashReporterConfig {
    /** Whether crash reporting is enabled (default: true) */
    enabled: boolean;
    /** URL to submit crash reports to (optional) */
    submitURL?: string;
    /** Whether to upload crash reports automatically (default: false) */
    uploadToServer: boolean;
    /** Extra metadata to include with crash reports */
    extra?: Record<string, string>;
    /** Maximum number of local crash logs to retain (default: 20) */
    maxLocalLogs: number;
    /** Whether to show a dialog on crash (default: true in dev) */
    showCrashDialog: boolean;
    /** Whether to attempt auto-recovery on renderer crash (default: true) */
    autoRecoverRenderer: boolean;
}

/**
 * A recorded crash event.
 *
 * @interface CrashEvent
 */
export interface CrashEvent {
    /** Unique crash event ID */
    id: string;
    /** ISO timestamp of the crash */
    timestamp: string;
    /** Type of crash */
    type: 'renderer-crash' | 'renderer-killed' | 'unhandled-exception' | 'unhandled-rejection' | 'native-crash';
    /** Error message or reason */
    message: string;
    /** Stack trace if available */
    stack?: string;
    /** The process that crashed */
    process: 'main' | 'renderer' | 'gpu' | 'utility';
    /** Reason code from Electron (for render-process-gone) */
    reason?: string;
    /** Exit code from the crashed process */
    exitCode?: number;
    /** Application version at the time of crash */
    appVersion: string;
    /** Electron version */
    electronVersion: string;
    /** Platform */
    platform: string;
    /** Architecture */
    arch: string;
}

/**
 * Default configuration.
 *
 * @constant {CrashReporterConfig}
 */
const DEFAULT_CONFIG: CrashReporterConfig = {
    enabled: true,
    submitURL: undefined,
    uploadToServer: false,
    extra: {},
    maxLocalLogs: 20,
    showCrashDialog: !app.isPackaged,
    autoRecoverRenderer: true,
};

// =============================================================================
// State
// =============================================================================

/** Active configuration */
let config: CrashReporterConfig = { ...DEFAULT_CONFIG };

/** Whether the crash reporter has been initialized */
let isInitialized = false;

/** Path to the crash log directory */
let crashLogDir: string;

/** Recent crash events (in-memory) */
const recentCrashes: CrashEvent[] = [];

/** Max in-memory crash events */
const MAX_MEMORY_CRASHES = 50;

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initializes the crash reporter with the given configuration.
 *
 * Sets up:
 * 1. Electron's native crash reporter
 * 2. Main process unhandled exception handler
 * 3. Unhandled promise rejection handler
 * 4. Crash log directory
 *
 * @param {Partial<CrashReporterConfig>} [userConfig] - Configuration overrides
 *
 * @example
 * ```typescript
 * initCrashReporter({
 *   uploadToServer: false,
 *   maxLocalLogs: 30,
 *   extra: {
 *     userId: 'anonymous',
 *     build: '2024.1',
 *   },
 * });
 * ```
 */
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

    // =========================================================================
    // 1. Initialize Electron's native crash reporter
    // =========================================================================
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

    // =========================================================================
    // 2. Main process unhandled exception handler
    // =========================================================================
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

    // =========================================================================
    // 3. Unhandled promise rejection handler
    // =========================================================================
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

    // Ensure crash log directory exists
    ensureCrashLogDir().catch((err) => {
        console.error(`[CrashReporter] Failed to create crash log directory: ${err}`);
    });

    isInitialized = true;
    console.info('[CrashReporter] Initialized successfully');
}

/**
 * Attaches renderer crash detection to a BrowserWindow.
 *
 * Should be called for each BrowserWindow after creation. Listens for
 * the `render-process-gone` event and optionally auto-recovers.
 *
 * @param {BrowserWindow} window - The window to monitor
 * @param {string} [label='main'] - A label for identifying this window in logs
 *
 * @example
 * ```typescript
 * const mainWindow = new BrowserWindow({ ... });
 * attachRendererCrashHandler(mainWindow, 'main-window');
 * ```
 */
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

        // Auto-recovery for "crashed" and "oom" reasons
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

        // Show crash dialog for OOM and unexpected crashes
        if (config.showCrashDialog && details.reason !== 'clean-exit') {
            showCrashDialog(event);
        }
    });

    // Track GPU process crashes
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

// =============================================================================
// Crash Log Management
// =============================================================================

/**
 * Gets recent crash events from memory.
 *
 * @param {number} [limit=10] - Maximum number of events to return
 * @returns {CrashEvent[]} Recent crash events, newest first
 */
export function getRecentCrashes(limit: number = 10): CrashEvent[] {
    return recentCrashes.slice(-limit).reverse();
}

/**
 * Gets the total number of crashes since the app was started.
 *
 * @returns {number} Total crash count
 */
export function getCrashCount(): number {
    return recentCrashes.length;
}

/**
 * Gets the crash log directory path.
 *
 * @returns {string} Absolute path to the crash logs directory
 */
export function getCrashLogDir(): string {
    return crashLogDir;
}

/**
 * Reads all crash log files from disk.
 *
 * @returns {Promise<CrashEvent[]>} Array of crash events from disk
 */
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
                // Skip corrupt files
            }
        }

        // Sort by timestamp, newest first
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return logs;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CrashReporter] Failed to read crash logs: ${message}`);
        return [];
    }
}

/**
 * Clears all local crash logs.
 *
 * @returns {Promise<number>} Number of files deleted
 */
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
                // Skip files that can't be deleted
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

/**
 * Rotates crash logs to maintain the configured maximum count.
 *
 * Deletes the oldest logs when the count exceeds `maxLocalLogs`.
 *
 * @returns {Promise<number>} Number of logs rotated (deleted)
 */
export async function rotateCrashLogs(): Promise<number> {
    let rotated = 0;

    try {
        const exists = await directoryExists(crashLogDir);
        if (!exists) return 0;

        const files = await fs.readdir(crashLogDir);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        if (jsonFiles.length <= config.maxLocalLogs) return 0;

        // Sort by name (which includes timestamp) to get oldest first
        jsonFiles.sort();

        const toDelete = jsonFiles.slice(0, jsonFiles.length - config.maxLocalLogs);
        for (const file of toDelete) {
            try {
                await fs.unlink(join(crashLogDir, file));
                rotated++;
            } catch {
                // Skip files that can't be deleted
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

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Creates a CrashEvent object.
 *
 * @internal
 */
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

/**
 * Records a crash event in memory and on disk.
 *
 * @internal
 */
function recordCrash(event: CrashEvent): void {
    // Add to in-memory buffer
    recentCrashes.push(event);
    if (recentCrashes.length > MAX_MEMORY_CRASHES) {
        recentCrashes.shift();
    }

    // Write to disk asynchronously
    writeCrashLog(event).catch((err) => {
        console.error(`[CrashReporter] Failed to write crash log: ${err}`);
    });
}

/**
 * Writes a crash event to a JSON file on disk.
 *
 * @internal
 */
async function writeCrashLog(event: CrashEvent): Promise<void> {
    try {
        await ensureCrashLogDir();

        const filename = `${event.timestamp.replace(/[:.]/g, '-')}_${event.type}_${event.id}.json`;
        const filepath = join(crashLogDir, filename);

        await fs.writeFile(filepath, JSON.stringify(event, null, 2), 'utf-8');

        // Rotate if needed
        await rotateCrashLogs();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CrashReporter] Failed to persist crash event: ${message}`);
    }
}

/**
 * Ensures the crash log directory exists.
 *
 * @internal
 */
async function ensureCrashLogDir(): Promise<void> {
    try {
        await fs.mkdir(crashLogDir, { recursive: true });
    } catch {
        // Ignore if already exists
    }
}

/**
 * Checks if a directory exists.
 *
 * @internal
 */
async function directoryExists(path: string): Promise<boolean> {
    try {
        const stat = await fs.stat(path);
        return stat.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Shows a crash dialog to the user.
 *
 * @internal
 */
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
                // Open crash logs directory
                const { shell } = require('electron');
                shell.openPath(crashLogDir);
            }
        }).catch(() => {
            // Ignore dialog errors during crash handling
        });
    } catch {
        // If dialog fails during crash handling, just log it
        console.error('[CrashReporter] Failed to show crash dialog');
    }
}
