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
import { app, Menu, shell, dialog, } from 'electron';
/**
 * Determines whether the current platform is macOS.
 *
 * This constant is used throughout the menu configuration to apply
 * platform-specific behavior. macOS has different menu conventions than
 * Windows and Linux (e.g., the application menu is named after the app
 * instead of "File", and uses Cmd instead of Ctrl for keyboard shortcuts).
 *
 * @constant {boolean}
 */
const isMac = process.platform === 'darwin';
/**
 * The product name of the application.
 *
 * Used in menu labels, dialog titles, and other places where the
 * application name needs to be displayed to the user.
 *
 * @constant {string}
 */
const APP_NAME = 'ZYNC';
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
export function buildApplicationMenu(mainWindow) {
    /**
     * =========================================================================
     * macOS Application Menu
     * =========================================================================
     *
     * On macOS, the first menu in the menu bar is always the application menu,
     * which is named after the application (in this case, "ZYNC"). This menu
     * contains standard items like About, Preferences, Services, Hide, and Quit.
     *
     * This menu is only included on macOS — on Windows and Linux, these items
     * are distributed across other menus (File, Edit, Help, etc.).
     *
     * @see https://developer.apple.com/design/human-interface-guidelines/menus
     */
    const macAppMenu = {
        label: APP_NAME,
        submenu: [
            /**
             * About ZYNC
             * Shows the standard macOS "About" dialog with application version,
             * copyright information, and credits.
             */
            {
                label: `About ${APP_NAME}`,
                role: 'about',
            },
            /**
             * Separator line between logical groups of menu items.
             * This follows the standard macOS application menu structure.
             */
            { type: 'separator' },
            /**
             * Preferences
             * Opens the application settings window. This is the standard
             * macOS shortcut for accessing application preferences (Cmd+,).
             */
            {
                label: 'Preferences...',
                accelerator: 'Cmd+,',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'open-settings' });
                    }
                },
            },
            { type: 'separator' },
            /**
             * Services submenu
             * macOS standard Services menu, which provides access to OS-level
             * services like text manipulation, URL handling, etc.
             */
            {
                label: 'Services',
                role: 'services',
            },
            { type: 'separator' },
            /**
             * Hide/Show controls
             * Standard macOS window management items for hiding the application
             * and other applications.
             */
            {
                label: `Hide ${APP_NAME}`,
                role: 'hide',
            },
            {
                label: 'Hide Others',
                role: 'hideOthers',
            },
            {
                label: 'Show All',
                role: 'unhide',
            },
            { type: 'separator' },
            /**
             * Quit
             * Terminates the application. On macOS, Cmd+Q is the standard
             * keyboard shortcut for quitting an application.
             */
            {
                label: `Quit ${APP_NAME}`,
                role: 'quit',
            },
        ],
    };
    /**
     * =========================================================================
     * File Menu
     * =========================================================================
     *
     * The File menu contains items related to file and window management.
     * On macOS, this menu is less populated because many items are in the
     * application menu. On Windows/Linux, this menu also contains Exit.
     *
     * Standard keyboard shortcuts:
     * - Ctrl/Cmd+N: New window or document
     * - Ctrl/Cmd+W: Close window
     * - Ctrl/Cmd+Q: Quit (Windows/Linux only)
     */
    const fileMenu = {
        label: 'File',
        submenu: [
            /**
             * New Window
             * Creates a new browser window with the same configuration as the
             * main window. This allows users to have multiple instances of the
             * application visible simultaneously.
             */
            {
                label: 'New Window',
                accelerator: 'CmdOrCtrl+N',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'new-window' });
                    }
                },
            },
            { type: 'separator' },
            /**
             * Open Settings
             * Opens the native settings window where users can configure
             * application preferences and download platform-specific installers.
             *
             * Keyboard shortcut: Ctrl+, (Windows/Linux) or Cmd+, (macOS)
             * Note: On macOS, this is also available in the Application menu
             * as "Preferences...", following macOS conventions.
             */
            {
                label: 'Settings',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'open-settings' });
                    }
                },
            },
            { type: 'separator' },
            /**
             * Close Window / Quit
             * On macOS, Cmd+W closes the current window but doesn't quit the app.
             * On Windows/Linux, this is replaced with "Exit" which quits the app.
             */
            isMac
                ? { label: 'Close Window', role: 'close' }
                : { label: 'Exit', role: 'quit' },
        ],
    };
    /**
     * =========================================================================
     * Edit Menu
     * =========================================================================
     *
     * The Edit menu provides standard text editing operations. These operations
     * are handled natively by the Chromium rendering engine in the renderer
     * process, so they work automatically with text inputs and contenteditable
     * elements.
     *
     * Standard keyboard shortcuts:
     * - Ctrl/Cmd+Z: Undo
     * - Ctrl/Cmd+Shift+Z or Ctrl+Y: Redo
     * - Ctrl/Cmd+X: Cut
     * - Ctrl/Cmd+C: Copy
     * - Ctrl/Cmd+V: Paste
     * - Ctrl/Cmd+A: Select All
     */
    const editMenu = {
        label: 'Edit',
        submenu: [
            /**
             * Undo: Reverses the last text editing action.
             * Works with all text inputs and contenteditable elements.
             */
            { label: 'Undo', role: 'undo' },
            /**
             * Redo: Re-applies the last undone action.
             * Keyboard shortcut varies by platform:
             * - macOS: Cmd+Shift+Z
             * - Windows/Linux: Ctrl+Y or Ctrl+Shift+Z
             */
            { label: 'Redo', role: 'redo' },
            { type: 'separator' },
            /**
             * Cut: Removes selected text and places it on the clipboard.
             */
            { label: 'Cut', role: 'cut' },
            /**
             * Copy: Copies selected text to the clipboard without removing it.
             */
            { label: 'Copy', role: 'copy' },
            /**
             * Paste: Inserts text from the clipboard at the current cursor position.
             */
            { label: 'Paste', role: 'paste' },
            /**
             * Delete: Removes selected text without placing it on the clipboard.
             * This is equivalent to pressing the Delete/Backspace key.
             */
            { label: 'Delete', role: 'delete' },
            { type: 'separator' },
            /**
             * Select All: Selects all text in the current focused element.
             * In the context of the ZYNC application, this works with text
             * inputs, text areas, and the note editor.
             */
            { label: 'Select All', role: 'selectAll' },
            /**
             * macOS-specific text manipulation items.
             * These are additional items that macOS users expect in the Edit menu.
             */
            ...(isMac
                ? [
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            /**
                             * Start Speaking: Uses macOS text-to-speech to read the
                             * selected text aloud. This is an accessibility feature.
                             */
                            { label: 'Start Speaking', role: 'startSpeaking' },
                            /**
                             * Stop Speaking: Stops the current text-to-speech session.
                             */
                            { label: 'Stop Speaking', role: 'stopSpeaking' },
                        ],
                    },
                ]
                : []),
        ],
    };
    /**
     * =========================================================================
     * View Menu
     * =========================================================================
     *
     * The View menu controls the display of the application, including
     * zoom level, fullscreen mode, and developer tools. These items help
     * users customize their viewing experience and are essential for
     * development and debugging.
     *
     * Standard keyboard shortcuts:
     * - Ctrl/Cmd+R: Reload
     * - Ctrl/Cmd+Shift+R: Force reload (clear cache)
     * - F11 / Ctrl/Cmd+F: Toggle fullscreen
     * - Ctrl/Cmd+Shift+I or F12: Toggle developer tools
     * - Ctrl/Cmd++: Zoom in
     * - Ctrl/Cmd+-: Zoom out
     * - Ctrl/Cmd+0: Reset zoom
     */
    const viewMenu = {
        label: 'View',
        submenu: [
            /**
             * Reload: Refreshes the current page by reloading the web content.
             * This does not clear the cache — cached resources will be reused.
             * Useful when the UI gets into an unexpected state.
             */
            { label: 'Reload', role: 'reload' },
            /**
             * Force Reload: Similar to Reload, but also clears the disk cache.
             * This ensures that all resources are fetched fresh from the server.
             * Use this when you suspect cached data is causing issues.
             */
            { label: 'Force Reload', role: 'forceReload' },
            /**
             * Toggle Developer Tools: Opens or closes the Chromium DevTools.
             * The DevTools panel provides access to the JavaScript console,
             * DOM inspector, network monitor, and other debugging tools.
             *
             * This is essential during development but should be used carefully
             * in production as it exposes internal application details.
             */
            { label: 'Toggle Developer Tools', role: 'toggleDevTools' },
            { type: 'separator' },
            /**
             * Actual Size: Resets the zoom level to 100% (the default).
             * Keyboard shortcut: Ctrl/Cmd+0
             */
            { label: 'Actual Size', role: 'resetZoom' },
            /**
             * Zoom In: Increases the zoom level by one step (typically 10%).
             * Keyboard shortcut: Ctrl/Cmd++
             */
            { label: 'Zoom In', role: 'zoomIn' },
            /**
             * Zoom Out: Decreases the zoom level by one step (typically 10%).
             * Keyboard shortcut: Ctrl/Cmd+-
             */
            { label: 'Zoom Out', role: 'zoomOut' },
            { type: 'separator' },
            /**
             * Toggle Fullscreen: Switches between fullscreen and windowed mode.
             * Keyboard shortcut: F11 (Windows/Linux) or Ctrl+Cmd+F (macOS)
             */
            { label: 'Toggle Full Screen', role: 'togglefullscreen' },
        ],
    };
    /**
     * =========================================================================
     * Window Menu
     * =========================================================================
     *
     * The Window menu provides window management operations. On macOS,
     * this includes additional items for minimizing, zooming, and
     * arranging windows, which are standard macOS menu items.
     */
    const windowMenu = {
        label: 'Window',
        submenu: [
            /**
             * Minimize: Minimizes the current window to the taskbar/dock.
             * On Windows/Linux, the window goes to the taskbar.
             * On macOS, the window goes to the Dock.
             */
            { label: 'Minimize', role: 'minimize' },
            /**
             * Zoom: Toggles between the window's current size and its
             * maximum size. On macOS, this is the green traffic light button.
             * On Windows/Linux, this maximizes/restores the window.
             */
            { label: 'Zoom', role: 'zoom' },
            /**
             * macOS-specific window management items.
             * These follow the standard macOS Window menu structure.
             */
            ...(isMac
                ? [
                    { type: 'separator' },
                    /**
                     * Bring All to Front: Brings all windows of the application
                     * to the front of the window stack. This is a standard macOS
                     * feature for applications with multiple windows.
                     */
                    { label: 'Bring All to Front', role: 'front' },
                ]
                : [
                    /**
                     * Close: Closes the current window.
                     * On Windows/Linux, if this is the last window, the app quits.
                     */
                    { label: 'Close', role: 'close' },
                ]),
        ],
    };
    /**
     * =========================================================================
     * Help Menu
     * =========================================================================
     *
     * The Help menu provides links to documentation, support resources,
     * and information about the application. These items open external
     * URLs in the user's default web browser.
     */
    const helpMenu = {
        label: 'Help',
        submenu: [
            /**
             * Documentation: Opens the ZYNC documentation website in the
             * user's default web browser. This provides access to user guides,
             * API references, and troubleshooting information.
             */
            {
                label: `${APP_NAME} Documentation`,
                click: async () => {
                    await shell.openExternal('https://github.com/ChitkulLakshya/Zync#readme');
                },
            },
            /**
             * Report an Issue: Opens the GitHub Issues page for reporting bugs,
             * requesting features, or asking questions about the application.
             */
            {
                label: 'Report an Issue',
                click: async () => {
                    await shell.openExternal('https://github.com/ChitkulLakshya/Zync/issues');
                },
            },
            { type: 'separator' },
            /**
             * Check for Updates: Triggers a manual check for application updates.
             * This sends a message to the main process to start the update check
             * flow, which will notify the user if an update is available.
             */
            {
                label: 'Check for Updates...',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('fromMain', { action: 'check-updates' });
                    }
                },
            },
            { type: 'separator' },
            /**
             * About: Shows information about the application, including the
             * version number, Electron/Node.js/Chrome versions, and credits.
             *
             * On macOS, this is also available in the Application menu.
             * On Windows/Linux, it's placed in the Help menu following
             * platform conventions.
             */
            ...(!isMac
                ? [
                    {
                        label: `About ${APP_NAME}`,
                        click: () => {
                            dialog.showMessageBox({
                                type: 'info',
                                title: `About ${APP_NAME}`,
                                message: `${APP_NAME} Desktop Application`,
                                detail: [
                                    `Version: ${app.getVersion()}`,
                                    `Electron: ${process.versions.electron}`,
                                    `Chrome: ${process.versions.chrome}`,
                                    `Node.js: ${process.versions.node}`,
                                    `V8: ${process.versions.v8}`,
                                    `OS: ${process.platform} ${process.arch}`,
                                    '',
                                    '© 2024-2026 ZYNC Team',
                                    'Licensed under the MIT License',
                                ].join('\n'),
                            });
                        },
                    },
                ]
                : []),
        ],
    };
    /**
     * =========================================================================
     * Assemble the Complete Menu Template
     * =========================================================================
     *
     * The menu template is assembled by combining all individual menu
     * definitions in the correct order. On macOS, the application menu
     * is prepended to the beginning of the template.
     *
     * Menu order:
     * - macOS: [App Menu], File, Edit, View, Window, Help
     * - Windows/Linux: File, Edit, View, Window, Help
     */
    const template = [
        ...(isMac ? [macAppMenu] : []),
        fileMenu,
        editMenu,
        viewMenu,
        windowMenu,
        helpMenu,
    ];
    /**
     * Build the menu from the template and return it.
     * The caller should set this as the application menu using
     * Menu.setApplicationMenu(menu).
     */
    const menu = Menu.buildFromTemplate(template);
    return menu;
}
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
export function setupApplicationMenu(mainWindow) {
    const menu = buildApplicationMenu(mainWindow);
    Menu.setApplicationMenu(menu);
}
//# sourceMappingURL=menu.js.map