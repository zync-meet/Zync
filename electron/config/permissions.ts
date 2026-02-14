/**
 * =============================================================================
 * Permission Handler Configuration — ZYNC Desktop Application
 * =============================================================================
 *
 * Configures permission handling for the Electron renderer process.
 * Manages access to hardware devices (camera, microphone), geolocation,
 * notifications, and other web platform features.
 *
 * Electron uses a permission system similar to Chromium browsers. The main
 * process can intercept and approve/deny permission requests from the renderer.
 *
 * Security Principle: Deny by default, explicitly whitelist allowed permissions.
 *
 * @module electron/config/permissions
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { session, WebContents } from 'electron';
import { WEB_APP_URL, DEV_SERVER_URL } from './constants.js';

/**
 * Permissions that are always allowed.
 *
 * These permissions are safe to grant unconditionally because they either:
 * - Don't expose sensitive data (clipboard-read, fullscreen)
 * - Are required for core functionality (notifications)
 * - Have their own user-facing confirmation flow
 *
 * @constant {Set<string>}
 */
const ALWAYS_ALLOWED_PERMISSIONS = new Set<string>([
    'clipboard-read',
    'clipboard-sanitized-write',
    'notifications',
    'fullscreen',
    'pointerLock',
    'idle-detection',
]);

/**
 * Permissions that require origin validation.
 *
 * These permissions are potentially sensitive and should only be granted
 * to trusted origins (our own application). Third-party content or
 * external URLs should not receive these permissions.
 *
 * @constant {Set<string>}
 */
const ORIGIN_VALIDATED_PERMISSIONS = new Set<string>([
    'media',           // Camera and microphone access (for video calls)
    'mediaKeySystem',  // DRM (for any protected media playback)
    'geolocation',     // Location access (for timezone/location features)
    'midi',            // MIDI device access (unlikely but safe to support)
    'display-capture', // Screen sharing
    'window-management',
]);

/**
 * Permissions that are always denied.
 *
 * These permissions pose security or privacy risks that are not justified
 * by any feature in the ZYNC application.
 *
 * @constant {Set<string>}
 */
const ALWAYS_DENIED_PERMISSIONS = new Set<string>([
    'openExternal',   // We handle this through IPC, not permission grants
    'serial',         // No need for serial port access
    'hid',            // No need for HID device access
    'usb',            // No need for USB device access
    'bluetooth',      // No need for Bluetooth access
    'storage-access', // Third-party storage access
]);

/**
 * Trusted origins that are allowed to request sensitive permissions.
 *
 * Only origins in this list can be granted permissions from the
 * ORIGIN_VALIDATED_PERMISSIONS set. All other origins are denied.
 *
 * @constant {Set<string>}
 */
const TRUSTED_ORIGINS = new Set<string>([
    new URL(WEB_APP_URL).origin,
    new URL(DEV_SERVER_URL).origin,
    'file://',
]);

/**
 * Determines if a given origin is trusted.
 *
 * @param {string} origin - The origin URL to check
 * @returns {boolean} True if the origin is in the trusted list
 */
function isTrustedOrigin(origin: string): boolean {
    if (!origin) return false;

    for (const trusted of TRUSTED_ORIGINS) {
        if (origin === trusted || origin.startsWith(trusted)) {
            return true;
        }
    }

    return false;
}

/**
 * Handles a permission request from the renderer process.
 *
 * This function implements the permission decision logic:
 * 1. Always-allowed permissions are granted immediately
 * 2. Always-denied permissions are rejected immediately
 * 3. Origin-validated permissions are checked against trusted origins
 * 4. Unknown permissions are denied by default (deny-by-default policy)
 *
 * @param {WebContents} _webContents - The WebContents requesting the permission
 * @param {string} permission - The permission being requested
 * @param {Function} callback - Callback to grant (true) or deny (false) the request
 * @param {object} details - Additional details about the permission request
 */
