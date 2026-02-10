/**
 * =============================================================================
 * Application Menu Builder — ZYNC Desktop Application
 * =============================================================================
 *
 * This module constructs the native application menu bar for the ZYNC desktop
 * application. The menu provides keyboard shortcuts and access to application
 * features that are not directly accessible through the web UI.
 *
 * The menu structure follows platform conventions:
 * - macOS: Application name menu with standard items (About, Preferences, Quit)
 * - Windows/Linux: File, Edit, View, Window, Help menus
 *
 * Each menu item is documented with its purpose, keyboard shortcut, and any
 * platform-specific behavior.
 *
 * @module electron/main/menu
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 *
 * @see https://www.electronjs.org/docs/latest/api/menu
 * @see https://www.electronjs.org/docs/latest/api/menu-item
 * =============================================================================
 */
import { Menu, BrowserWindow } from 'electron';
/**
 * Builds and returns the complete application menu template.
 *
 * This function creates a platform-aware menu template that includes
 * all standard menu items (File, Edit, View, Window, Help) with
 * appropriate keyboard shortcuts and handlers.
 *
 * The menu template is built dynamically based on the current platform
 * to ensure that macOS-specific menus (like the application menu) are
 * only included when running on macOS, and Windows/Linux-specific items
 * are included on those platforms.
 *
 * @param {BrowserWindow | null} mainWindow - The main application window.
 *   Used to send IPC messages and control window behavior from menu items.
 *   Can be null if the main window hasn't been created yet.
 *
 * @returns {Menu} The constructed Electron Menu object, ready to be set
 *   as the application menu using Menu.setApplicationMenu().
 *
 * @example
 * ```typescript
 * import { buildApplicationMenu } from './menu';
 *
 * const mainWindow = new BrowserWindow({ ... });
 * const menu = buildApplicationMenu(mainWindow);
 * Menu.setApplicationMenu(menu);
 * ```
 */
export declare function buildApplicationMenu(mainWindow: BrowserWindow | null): Menu;
/**
 * Sets up the application menu for the main window.
 *
 * This is a convenience function that builds the menu and immediately
 * sets it as the application menu. Call this during application startup
 * after the main window has been created.
 *
 * @param {BrowserWindow | null} mainWindow - The main application window.
 *
 * @example
 * ```typescript
 * import { setupApplicationMenu } from './menu';
 *
 * app.on('ready', () => {
 *   const mainWindow = createMainWindow();
 *   setupApplicationMenu(mainWindow);
 * });
 * ```
 */
export declare function setupApplicationMenu(mainWindow: BrowserWindow | null): void;
