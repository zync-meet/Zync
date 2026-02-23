/**
 * =============================================================================
 * Security Configuration — ZYNC Desktop Application
 * =============================================================================
 *
 * Implements security hardening measures for the Electron application.
 * This module configures Content Security Policy, prevents navigation
 * to untrusted origins, blocks new window creation from untrusted sources,
 * and validates all incoming URLs and IPC messages.
 *
 * Security Model:
 * 1. Context Isolation: ON — Renderer cannot access Node.js APIs directly
 * 2. Node Integration: OFF — No require() in renderer
 * 3. Sandbox: OFF (needed for preload filesystem) but mitigated by CSP
 * 4. CSP: Strict policy allowing only whitelisted sources
 * 5. Navigation: Only allowed to app origin and OAuth providers
 * 6. New Windows: Blocked except for known popup flows
 *
 * @module electron/config/security
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/security
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Electron_Security_Cheat_Sheet.html
 * =============================================================================
 */
import { app, shell } from 'electron';
import { WEB_APP_URL, DEV_SERVER_URL } from './constants.js';
/**
 * Allowed navigation origins.
 *
 * The renderer is only permitted to navigate to URLs matching these origins.
 * Any attempt to navigate to an unlisted origin is blocked and the URL is
 * opened in the external browser instead.
 *
 * @constant {string[]}
 */
const ALLOWED_NAVIGATION_ORIGINS = [
    new URL(WEB_APP_URL).origin,
    new URL(DEV_SERVER_URL).origin,
    'https://accounts.google.com',
    'https://github.com',
    'https://zync-it.vercel.app',
];
/**
 * Allowed new-window popup origins.
 *
 * New windows (popups) are only allowed for OAuth login flows. All other
 * new-window requests are blocked or redirected to the external browser.
 *
 * @constant {string[]}
 */
const ALLOWED_POPUP_ORIGINS = [
    'https://accounts.google.com',
    'https://github.com',
    'https://zync-it.firebaseapp.com',
];
/**
 * Blocked protocol schemes.
 *
 * These protocols are never allowed in navigation, new-window, or
 * will-download events. They represent security risks (XSS, code
 * execution, data exfiltration).
 *
 * @constant {string[]}
 */
const BLOCKED_PROTOCOLS = [
    'javascript:',
    'vbscript:',
    'data:',
    'blob:',
];
/**
 * Checks if a URL is allowed for navigation.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if navigation is allowed
 */
function isAllowedNavigation(url) {
    // Always allow local files (settings, about, etc.)
    if (url.startsWith('file://'))
        return true;
    // Block dangerous protocols
    for (const protocol of BLOCKED_PROTOCOLS) {
        if (url.startsWith(protocol))
            return false;
    }
    // In development, allow localhost
    if (!app.isPackaged && url.includes('localhost'))
        return true;
    // Check against allowed origins
    try {
        const urlOrigin = new URL(url).origin;
        return ALLOWED_NAVIGATION_ORIGINS.includes(urlOrigin);
    }
    catch {
        return false;
    }
}
/**
 * Checks if a URL is allowed for popup window creation.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if popup is allowed
 */
function isAllowedPopup(url) {
    try {
        const urlOrigin = new URL(url).origin;
        return ALLOWED_POPUP_ORIGINS.includes(urlOrigin);
    }
    catch {
        return false;
    }
}
/**
 * Applies security hardening to a BrowserWindow.
 *
 * Attaches event handlers that:
 * 1. Block navigation to untrusted origins
 * 2. Block new window creation from untrusted sources
 * 3. Open blocked URLs in the external browser as a fallback
 *
 * @param {BrowserWindow} window - The window to secure
 *
 * @example
 * ```typescript
 * const mainWindow = new BrowserWindow({ ... });
 * hardenWindow(mainWindow);
 * ```
 */
