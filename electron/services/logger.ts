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

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Constants
// =============================================================================

/** Log level hierarchy (lower number = higher priority) */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5,
};

/** Default configuration */
const DEFAULT_CONFIG: LoggerConfig = {
    minLevel: 'info',
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    logDir: '',
    console: true,
    file: true,
    jsonFormat: false,
};

/** ANSI color codes for console output */
const LEVEL_COLORS: Record<LogLevel, string> = {
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
    info: '\x1b[36m',    // Cyan
    verbose: '\x1b[35m', // Magenta
    debug: '\x1b[90m',   // Gray
    silly: '\x1b[90m',   // Gray
};

const RESET_COLOR = '\x1b[0m';

// =============================================================================
// Logger Class
// =============================================================================

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
export class Logger {
    // =========================================================================
    // Static Members
    // =========================================================================

    /** Shared configuration */
    private static config: LoggerConfig = { ...DEFAULT_CONFIG };

    /** All created logger instances */
    private static instances: Map<string, Logger> = new Map();

    /** Current log file write stream */
    private static fileStream: fs.WriteStream | null = null;

    /** Current log file path */
    private static currentLogFile: string = '';

    /** Bytes written to current log file */
    private static bytesWritten = 0;

    // =========================================================================
    // Instance Members
    // =========================================================================

    /** Scope name for this logger instance */
    private scope: string;

    // =========================================================================
    // Constructor
    // =========================================================================

    private constructor(scope: string) {
        this.scope = scope;
    }

    // =========================================================================
    // Static: Configuration
    // =========================================================================

    /**
     * Initialize the logger system with configuration.
     *
     * @param config — Partial configuration to merge with defaults
     */
    static initialize(config: Partial<LoggerConfig> = {}): void {
        Logger.config = { ...DEFAULT_CONFIG, ...config };

        // Resolve log directory
        if (!Logger.config.logDir) {
            try {
                Logger.config.logDir = path.join(app.getPath('userData'), 'logs');
            } catch {
                Logger.config.logDir = path.join(process.cwd(), 'logs');
            }
        }

        // Ensure log directory exists
        if (Logger.config.file) {
            try {
                fs.mkdirSync(Logger.config.logDir, { recursive: true });
            } catch (err) {
                console.error('[LOGGER] Failed to create log directory:', err);
                Logger.config.file = false;
            }
        }

        // Open initial log file
        if (Logger.config.file) {
            Logger.openLogFile();
        }
    }

    /**
     * Create or retrieve a scoped logger instance.
     *
     * @param scope — Module/component name for log prefixing
     * @returns Logger instance
     */
    static create(scope: string): Logger {
        let instance = Logger.instances.get(scope);

        if (!instance) {
            instance = new Logger(scope);
            Logger.instances.set(scope, instance);
        }

        return instance;
    }

    // =========================================================================
    // Log Methods
    // =========================================================================

    /** Log an error message */
    error(message: string, data?: unknown): void {
        this.log('error', message, data);
    }

    /** Log a warning message */
    warn(message: string, data?: unknown): void {
        this.log('warn', message, data);
    }

    /** Log an informational message */
    info(message: string, data?: unknown): void {
        this.log('info', message, data);
    }

    /** Log a verbose message */
    verbose(message: string, data?: unknown): void {
        this.log('verbose', message, data);
    }

    /** Log a debug message */
    debug(message: string, data?: unknown): void {
        this.log('debug', message, data);
    }

    /** Log a silly (trace) message */
    silly(message: string, data?: unknown): void {
        this.log('silly', message, data);
    }

    // =========================================================================
    // Core Log Method
    // =========================================================================

    /**
     * Core log method. Checks level, formats entry, writes to outputs.
     */
    private log(level: LogLevel, message: string, data?: unknown): void {
        // Check if this level should be logged
        if (LOG_LEVEL_PRIORITY[level] > LOG_LEVEL_PRIORITY[Logger.config.minLevel]) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            scope: this.scope,
            message,
        };

        if (data !== undefined) {
            if (data instanceof Error) {
                entry.data = { message: data.message, name: data.name };
                entry.stack = data.stack;
            } else {
                entry.data = data;
            }
        }

