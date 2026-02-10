/**
 * =============================================================================
 * Network Utility — ZYNC Desktop Application
 * =============================================================================
 *
 * Network connectivity checking and URL validation utilities for the
 * Electron main process.
 *
 * @module electron/utils/network
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/**
 * Checks if the system has an active internet connection.
 *
 * Uses Electron's net module to make a HEAD request to a known
 * reliable endpoint. Returns true if the request succeeds within
 * the timeout period.
 *
 * @returns {Promise<boolean>} True if connected to the internet
 */
export declare function isOnline(): Promise<boolean>;
/**
 * Validates that a URL uses a safe protocol (http or https).
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe to open
 */
export declare function isSafeUrl(url: string): boolean;
/**
 * Extracts the hostname from a URL string.
 *
 * @param {string} url - URL to extract hostname from
 * @returns {string | null} Hostname or null if invalid
 */
export declare function getHostname(url: string): string | null;
