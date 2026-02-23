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
export declare function setupPermissionHandlers(): void;
/**
 * Returns the current permission configuration for debugging.
 *
 * @returns Object containing all permission lists
 */
export declare function getPermissionConfig(): {
    alwaysAllowed: string[];
    originValidated: string[];
    alwaysDenied: string[];
    trustedOrigins: string[];
};