        // Write to console
        if (Logger.config.console) {
            Logger.writeToConsole(entry);
        }

        // Write to file
        if (Logger.config.file) {
            Logger.writeToFile(entry);
        }
    }

    // =========================================================================
    // Output Writers
    // =========================================================================

    /**
     * Write a log entry to the console with colors.
     */
    private static writeToConsole(entry: LogEntry): void {
        const color = LEVEL_COLORS[entry.level];
        const levelPad = entry.level.toUpperCase().padEnd(7);
        const time = entry.timestamp.split('T')[1]?.slice(0, 12) ?? '';
        const prefix = `${color}${levelPad}${RESET_COLOR}`;
        const scopeTag = `[${entry.scope}]`;

        let line = `${time} ${prefix} ${scopeTag} ${entry.message}`;

        if (entry.data) {
            line += ` ${JSON.stringify(entry.data)}`;
        }

        if (entry.stack) {
            line += `\n${entry.stack}`;
        }

        // Use appropriate console method
        switch (entry.level) {
            case 'error':
                console.error(line);
                break;
            case 'warn':
                console.warn(line);
                break;
            default:
                console.log(line);
        }
    }

    /**
     * Write a log entry to the current log file.
     */
    private static writeToFile(entry: LogEntry): void {
        if (!Logger.fileStream) return;

        let line: string;

        if (Logger.config.jsonFormat) {
            line = JSON.stringify(entry) + '\n';
        } else {
            const levelPad = entry.level.toUpperCase().padEnd(7);
            line = `${entry.timestamp} ${levelPad} [${entry.scope}] ${entry.message}`;

            if (entry.data) {
                line += ` | ${JSON.stringify(entry.data)}`;
            }

            if (entry.stack) {
                line += `\n${entry.stack}`;
            }

            line += '\n';
        }

        const bytes = Buffer.byteLength(line, 'utf-8');
        Logger.bytesWritten += bytes;

        Logger.fileStream.write(line);

        // Rotate if size exceeded
        if (Logger.bytesWritten >= Logger.config.maxFileSize) {
            Logger.rotateLogFile();
        }
    }

    // =========================================================================
    // File Management
    // =========================================================================

    /**
     * Open a new log file for writing.
     */
    private static openLogFile(): void {
        const filename = `zync-${new Date().toISOString().split('T')[0]}.log`;
        Logger.currentLogFile = path.join(Logger.config.logDir, filename);

        try {
            Logger.fileStream = fs.createWriteStream(Logger.currentLogFile, {
                flags: 'a', // Append mode
                encoding: 'utf-8',
            });
            Logger.bytesWritten = 0;

            // Check existing file size
            try {
                const stats = fs.statSync(Logger.currentLogFile);
                Logger.bytesWritten = stats.size;
            } catch {
                // File doesn't exist yet, that's fine
            }
        } catch (err) {
            console.error('[LOGGER] Failed to open log file:', err);
            Logger.fileStream = null;
        }
    }

    /**
     * Rotate log files when the current file exceeds maxFileSize.
     */
    private static rotateLogFile(): void {
        // Close current stream
        if (Logger.fileStream) {
            Logger.fileStream.end();
            Logger.fileStream = null;
        }

        // Rename old log files
        try {
            const files = fs
                .readdirSync(Logger.config.logDir)
                .filter((f) => f.startsWith('zync-') && f.endsWith('.log'))
                .sort()
                .reverse();

            // Remove excess files
            while (files.length >= Logger.config.maxFiles) {
                const oldest = files.pop();
                if (oldest) {
                    fs.unlinkSync(path.join(Logger.config.logDir, oldest));
                }
            }
        } catch (err) {
            console.error('[LOGGER] Failed to rotate log files:', err);
        }

        // Open new file
        Logger.openLogFile();
    }

    // =========================================================================
    // Cleanup
    // =========================================================================

    /**
     * Close the logger and flush all buffers.
     */
    static dispose(): void {
        if (Logger.fileStream) {
            Logger.fileStream.end();
            Logger.fileStream = null;
        }

        Logger.instances.clear();
        Logger.bytesWritten = 0;
    }
}
