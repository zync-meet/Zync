/**
 * =============================================================================
 * Logger Service — ZYNC Desktop
 * =============================================================================
 *
 * Structured logging service wrapping electron-log with support for:
 * - Multiple log levels (error, warn, info, verbose, debug, silly)
 * - File rotation (max 5 files, 5MB each)
 * - Structured JSON output for file transport
 * - Console pretty-printing for development
 * - Scoped logger creation for per-module prefixing
 *
 * @module electron/services/logger
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/** Supported log levels in order of verbosity */
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
/** Structured log entry */
export interface LogEntry {
    /** ISO 8601 timestamp */
    timestamp: string;
    /** Log level */
    level: LogLevel;
    /** Logger scope/module name */
    scope: string;
    /** Log message */
    message: string;
    /** Optional additional data */
    data?: unknown;
    /** Error stack trace (if applicable) */
    stack?: string;
}
/** Logger configuration */
export interface LoggerConfig {
    /** Minimum log level to output */
    minLevel: LogLevel;
    /** Maximum number of log files to keep */
    maxFiles: number;
    /** Maximum size per log file in bytes */
    maxFileSize: number;
    /** Directory for log files */
    logDir: string;
    /** Whether to log to console */
    console: boolean;
    /** Whether to log to file */
    file: boolean;
    /** Whether to use JSON format for file output */
    jsonFormat: boolean;
}
/**
 * Structured logger with file rotation and scoped instances.
 *
 * @example
 * ```ts
 * const log = Logger.create('main');
 * log.info('Application starting');
 * log.error('Failed to load', { code: 'ERR_LOAD' });
 * ```
 */
export declare class Logger {
    /** Shared configuration */
    private static config;
    /** All created logger instances */
    private static instances;
    /** Current log file write stream */
    private static fileStream;
    /** Current log file path */
    private static currentLogFile;
    /** Bytes written to current log file */
    private static bytesWritten;
    /** Scope name for this logger instance */
    private scope;
    private constructor();
    /**
     * Initialize the logger system with configuration.
     *
     * @param config — Partial configuration to merge with defaults
     */
    static initialize(config?: Partial<LoggerConfig>): void;
    /**
     * Create or retrieve a scoped logger instance.
     *
     * @param scope — Module/component name for log prefixing
     * @returns Logger instance
     */
    static create(scope: string): Logger;
    /** Log an error message */
    error(message: string, data?: unknown): void;
    /** Log a warning message */
    warn(message: string, data?: unknown): void;
    /** Log an informational message */
    info(message: string, data?: unknown): void;
    /** Log a verbose message */
    verbose(message: string, data?: unknown): void;
    /** Log a debug message */
    debug(message: string, data?: unknown): void;
    /** Log a silly (trace) message */
    silly(message: string, data?: unknown): void;
    /**
     * Core log method. Checks level, formats entry, writes to outputs.
     */
    private log;
    /**
     * Write a log entry to the console with colors.
     */
    private static writeToConsole;
    /**
     * Write a log entry to the current log file.
     */
    private static writeToFile;
    /**
     * Open a new log file for writing.
     */
    private static openLogFile;
    /**
     * Rotate log files when the current file exceeds maxFileSize.
     */
    private static rotateLogFile;
    /**
     * Close the logger and flush all buffers.
     */
    static dispose(): void;
}
