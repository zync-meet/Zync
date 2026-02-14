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

import * as path from 'path';
import { app } from 'electron';

// =============================================================================
// URL Validation
// =============================================================================

/** Allowed URL protocols for external links */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/** Blocked URL protocols that could be dangerous */
const DANGEROUS_PROTOCOLS = new Set([
    'javascript:',
    'vbscript:',
    'data:',
    'blob:',
    'file:',
    'ftp:',
]);

/**
 * Validate that a URL is safe to open externally.
 *
 * @param {string} url - URL to validate
 * @returns {{ valid: boolean; reason?: string }} Validation result
 */
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

/**
 * Check if a URL is a safe HTTP/HTTPS URL.
 *
 * @param {string} url - URL to check
 * @returns {boolean} True if safe
 */
export function isSafeUrl(url: string): boolean {
    return validateURL(url).valid;
}

// =============================================================================
// File Path Validation
// =============================================================================

/** Characters not allowed in file names */
const INVALID_FILENAME_CHARS = /[<>:"|?*\x00-\x1f]/;

/** Reserved Windows file names */
const WINDOWS_RESERVED = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

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

    // Check for null bytes (path injection)
    if (filePath.includes('\0')) {
        return { valid: false, reason: 'Path contains null bytes' };
    }

    // Resolve the path to catch traversal
    const resolved = path.resolve(filePath);

    // If a base directory is specified, ensure the path stays within it
    if (baseDir) {
        const resolvedBase = path.resolve(baseDir);
        if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
            return { valid: false, reason: 'Path traversal detected' };
        }
    }

    // Check each segment for invalid characters
    const segments = filePath.split(path.sep);
    for (const segment of segments) {
        if (segment === '..') {
            continue; // Already handled by resolve check above
        }

        if (INVALID_FILENAME_CHARS.test(segment)) {
            return { valid: false, reason: `Invalid characters in path segment: ${segment}` };
        }

        // Check Windows reserved names
        const baseName = segment.split('.')[0].toUpperCase();
        if (WINDOWS_RESERVED.has(baseName)) {
            return { valid: false, reason: `Reserved filename: ${segment}` };
        }
    }

    return { valid: true };
}

/**
 * Validate that a path is within the app's user data directory.
 *
 * @param {string} filePath - Path to validate
 * @returns {boolean} True if within user data
 */
export function isWithinUserData(filePath: string): boolean {
    const userDataPath = app.getPath('userData');
    const resolved = path.resolve(filePath);
    return resolved.startsWith(userDataPath);
}

/**
 * Sanitize a filename by removing dangerous characters.
 *
 * @param {string} filename - Raw filename
 * @param {string} [replacement='_'] - Character to replace invalid chars with
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename: string, replacement = '_'): string {
    if (typeof filename !== 'string') return '';

    let sanitized = filename
        .replace(/[<>:"|?*\x00-\x1f]/g, replacement)
        .replace(/\.\./g, replacement)
        .trim();

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

    // Ensure it's not empty
    if (sanitized.length === 0) {
        sanitized = 'untitled';
    }

    // Truncate if too long
    if (sanitized.length > 200) {
        const ext = path.extname(sanitized);
        sanitized = sanitized.substring(0, 200 - ext.length) + ext;
    }

    return sanitized;
}

// =============================================================================
// IPC Payload Validation
// =============================================================================

/**
 * Maximum allowed size for IPC payloads (5 MB).
 */
const MAX_IPC_PAYLOAD_SIZE = 5 * 1024 * 1024;

/**
 * Validate an IPC payload for safety.
 *
 * @param {unknown} payload - The payload to validate
 * @returns {{ valid: boolean; reason?: string }} Validation result
 */
export function validateIPCPayload(payload: unknown): { valid: boolean; reason?: string } {
    if (payload === null || payload === undefined) {
        return { valid: true };
    }

    // Check for functions (not serializable)
    if (typeof payload === 'function') {
        return { valid: false, reason: 'Payload contains a function' };
    }

    // Check for symbols
    if (typeof payload === 'symbol') {
        return { valid: false, reason: 'Payload contains a symbol' };
    }

    // Check serialized size
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

// =============================================================================
// String Validation
// =============================================================================

/**
 * Validate that a string is within expected bounds.
 *
 * @param {unknown} value - Value to validate
 * @param {number} [minLength=0] - Minimum length
 * @param {number} [maxLength=10000] - Maximum length
 * @returns {boolean} True if valid string within bounds
 */
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

/**
 * Validate an email address format.
 *
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email: string): boolean {
    if (typeof email !== 'string') return false;
    // Simple but effective email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate a semantic version string.
 *
 * @param {string} version - Version string to validate
 * @returns {boolean} True if valid semver
 */
export function isValidSemver(version: string): boolean {
    if (typeof version !== 'string') return false;
    const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
    return semverRegex.test(version);
}
