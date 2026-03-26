import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';


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


const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5,
};


const DEFAULT_CONFIG: LoggerConfig = {
    minLevel: 'info',
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024,
    logDir: '',
    console: true,
    file: true,
    jsonFormat: false,
};


const LEVEL_COLORS: Record<LogLevel, string> = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    verbose: '\x1b[35m',
    debug: '\x1b[90m',
    silly: '\x1b[90m',
};

const RESET_COLOR = '\x1b[0m';


export class Logger {


    private static config: LoggerConfig = { ...DEFAULT_CONFIG };


    private static instances: Map<string, Logger> = new Map();


    private static fileStream: fs.WriteStream | null = null;


    private static currentLogFile: string = '';


    private static bytesWritten = 0;


    private scope: string;


    private constructor(scope: string) {
        this.scope = scope;
    }


    static initialize(config: Partial<LoggerConfig> = {}): void {
        Logger.config = { ...DEFAULT_CONFIG, ...config };


        if (!Logger.config.logDir) {
            try {
                Logger.config.logDir = path.join(app.getPath('userData'), 'logs');
            } catch {
                Logger.config.logDir = path.join(process.cwd(), 'logs');
            }
        }


        if (Logger.config.file) {
            try {
                fs.mkdirSync(Logger.config.logDir, { recursive: true });
            } catch (err) {
                console.error('[LOGGER] Failed to create log directory:', err);
                Logger.config.file = false;
            }
        }


        if (Logger.config.file) {
            Logger.openLogFile();
        }
    }


    static create(scope: string): Logger {
        let instance = Logger.instances.get(scope);

        if (!instance) {
            instance = new Logger(scope);
            Logger.instances.set(scope, instance);
        }

        return instance;
    }


    error(message: string, data?: unknown): void {
        this.log('error', message, data);
    }


    warn(message: string, data?: unknown): void {
        this.log('warn', message, data);
    }


    info(message: string, data?: unknown): void {
        this.log('info', message, data);
    }


    verbose(message: string, data?: unknown): void {
        this.log('verbose', message, data);
    }


    debug(message: string, data?: unknown): void {
        this.log('debug', message, data);
    }


    silly(message: string, data?: unknown): void {
        this.log('silly', message, data);
    }


    private log(level: LogLevel, message: string, data?: unknown): void {

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


        if (Logger.config.console) {
            Logger.writeToConsole(entry);
        }


        if (Logger.config.file) {
            Logger.writeToFile(entry);
        }
    }


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


    private static writeToFile(entry: LogEntry): void {
        if (!Logger.fileStream) {return;}

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


        if (Logger.bytesWritten >= Logger.config.maxFileSize) {
            Logger.rotateLogFile();
        }
    }


    private static openLogFile(): void {
        const filename = `zync-${new Date().toISOString().split('T')[0]}.log`;
        Logger.currentLogFile = path.join(Logger.config.logDir, filename);

        try {
            Logger.fileStream = fs.createWriteStream(Logger.currentLogFile, {
                flags: 'a',
                encoding: 'utf-8',
            });
            Logger.bytesWritten = 0;


            try {
                const stats = fs.statSync(Logger.currentLogFile);
                Logger.bytesWritten = stats.size;
            } catch (error) {
                // Ignore error if stat fails for a new file
            }
        } catch (err) {
            console.error('[LOGGER] Failed to open log file:', err);
            Logger.fileStream = null;
        }
    }


    private static rotateLogFile(): void {

        if (Logger.fileStream) {
            Logger.fileStream.end();
            Logger.fileStream = null;
        }


        try {
            const files = fs
                .readdirSync(Logger.config.logDir)
                .filter((f) => f.startsWith('zync-') && f.endsWith('.log'))
                .sort()
                .reverse();


            while (files.length >= Logger.config.maxFiles) {
                const oldest = files.pop();
                if (oldest) {
                    fs.unlinkSync(path.join(Logger.config.logDir, oldest));
                }
            }
        } catch (err) {
            console.error('[LOGGER] Failed to rotate log files:', err);
        }


        Logger.openLogFile();
    }


    static dispose(): void {
        if (Logger.fileStream) {
            Logger.fileStream.end();
            Logger.fileStream = null;
        }

        Logger.instances.clear();
        Logger.bytesWritten = 0;
    }
}