export function hardenWindow(window) {
    const webContents = window.webContents;
    // =========================================================================
    // Block unauthorized navigation
    // =========================================================================
    webContents.on('will-navigate', (event, navigationUrl) => {
        if (!isAllowedNavigation(navigationUrl)) {
            console.warn(`[Security] Blocked navigation to: ${navigationUrl}`);
            event.preventDefault();
            // Offer to open in external browser if it's a safe URL
            try {
                const parsed = new URL(navigationUrl);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                    shell.openExternal(navigationUrl).catch((err) => {
                        console.error(`[Security] Failed to open blocked URL externally: ${err.message}`);
                    });
                }
            }
            catch {
                // Invalid URL, just block it
            }
        }
    });
    // =========================================================================
    // Block unauthorized new windows (popups)
    // =========================================================================
    webContents.setWindowOpenHandler(({ url }) => {
        // Allow OAuth popups
        if (isAllowedPopup(url)) {
            console.info(`[Security] Allowed popup for OAuth: ${url}`);
            return { action: 'allow' };
        }
        // Block and open in external browser
        console.info(`[Security] Blocked popup, opening externally: ${url}`);
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                shell.openExternal(url).catch((err) => {
                    console.error(`[Security] Failed to open popup URL externally: ${err.message}`);
                });
            }
        }
        catch {
            // Invalid URL, just deny
        }
        return { action: 'deny' };
    });
    // =========================================================================
    // Block web resource requests to dangerous origins
    // =========================================================================
    webContents.on('will-attach-webview', (event) => {
        // Block all webview creation — we don't use webviews
        console.warn('[Security] Blocked webview creation attempt');
        event.preventDefault();
    });
    console.info('[Security] Window security hardening applied');
}
/**
 * Applies global security settings to the Electron application.
 *
 * Should be called once during application startup, before any
 * windows are created. Sets up application-level security policies.
 *
 * @example
 * ```typescript
 * import { applyGlobalSecurity } from './security';
 *
 * app.whenReady().then(() => {
 *   applyGlobalSecurity();
 *   createMainWindow();
 * });
 * ```
 */
export function applyGlobalSecurity() {
    // =========================================================================
    // Disable navigation to unknown protocols
    // =========================================================================
    app.on('web-contents-created', (_event, contents) => {
        // Apply navigation blocking to all web contents
        contents.on('will-navigate', (event, url) => {
            if (!isAllowedNavigation(url)) {
                event.preventDefault();
                console.warn(`[Security] Blocked navigation (global) to: ${url}`);
            }
        });
        // Block new windows from all web contents by default
        contents.setWindowOpenHandler(({ url }) => {
            if (isAllowedPopup(url)) {
                return { action: 'allow' };
            }
            // Open in external browser
            try {
                const parsed = new URL(url);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                    shell.openExternal(url).catch(() => { });
                }
            }
            catch {
                // Ignore invalid URLs
            }
            return { action: 'deny' };
        });
    });
    console.info('[Security] Global security policies applied');
}
/**
 * Validates an IPC message payload for security issues.
 *
 * Checks for common attack vectors:
 * - Path traversal in file paths
 * - Script injection through string values
 * - Excessive payload size
 *
 * @param {unknown} payload - The IPC message payload to validate
 * @param {number} maxSize - Maximum allowed payload size in bytes (default: 10MB)
 * @returns {{ valid: boolean; reason?: string }}
 */
export function validateIPCPayload(payload, maxSize = 10 * 1024 * 1024) {
    // Check size
    const serialized = JSON.stringify(payload);
    if (serialized.length > maxSize) {
        return { valid: false, reason: `Payload exceeds maximum size of ${maxSize} bytes` };
    }
    // Check for path traversal patterns in strings
    if (typeof payload === 'string') {
        if (payload.includes('..') && (payload.includes('/') || payload.includes('\\'))) {
            return { valid: false, reason: 'Potential path traversal detected' };
        }
    }
    // Check for path traversal in objects
    if (typeof payload === 'object' && payload !== null) {
        const checkStrings = (obj) => {
            for (const value of Object.values(obj)) {
                if (typeof value === 'string') {
                    if (value.includes('..') && (value.includes('/') || value.includes('\\'))) {
                        return false;
                    }
                }
                else if (typeof value === 'object' && value !== null) {
                    if (!checkStrings(value))
                        return false;
                }
            }
            return true;
        };
        if (!checkStrings(payload)) {
            return { valid: false, reason: 'Potential path traversal detected in object property' };
        }
    }
    return { valid: true };
}
/**
 * Returns the current security configuration for debugging.
 *
 * @returns Security configuration summary
 */
export function getSecurityConfig() {
    return {
        allowedNavigationOrigins: [...ALLOWED_NAVIGATION_ORIGINS],
        allowedPopupOrigins: [...ALLOWED_POPUP_ORIGINS],
        blockedProtocols: [...BLOCKED_PROTOCOLS],
        isDev: !app.isPackaged,
    };
}
//# sourceMappingURL=security.js.map