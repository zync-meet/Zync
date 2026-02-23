/**
 * =============================================================================
 * Tray Manager — ZYNC Desktop
 * =============================================================================
 *
 * Creates and manages the system tray icon with a context menu.
 * Supports dynamic icon updates, status text, balloon notifications (Windows),
 * and click-to-show/hide behavior on all platforms.
 *
 * @module electron/main/tray-manager
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { Tray, BrowserWindow } from 'electron';
/**
 * Initialize the system tray.
 *
 * Creates the tray icon, attaches a context menu, and wires up
 * click handlers for show/hide behavior.
 *
 * @param mainWindow — Reference to the main BrowserWindow
 * @returns The created Tray instance, or null if creation failed
 */
export declare function initTray(mainWindow: BrowserWindow | null): Tray | null;
/**
 * Update the tray context menu with new state.
 *
 * @param mainWindow — Reference to the main BrowserWindow
 * @param options — Dynamic menu state
 */
export declare function updateTrayMenu(mainWindow: BrowserWindow | null, options?: {
    isVisible?: boolean;
    hasUpdate?: boolean;
    updateVersion?: string;
}): void;
/**
 * Update the tray icon based on theme changes.
 *
 * @param isDark — Whether the system is in dark mode
 */
export declare function updateTrayIcon(isDark?: boolean): void;
/**
 * Set the tray tooltip text.
 *
 * @param text — Tooltip text (defaults to APP_NAME)
 */
export declare function setTrayTooltip(text?: string): void;
/**
 * Show a tray balloon notification (Windows only).
 *
 * @param title — Balloon title
 * @param content — Balloon body text
 */
export declare function showTrayBalloon(title: string, content: string): void;
/**
 * Destroy the tray icon and clean up resources.
 */
export declare function destroyTray(): void;
/**
 * Get the current tray instance.
 *
 * @returns The Tray instance, or null if not initialized
 */
export declare function getTray(): Tray | null;
