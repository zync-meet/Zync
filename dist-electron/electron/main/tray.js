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
import { app, Tray, Menu, nativeImage, } from 'electron';
import * as path from 'path';
/** Tray icon size in pixels */
const TRAY_ICON_SIZE = 16;
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
export function createSystemTray(mainWindow) {
    // Use the user-provided logo
    const iconName = 'icon.png';
    // Resolve the icon path relative to the application root
    const iconPath = path.join(app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(app.getAppPath(), 'electron', 'assets'), iconName);
    // Create a fallback icon if the file doesn't exist
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        // Resize to standard tray icon size
        trayIcon = trayIcon.resize({ width: TRAY_ICON_SIZE, height: TRAY_ICON_SIZE });
    }
    catch {
        // Create an empty 16x16 icon as fallback
        console.warn('[Tray] Icon not found, using empty fallback');
        trayIcon = nativeImage.createEmpty();
    }
    // Create the tray instance
    const tray = new Tray(trayIcon);
    // Set the tooltip (hover text)
    tray.setToolTip(`ZYNC v${app.getVersion()}`);
    /**
     * Build the context menu for right-click on the tray icon.
     */
    const contextMenu = [
        {
            label: 'Show ZYNC',
            click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('fromMain', { action: 'open-settings' });
                    mainWindow.show();
                }
            },
        },
        {
            label: 'Check for Updates',
            click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('fromMain', { action: 'check-updates' });
                }
            },
        },
        { type: 'separator' },
        {
            label: `About ZYNC v${app.getVersion()}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Quit ZYNC',
            click: () => {
                app.quit();
            },
        },
    ];
    tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
    /**
     * Handle left-click on the tray icon.
     * Shows/hides the main window (toggle behavior).
     */
    tray.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            }
            else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
    /**
     * Handle double-click on the tray icon (Windows only).
     * Always shows and focuses the main window.
     */
    tray.on('double-click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    console.info('[Tray] System tray created');
    return tray;
}
//# sourceMappingURL=tray.js.map