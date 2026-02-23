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
import { BrowserWindow } from 'electron';
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
export declare function initCrashReporter(userConfig?: Partial<CrashReporterConfig>): void;
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
export declare function attachRendererCrashHandler(window: BrowserWindow, label?: string): void;
/**
 * Gets recent crash events from memory.
 *
 * @param {number} [limit=10] - Maximum number of events to return
 * @returns {CrashEvent[]} Recent crash events, newest first
 */
export declare function getRecentCrashes(limit?: number): CrashEvent[];
/**
 * Gets the total number of crashes since the app was started.
 *
 * @returns {number} Total crash count
 */
export declare function getCrashCount(): number;
/**
 * Gets the crash log directory path.
 *
 * @returns {string} Absolute path to the crash logs directory
 */
export declare function getCrashLogDir(): string;
/**
 * Reads all crash log files from disk.
 *
 * @returns {Promise<CrashEvent[]>} Array of crash events from disk
 */
export declare function readCrashLogs(): Promise<CrashEvent[]>;
/**
 * Clears all local crash logs.
 *
 * @returns {Promise<number>} Number of files deleted
 */
export declare function clearCrashLogs(): Promise<number>;
/**
 * Rotates crash logs to maintain the configured maximum count.
 *
 * Deletes the oldest logs when the count exceeds `maxLocalLogs`.
 *
 * @returns {Promise<number>} Number of logs rotated (deleted)
 */
export declare function rotateCrashLogs(): Promise<number>;