function handlePermissionRequest(
    _webContents: WebContents,
    permission: string,
    callback: (granted: boolean) => void,
    details: { requestingUrl?: string; isMainFrame?: boolean; externalURL?: string },
): void {
    const requestUrl = details.requestingUrl || '';
    let origin = '';

    try {
        origin = new URL(requestUrl).origin;
    } catch {
        origin = requestUrl;
    }

    // Step 1: Check always-allowed list
    if (ALWAYS_ALLOWED_PERMISSIONS.has(permission)) {
        console.info(`[Permissions] Granted '${permission}' (always allowed)`);
        callback(true);
        return;
    }

    // Step 2: Check always-denied list
    if (ALWAYS_DENIED_PERMISSIONS.has(permission)) {
        console.warn(`[Permissions] Denied '${permission}' (always denied)`);
        callback(false);
        return;
    }

    // Step 3: Check origin-validated permissions
    if (ORIGIN_VALIDATED_PERMISSIONS.has(permission)) {
        const trusted = isTrustedOrigin(origin);
        if (trusted) {
            console.info(`[Permissions] Granted '${permission}' for trusted origin: ${origin}`);
            callback(true);
        } else {
            console.warn(`[Permissions] Denied '${permission}' for untrusted origin: ${origin}`);
            callback(false);
        }
        return;
    }

    // Step 4: Deny unknown permissions (deny-by-default)
    console.warn(`[Permissions] Denied unknown permission '${permission}' from: ${origin}`);
    callback(false);
}

/**
 * Handles permission check requests (non-interactive).
 *
 * Unlike permission requests, permission checks don't prompt the user.
 * They simply return whether the permission is currently granted.
 *
 * @param {WebContents} _webContents - The WebContents checking the permission
 * @param {string} permission - The permission being checked
 * @param {string} requestingOrigin - Origin of the request
 * @returns {boolean} Whether the permission is currently granted
 */
function handlePermissionCheck(
    _webContents: WebContents,
    permission: string,
    requestingOrigin: string,
): boolean {
    // Always-allowed permissions are always granted
    if (ALWAYS_ALLOWED_PERMISSIONS.has(permission)) {
        return true;
    }

    // Always-denied permissions are never granted
    if (ALWAYS_DENIED_PERMISSIONS.has(permission)) {
        return false;
    }

    // Origin-validated permissions depend on the origin
    if (ORIGIN_VALIDATED_PERMISSIONS.has(permission)) {
        return isTrustedOrigin(requestingOrigin);
    }

    // Default: deny
    return false;
}

/**
 * Sets up the permission handler on the default session.
 *
 * This should be called once during application startup, before any
 * BrowserWindows are created. It configures the session to use our
 * custom permission handling logic.
 *
 * @example
 * ```typescript
 * import { setupPermissionHandlers } from './permissions';
 *
 * app.whenReady().then(() => {
 *   setupPermissionHandlers();
 *   createMainWindow();
 * });
 * ```
 */
export function setupPermissionHandlers(): void {
    const defaultSession = session.defaultSession;

    // Register the permission request handler
    defaultSession.setPermissionRequestHandler(handlePermissionRequest);

    // Register the permission check handler
    defaultSession.setPermissionCheckHandler(handlePermissionCheck);

    console.info('[Permissions] Permission handlers registered');
    console.info(`[Permissions] Always allowed: ${[...ALWAYS_ALLOWED_PERMISSIONS].join(', ')}`);
    console.info(`[Permissions] Origin-validated: ${[...ORIGIN_VALIDATED_PERMISSIONS].join(', ')}`);
    console.info(`[Permissions] Always denied: ${[...ALWAYS_DENIED_PERMISSIONS].join(', ')}`);
}

/**
 * Returns the current permission configuration for debugging.
 *
 * @returns Object containing all permission lists
 */
export function getPermissionConfig(): {
    alwaysAllowed: string[];
    originValidated: string[];
    alwaysDenied: string[];
    trustedOrigins: string[];
} {
    return {
        alwaysAllowed: [...ALWAYS_ALLOWED_PERMISSIONS],
        originValidated: [...ORIGIN_VALIDATED_PERMISSIONS],
        alwaysDenied: [...ALWAYS_DENIED_PERMISSIONS],
        trustedOrigins: [...TRUSTED_ORIGINS],
    };
}
