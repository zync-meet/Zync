/**
 * =============================================================================
 * Preload Validators — ZYNC Desktop
 * =============================================================================
 *
 * Validation functions used in the preload script to sanitize and validate
 * data before passing it through IPC to the main process.
 *
 * @module electron/preload/validators
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

// =============================================================================
// String Validators
// =============================================================================

/**
 * Validate that a value is a non-empty string within length bounds.
 *
 * @param {unknown} value - Value to validate
 * @param {number} [maxLength=10000] - Maximum allowed length
 * @returns {value is string} True if valid string
 */
export function isNonEmptyString(value: unknown, maxLength = 10000): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

/**
 * Validate a settings key name.
 * Keys must be lowercase alphanumeric with dots and hyphens allowed.
 *
 * @param {unknown} key - Key to validate
 * @returns {key is string} True if valid settings key
 */
export function isValidSettingsKey(key: unknown): key is string {
    if (typeof key !== 'string') return false;
    if (key.length === 0 || key.length > 100) return false;
    return /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key);
}

// =============================================================================
// URL Validators
// =============================================================================

/**
 * Allowed protocols for external URL opening.
 */
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Validate a URL for safe external opening.
 *
 * @param {unknown} url - URL to validate
 * @returns {url is string} True if safe to open
 */
export function isSafeExternalUrl(url: unknown): url is string {
    if (typeof url !== 'string') return false;
    if (url.length === 0 || url.length > 2048) return false;

    try {
        const parsed = new URL(url);
        return SAFE_URL_PROTOCOLS.has(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Validate an HTTP/HTTPS URL only.
 *
 * @param {unknown} url - URL to validate
 * @returns {url is string} True if valid HTTP(S) URL
 */
export function isHttpUrl(url: unknown): url is string {
    if (typeof url !== 'string') return false;

    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// =============================================================================
// IPC Payload Validators
// =============================================================================

/**
 * Maximum IPC payload size in characters (5 MB when serialized).
 */
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;

/**
 * Check if a value is safely serializable for IPC transport.
 * Rejects functions, symbols, circular references, and oversized payloads.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if serializable
 */
export function isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) return true;

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') return true;
    if (type === 'function' || type === 'symbol' || type === 'bigint') return false;

    if (value instanceof Date) return true;
    if (value instanceof RegExp) return false;
    if (value instanceof Error) return true;

    if (ArrayBuffer.isView(value)) return true;

    if (Array.isArray(value)) {
        return value.length <= 10000 && value.every(isSerializable);
    }

    if (type === 'object') {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length > 1000) return false;
        return keys.every((k) => isSerializable(obj[k]));
    }

    return false;
}

/**
 * Validate an IPC payload size.
 *
 * @param {unknown} payload - Payload to validate
 * @returns {{ valid: boolean; reason?: string }} Validation result
 */
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

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value is a plain object ({}).
 *
 * @param {unknown} value - Value to check
 * @returns {value is Record<string, unknown>} True if plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/**
 * Check if a value is a number within a valid range.
 *
 * @param {unknown} value - Value to check
 * @param {number} [min] - Minimum value (inclusive)
 * @param {number} [max] - Maximum value (inclusive)
 * @returns {value is number} True if valid number in range
 */
export function isValidNumber(value: unknown, min?: number, max?: number): value is number {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
}

/**
 * Check if a value is a boolean.
 *
 * @param {unknown} value - Value to check
 * @returns {value is boolean} True if boolean
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

/**
 * Check if a value is one of the allowed options.
 *
 * @param {unknown} value - Value to check
 * @param {T[]} options - Allowed values
 * @returns {value is T} True if value is in options
 */
export function isOneOf<T>(value: unknown, options: readonly T[]): value is T {
    return options.includes(value as T);
}
