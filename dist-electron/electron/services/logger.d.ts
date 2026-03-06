export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    scope: string;
    message: string;
    data?: unknown;
    stack?: string;
}
export interface LoggerConfig {
    minLevel: LogLevel;
    maxFiles: number;
    maxFileSize: number;
    logDir: string;
    console: boolean;
    file: boolean;
    jsonFormat: boolean;
}
export declare class Logger {
    private static config;
    private static instances;
    private static fileStream;
    private static currentLogFile;
    private static bytesWritten;
    private scope;
    private constructor();
    static initialize(config?: Partial<LoggerConfig>): void;
    static create(scope: string): Logger;
    error(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    verbose(message: string, data?: unknown): void;
    debug(message: string, data?: unknown): void;
    silly(message: string, data?: unknown): void;
    private log;
    private static writeToConsole;
    private static writeToFile;
    private static openLogFile;
    private static rotateLogFile;
    static dispose(): void;
}
