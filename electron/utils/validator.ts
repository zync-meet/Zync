import * as path from 'path';
import { app } from 'electron';


const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);


const DANGEROUS_PROTOCOLS = new Set([
    'javascript:',
    'vbscript:',
    'data:',
    'blob:',
    'file:',
    'ftp:',
]);


export function validateURL(url: string): { valid: boolean; reason?: string } {
    if (typeof url !== 'string') {
        return { valid: false, reason: 'URL must be a string' };
    }

    if (url.length === 0) {
        return { valid: false, reason: 'URL cannot be empty' };
    }

    if (url.length > 2048) {
        return { valid: false, reason: 'URL exceeds maximum length of 2048 characters' };
    }

    try {
        const parsed = new URL(url);

        if (DANGEROUS_PROTOCOLS.has(parsed.protocol)) {
            return { valid: false, reason: `Dangerous protocol: ${parsed.protocol}` };
        }

        if (!SAFE_PROTOCOLS.has(parsed.protocol)) {
            return { valid: false, reason: `Unsupported protocol: ${parsed.protocol}` };
        }

        return { valid: true };
    } catch {
        return { valid: false, reason: 'Malformed URL' };
    }
}


export function isSafeUrl(url: string): boolean {
    return validateURL(url).valid;
}


const INVALID_FILENAME_CHARS = /[<>:"|?*\x00-\x1f]/;


const WINDOWS_RESERVED = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);


export function validateFilePath(
    filePath: string,
    baseDir?: string,
): { valid: boolean; reason?: string } {
    if (typeof filePath !== 'string') {
        return { valid: false, reason: 'File path must be a string' };
    }

    if (filePath.length === 0) {
        return { valid: false, reason: 'File path cannot be empty' };
    }

    if (filePath.length > 260) {
        return { valid: false, reason: 'File path exceeds maximum length' };
    }


    if (filePath.includes('\0')) {
        return { valid: false, reason: 'Path contains null bytes' };
    }


    const resolved = path.resolve(filePath);


    if (baseDir) {
        const resolvedBase = path.resolve(baseDir);
        if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
            return { valid: false, reason: 'Path traversal detected' };
        }
    }


    const segments = filePath.split(path.sep);
    for (const segment of segments) {
        if (segment === '..') {
            continue;
        }

        if (INVALID_FILENAME_CHARS.test(segment)) {
            return { valid: false, reason: `Invalid characters in path segment: ${segment}` };
        }


        const baseName = segment.split('.')[0].toUpperCase();
        if (WINDOWS_RESERVED.has(baseName)) {
            return { valid: false, reason: `Reserved filename: ${segment}` };
        }
    }

    return { valid: true };
}


export function isWithinUserData(filePath: string): boolean {
    const userDataPath = app.getPath('userData');
    const resolved = path.resolve(filePath);
    return resolved.startsWith(userDataPath);
}


export function sanitizeFilename(filename: string, replacement = '_'): string {
    if (typeof filename !== 'string') return '';

    let sanitized = filename
        .replace(/[<>:"|?*\x00-\x1f]/g, replacement)
        .replace(/\.\./g, replacement)
        .trim();


    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');


    if (sanitized.length === 0) {
        sanitized = 'untitled';
    }


    if (sanitized.length > 200) {
        const ext = path.extname(sanitized);
        sanitized = sanitized.substring(0, 200 - ext.length) + ext;
    }

    return sanitized;
}


const MAX_IPC_PAYLOAD_SIZE = 5 * 1024 * 1024;


export function validateIPCPayload(payload: unknown): { valid: boolean; reason?: string } {
    if (payload === null || payload === undefined) {
        return { valid: true };
    }


    if (typeof payload === 'function') {
        return { valid: false, reason: 'Payload contains a function' };
    }


    if (typeof payload === 'symbol') {
        return { valid: false, reason: 'Payload contains a symbol' };
    }


    try {
        const serialized = JSON.stringify(payload);
        if (serialized.length > MAX_IPC_PAYLOAD_SIZE) {
            return {
                valid: false,
                reason: `Payload exceeds max size: ${serialized.length} > ${MAX_IPC_PAYLOAD_SIZE}`,
            };
        }
    } catch {
        return { valid: false, reason: 'Payload is not JSON-serializable' };
    }

    return { valid: true };
}


export function isValidString(
    value: unknown,
    minLength = 0,
    maxLength = 10000,
): value is string {
    return (
        typeof value === 'string' &&
        value.length >= minLength &&
        value.length <= maxLength
    );
}


export function isValidEmail(email: string): boolean {
    if (typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}


export function isValidSemver(version: string): boolean {
    if (typeof version !== 'string') return false;
    const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
    return semverRegex.test(version);
}
