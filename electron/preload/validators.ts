export function isNonEmptyString(value: unknown, maxLength = 10000): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}


export function isValidSettingsKey(key: unknown): key is string {
    if (typeof key !== 'string') {return false;}
    if (key.length === 0 || key.length > 100) {return false;}
    return /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key);
}


const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);


export function isSafeExternalUrl(url: unknown): url is string {
    if (typeof url !== 'string') {return false;}
    if (url.length === 0 || url.length > 2048) {return false;}

    try {
        const parsed = new URL(url);
        return SAFE_URL_PROTOCOLS.has(parsed.protocol);
    } catch {
        return false;
    }
}


export function isHttpUrl(url: unknown): url is string {
    if (typeof url !== 'string') {return false;}

    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}


const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;


export function isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) {return true;}

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {return true;}
    if (type === 'function' || type === 'symbol' || type === 'bigint') {return false;}

    if (value instanceof Date) {return true;}
    if (value instanceof RegExp) {return false;}
    if (value instanceof Error) {return true;}

    if (ArrayBuffer.isView(value)) {return true;}

    if (Array.isArray(value)) {
        return value.length <= 10000 && value.every(isSerializable);
    }

    if (type === 'object') {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length > 1000) {return false;}
        return keys.every((k) => isSerializable(obj[k]));
    }

    return false;
}


export function validatePayloadSize(payload: unknown): { valid: boolean; reason?: string } {
    try {
        const serialized = JSON.stringify(payload);
        if (serialized.length > MAX_PAYLOAD_SIZE) {
            return {
                valid: false,
                reason: `Payload too large: ${serialized.length} bytes (max: ${MAX_PAYLOAD_SIZE})`,
            };
        }
        return { valid: true };
    } catch (err) {
        return { valid: false, reason: 'Payload is not JSON-serializable' };
    }
}


export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) {return false;}
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}


export function isValidNumber(value: unknown, min?: number, max?: number): value is number {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {return false;}
    if (min !== undefined && value < min) {return false;}
    if (max !== undefined && value > max) {return false;}
    return true;
}


export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}


export function isOneOf<T>(value: unknown, options: readonly T[]): value is T {
    return options.includes(value as T);
}
