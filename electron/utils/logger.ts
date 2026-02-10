/**
 * =============================================================================
 * Logger Utility — ZYNC Desktop Application
 * =============================================================================
 *
 * Structured logging utility for the Electron main process.
 * Provides log levels, timestamps, and module tagging.
 *
 * @module electron/utils/logger
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/** Log level severity */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4,
}

/** Map log level to string label */
const LEVEL_LABELS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.SILENT]: 'SILENT',
};

/** Current minimum log level (messages below this are suppressed) */
let currentLevel: LogLevel = LogLevel.DEBUG;

/**
 * Sets the minimum log level.
 * @param {LogLevel} level - Minimum level to display
 */
export function setLogLevel(level: LogLevel): void {
    currentLevel = level;
}

/**
 * Formats a log message with timestamp and module tag.
 * @param {LogLevel} level - Severity level
 * @param {string} module - Module name (e.g., 'Main', 'IPC')
 * @param {string} message - Log message
 * @returns {string} Formatted log string
 */
function formatMessage(level: LogLevel, module: string, message: string): string {
    const timestamp = new Date().toISOString();
    const label = LEVEL_LABELS[level];
    return `[${timestamp}] [${label}] [${module}] ${message}`;
}

/**
 * Creates a scoped logger for a specific module.
 *
 * @param {string} module - Module name to tag all messages with
 * @returns Logger interface with debug, info, warn, error methods
 *
 * @example
 * ```typescript
 * const log = createLogger('Main');
 * log.info('Application started');
 * log.error('Failed to create window', error);
 * ```
 */
export function createLogger(module: string) {
    return {
        debug(message: string, ...args: unknown[]): void {
            if (currentLevel <= LogLevel.DEBUG) {
                console.log(formatMessage(LogLevel.DEBUG, module, message), ...args);
            }
        },

        info(message: string, ...args: unknown[]): void {
            if (currentLevel <= LogLevel.INFO) {
                console.info(formatMessage(LogLevel.INFO, module, message), ...args);
            }
        },

        warn(message: string, ...args: unknown[]): void {
            if (currentLevel <= LogLevel.WARN) {
                console.warn(formatMessage(LogLevel.WARN, module, message), ...args);
            }
        },

        error(message: string, ...args: unknown[]): void {
            if (currentLevel <= LogLevel.ERROR) {
                console.error(formatMessage(LogLevel.ERROR, module, message), ...args);
            }
        },
    };
}

/** Default logger instance */
export const logger = createLogger('App');
