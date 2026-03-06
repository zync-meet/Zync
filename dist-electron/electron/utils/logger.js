export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 4] = "SILENT";
})(LogLevel || (LogLevel = {}));
const LEVEL_LABELS = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.SILENT]: 'SILENT',
};
let currentLevel = LogLevel.DEBUG;
export function setLogLevel(level) {
    currentLevel = level;
}
function formatMessage(level, module, message) {
    const timestamp = new Date().toISOString();
    const label = LEVEL_LABELS[level];
    return `[${timestamp}] [${label}] [${module}] ${message}`;
}
export function createLogger(module) {
    return {
        debug(message, ...args) {
            if (currentLevel <= LogLevel.DEBUG) {
                console.log(formatMessage(LogLevel.DEBUG, module, message), ...args);
            }
        },
        info(message, ...args) {
            if (currentLevel <= LogLevel.INFO) {
                console.info(formatMessage(LogLevel.INFO, module, message), ...args);
            }
        },
        warn(message, ...args) {
            if (currentLevel <= LogLevel.WARN) {
                console.warn(formatMessage(LogLevel.WARN, module, message), ...args);
            }
        },
        error(message, ...args) {
            if (currentLevel <= LogLevel.ERROR) {
                console.error(formatMessage(LogLevel.ERROR, module, message), ...args);
            }
        },
    };
}
export const logger = createLogger('App');
//# sourceMappingURL=logger.js.map