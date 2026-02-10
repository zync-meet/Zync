/**
 * =============================================================================
 * System Tray Manager — ZYNC Desktop Application
 * =============================================================================
 *
 * Manages the system tray icon and context menu for the ZYNC app.
 * The tray provides quick access to common actions and keeps the
 * app accessible when the main window is minimized.
 *
 * @module electron/main/tray
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { Tray, BrowserWindow } from 'electron';
/**
 * Creates and configures the system tray for the ZYNC application.
 *
 * The tray icon provides:
 * - Click to show/hide the main window
 * - Right-click context menu with quick actions
 * - Tooltip showing the app name and version
 *
 * @param {BrowserWindow} mainWindow - The main application window
 * @returns {Tray} The configured Tray instance
 */
export declare function createSystemTray(mainWindow: BrowserWindow): Tray;
