/**
 * =============================================================================
 * Menu Builder — ZYNC Desktop
 * =============================================================================
 *
 * Constructs the application menu bar for ZYNC. Provides a macOS-style menu
 * on all platforms with File, Edit, View, Window, and Help submenus.
 * Supports dynamic menu updates, role-based items, and custom accelerators.
 *
 * @module electron/main/menu-builder
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron';
/**
 * Build the complete application menu template.
 *
 * @param mainWindow — Reference to the main BrowserWindow (nullable if not yet created)
 * @returns Array of MenuItemConstructorOptions ready for Menu.buildFromTemplate()
 */
export declare function buildMenuTemplate(mainWindow: BrowserWindow | null): MenuItemConstructorOptions[];
/**
 * Build and apply the application menu.
 *
 * @param mainWindow — Reference to the main BrowserWindow
 */
export declare function applyApplicationMenu(mainWindow: BrowserWindow | null): void;
/**
 * Create a context menu for right-click events.
 * Returns a Menu instance that can be shown via `menu.popup()`.
 *
 * @param window — The window in which to show the context menu
 * @param options — Optional context menu items to append
 * @returns Menu instance
 */
export declare function createContextMenu(window: BrowserWindow, options?: MenuItemConstructorOptions[]): Menu;
/**
 * Disable the application menu entirely.
 * Useful during splash screen or setup wizard phases.
 */
export declare function disableMenu(): void;
