export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4,
}


const LEVEL_LABELS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.SILENT]: 'SILENT',
};


let currentLevel: LogLevel = LogLevel.DEBUG;


export function setLogLevel(level: LogLevel): void {
    currentLevel = level;
}


function formatMessage(level: LogLevel, module: string, message: string): string {
    const timestamp = new Date().toISOString();
    const label = LEVEL_LABELS[level];
    return `[${timestamp}] [${label}] [${module}] ${message}`;
}


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


export const logger = createLogger('App');
