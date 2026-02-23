/**
 * =============================================================================
 * Input Validator Utilities — ZYNC Desktop
 * =============================================================================
 *
 * Provides validation functions for IPC payloads, file paths, URLs, and
 * other user inputs to protect the main process from malformed data.
 *
 * @module electron/utils/validator
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/**
 * Validate that a URL is safe to open externally.
 *
 * @param {string} url - URL to validate
 * @returns {{ valid: boolean; reason?: string }} Validation result
 */
export declare function validateURL(url: string): {
    valid: boolean;
    reason?: string;
};
/**
 * Check if a URL is a safe HTTP/HTTPS URL.
 *
 * @param {string} url - URL to check
 * @returns {boolean} True if safe
 */
export declare function isSafeUrl(url: string): boolean;
/**
 * Validate a file path for safety.
 *
 * Checks for:
 * - Path traversal attacks (../)
 * - Invalid characters
 * - Reserved Windows names
 * - Maximum path length
 *
 * @param {string} filePath - Path to validate
 * @param {string} [baseDir] - Optional base directory to restrict paths to
 * @returns {{ valid: boolean; reason?: string }} Validation result
 */
export declare function validateFilePath(filePath: string, baseDir?: string): {
    valid: boolean;
    reason?: string;
};
/**
 * Validate that a path is within the app's user data directory.
 *
 * @param {string} filePath - Path to validate
 * @returns {boolean} True if within user data
 */
export declare function isWithinUserData(filePath: string): boolean;
/**
 * Sanitize a filename by removing dangerous characters.
 *
 * @param {string} filename - Raw filename
 * @param {string} [replacement='_'] - Character to replace invalid chars with
 * @returns {string} Sanitized filename
 */
export declare function sanitizeFilename(filename: string, replacement?: string): string;
/**
 * Validate an IPC payload for safety.
 *
 * @param {unknown} payload - The payload to validate
 * @returns {{ valid: boolean; reason?: string }} Validation result
 */
export declare function validateIPCPayload(payload: unknown): {
    valid: boolean;
    reason?: string;
};
/**
 * Validate that a string is within expected bounds.
 *
 * @param {unknown} value - Value to validate
 * @param {number} [minLength=0] - Minimum length
 * @param {number} [maxLength=10000] - Maximum length
 * @returns {boolean} True if valid string within bounds
 */
export declare function isValidString(value: unknown, minLength?: number, maxLength?: number): value is string;
/**
 * Validate an email address format.
 *
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate a semantic version string.
 *
 * @param {string} version - Version string to validate
 * @returns {boolean} True if valid semver
 */
export declare function isValidSemver(version: string): boolean;
