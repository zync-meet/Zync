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

import { net } from 'electron';

/** Timeout for connectivity checks (ms) */
const CONNECTIVITY_TIMEOUT_MS = 5000;

/** URL used for connectivity checks */
const CONNECTIVITY_CHECK_URL = 'https://www.google.com';

/**
 * Checks if the system has an active internet connection.
 *
 * Uses Electron's net module to make a HEAD request to a known
 * reliable endpoint. Returns true if the request succeeds within
 * the timeout period.
 *
 * @returns {Promise<boolean>} True if connected to the internet
 */
export async function isOnline(): Promise<boolean> {
    // First, use Electron's built-in online check
    if (!net.isOnline()) {
        return false;
    }

    // Verify with an actual request for reliability
    try {
        return await new Promise<boolean>((resolve) => {
            const request = net.request({
                method: 'HEAD',
                url: CONNECTIVITY_CHECK_URL,
            });

            const timeout = setTimeout(() => {
                request.abort();
                resolve(false);
            }, CONNECTIVITY_TIMEOUT_MS);

            request.on('response', () => {
                clearTimeout(timeout);
                resolve(true);
            });

            request.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });

            request.end();
        });
    } catch {
        return false;
    }
}

/**
 * Validates that a URL uses a safe protocol (http or https).
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe to open
 */
export function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Extracts the hostname from a URL string.
 *
 * @param {string} url - URL to extract hostname from
 * @returns {string | null} Hostname or null if invalid
 */
export function getHostname(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}
