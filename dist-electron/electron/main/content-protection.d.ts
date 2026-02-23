/**
 * =============================================================================
 * Content Protection — ZYNC Desktop
 * =============================================================================
 *
 * Provides screen capture protection and content security features.
 * When enabled, prevents the application window from being captured
 * by screen recording or screenshot tools.
 *
 * @module electron/main/content-protection
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow } from 'electron';
/** Content protection configuration */
export interface ContentProtectionConfig {
    /** Enable screen capture protection (default: false) */
    preventScreenCapture: boolean;
    /** Enable content protection on all windows (default: false) */
    protectAllWindows: boolean;
    /** Windows to exclude from protection */
    excludeWindows: Set<string>;
}
/** Content protection state */
export interface ContentProtectionState {
    /** Whether protection is currently active */
    isProtected: boolean;
    /** Number of protected windows */
    protectedWindowCount: number;
    /** Whether the platform supports content protection */
    platformSupported: boolean;
}
/**
 * Initialize content protection with IPC handlers.
 *
 * @param {Partial<ContentProtectionConfig>} [options] - Configuration options
 */
export declare function initContentProtection(options?: Partial<ContentProtectionConfig>): void;
/**
 * Enable screen capture protection on a specific window.
 *
 * Uses BrowserWindow.setContentProtection() which leverages OS-level
 * APIs to prevent the window contents from being captured:
 * - macOS: Uses NSWindow's sharingType = none
 * - Windows: Uses SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)
 *
 * @param {BrowserWindow} window - Window to protect
 */
export declare function enableProtection(window: BrowserWindow): void;
/**
 * Disable screen capture protection on a specific window.
 *
 * @param {BrowserWindow} window - Window to unprotect
 */
export declare function disableProtection(window: BrowserWindow): void;
/**
 * Toggle content protection on a specific window.
 *
 * @param {BrowserWindow} window - Window to toggle
 * @returns {boolean} New protection state
 */
export declare function toggleProtection(window: BrowserWindow): boolean;
/**
 * Apply content protection to all open windows.
 *
 * @param {boolean} enabled - Whether to enable or disable
 */
export declare function applyToAllWindows(enabled: boolean): void;
/**
 * Check if a window is protected.
 *
 * @param {BrowserWindow} window - Window to check
 * @returns {boolean} True if protected
 */
export declare function isWindowProtected(window: BrowserWindow): boolean;
/**
 * Get the current content protection state.
 *
 * @returns {ContentProtectionState} Current state
 */
export declare function getProtectionState(): ContentProtectionState;
/**
 * Get the current configuration.
 *
 * @returns {ContentProtectionConfig} Current config
 */
export declare function getProtectionConfig(): ContentProtectionConfig;
