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
/**
 * Validate that a value is a non-empty string within length bounds.
 *
 * @param {unknown} value - Value to validate
 * @param {number} [maxLength=10000] - Maximum allowed length
 * @returns {value is string} True if valid string
 */
export declare function isNonEmptyString(value: unknown, maxLength?: number): value is string;
/**
 * Validate a settings key name.
 * Keys must be lowercase alphanumeric with dots and hyphens allowed.
 *
 * @param {unknown} key - Key to validate
 * @returns {key is string} True if valid settings key
 */
export declare function isValidSettingsKey(key: unknown): key is string;
/**
 * Validate a URL for safe external opening.
 *
 * @param {unknown} url - URL to validate
 * @returns {url is string} True if safe to open
 */
export declare function isSafeExternalUrl(url: unknown): url is string;
/**
 * Validate an HTTP/HTTPS URL only.
 *
 * @param {unknown} url - URL to validate
 * @returns {url is string} True if valid HTTP(S) URL
 */
export declare function isHttpUrl(url: unknown): url is string;
/**
 * Check if a value is safely serializable for IPC transport.
 * Rejects functions, symbols, circular references, and oversized payloads.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if serializable
 */
export declare function isSerializable(value: unknown): boolean;
/**
 * Validate an IPC payload size.
 *
 * @param {unknown} payload - Payload to validate
 * @returns {{ valid: boolean; reason?: string }} Validation result
 */
export declare function validatePayloadSize(payload: unknown): {
    valid: boolean;
    reason?: string;
};
/**
 * Check if a value is a plain object ({}).
 *
 * @param {unknown} value - Value to check
 * @returns {value is Record<string, unknown>} True if plain object
 */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/**
 * Check if a value is a number within a valid range.
 *
 * @param {unknown} value - Value to check
 * @param {number} [min] - Minimum value (inclusive)
 * @param {number} [max] - Maximum value (inclusive)
 * @returns {value is number} True if valid number in range
 */
export declare function isValidNumber(value: unknown, min?: number, max?: number): value is number;
/**
 * Check if a value is a boolean.
 *
 * @param {unknown} value - Value to check
 * @returns {value is boolean} True if boolean
 */
export declare function isBoolean(value: unknown): value is boolean;
/**
 * Check if a value is one of the allowed options.
 *
 * @param {unknown} value - Value to check
 * @param {T[]} options - Allowed values
 * @returns {value is T} True if value is in options
 */
export declare function isOneOf<T>(value: unknown, options: readonly T[]): value is T;
