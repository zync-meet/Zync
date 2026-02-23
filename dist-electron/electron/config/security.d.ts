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
import { BrowserWindow } from 'electron';
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
export declare function hardenWindow(window: BrowserWindow): void;
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
export declare function applyGlobalSecurity(): void;
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
export declare function validateIPCPayload(payload: unknown, maxSize?: number): {
    valid: boolean;
    reason?: string;
};
/**
 * Returns the current security configuration for debugging.
 *
 * @returns Security configuration summary
 */
export declare function getSecurityConfig(): {
    allowedNavigationOrigins: string[];
    allowedPopupOrigins: string[];
    blockedProtocols: string[];
    isDev: boolean;
};
