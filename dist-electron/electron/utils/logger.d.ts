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
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4
}
/**
 * Sets the minimum log level.
 * @param {LogLevel} level - Minimum level to display
 */
export declare function setLogLevel(level: LogLevel): void;
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
export declare function createLogger(module: string): {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
};
/** Default logger instance */
export declare const logger: {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
};
