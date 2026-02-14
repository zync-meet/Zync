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

import {
    app,
    Tray,
    Menu,
    MenuItemConstructorOptions,
    BrowserWindow,
    nativeImage,
    NativeImage,
} from 'electron';
import path from 'node:path';

// =============================================================================
// Constants
// =============================================================================

/** Default tray tooltip */
const TRAY_TOOLTIP = 'ZYNC';

/** Tray icon size (native image will auto-scale on HiDPI) */
const TRAY_ICON_SIZE = { width: 16, height: 16 };

// =============================================================================
// Tray State
// =============================================================================

/** Singleton tray instance */
let tray: Tray | null = null;

/** Whether the tray has been disposed */
let isDisposed = false;

// =============================================================================
// Icon Resolution
// =============================================================================

/**
 * Resolve the tray icon path based on the current platform and theme.
 *
 * On macOS, uses Template images for automatic dark/light adaptation.
 * On Linux, uses a regular PNG icon.
 * On Windows, uses ICO format.
 *
 * @param isDark — Whether the system is in dark mode
 * @returns Absolute path to the tray icon
 */
function resolveTrayIconPath(isDark?: boolean): string {
    const isMac = process.platform === 'darwin';
    const isWin = process.platform === 'win32';

    const iconsDir = path.join(app.getAppPath(), 'assets', 'icons');

    if (isMac) {
        // macOS Template images adapt to dark/light automatically
        return path.join(iconsDir, 'trayTemplate.png');
    }

    if (isWin) {
        return path.join(iconsDir, 'tray.ico');
    }

    // Linux
    return path.join(iconsDir, isDark ? 'tray-light.png' : 'tray-dark.png');
}

/**
 * Create a native image from the resolved tray icon path.
 * Falls back to an empty image if the file doesn't exist.
 *
 * @param isDark — Whether the system is in dark mode
 * @returns NativeImage for the tray
 */
function createTrayIcon(isDark?: boolean): NativeImage {
    const iconPath = resolveTrayIconPath(isDark);

    try {
        const icon = nativeImage.createFromPath(iconPath);

        if (icon.isEmpty()) {
            console.warn(`[TRAY] Icon not found at: ${iconPath}, using empty image`);
            return nativeImage.createEmpty();
        }

        // Resize for consistent display
        return icon.resize(TRAY_ICON_SIZE);
    } catch (error) {
        console.error(`[TRAY] Failed to load icon: ${error}`);
        return nativeImage.createEmpty();
    }
}

// =============================================================================
// Context Menu Builder
// =============================================================================

/**
 * Build the tray context menu template.
 *
 * @param mainWindow — Reference to the main BrowserWindow (nullable)
 * @param options — Additional state for dynamic menu items
 * @returns Array of MenuItemConstructorOptions
 */
function buildContextMenuTemplate(
    mainWindow: BrowserWindow | null,
    options: {
        isVisible?: boolean;
        hasUpdate?: boolean;
        updateVersion?: string;
    } = {},
): MenuItemConstructorOptions[] {
    const { isVisible = true, hasUpdate = false, updateVersion } = options;

    const template: MenuItemConstructorOptions[] = [
        // Show/Hide toggle
        {
            label: isVisible ? 'Hide ZYNC' : 'Show ZYNC',
            click: () => {
                if (!mainWindow) return;

                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },

        // Quick actions
        {
            label: 'New Project',
            click: () => {
                mainWindow?.webContents.send('main:message', {
                    type: 'new-project',
                });
                mainWindow?.show();
                mainWindow?.focus();
            },
        },
        {
            label: 'Open Dashboard',
            click: () => {
                mainWindow?.webContents.send('main:message', {
                    type: 'open-dashboard',
                });
                mainWindow?.show();
                mainWindow?.focus();
            },
        },
        { type: 'separator' },

        // Settings
        {
            label: 'Settings',
            click: () => {
                mainWindow?.webContents.send('main:message', {
                    type: 'open-settings',
                });
                mainWindow?.show();
                mainWindow?.focus();
            },
        },
    ];

    // Conditional update item
    if (hasUpdate) {
        template.push(
            { type: 'separator' },
            {
                label: updateVersion
                    ? `Update Available (v${updateVersion})`
                    : 'Update Available',
                click: () => {
                    mainWindow?.webContents.send('main:message', {
                        type: 'install-update',
                    });
                },
            },
        );
    }

    // Quit
    template.push(
        { type: 'separator' },
        {
            label: 'Quit ZYNC',
            click: () => {
                app.quit();
            },
        },
    );

    return template;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Initialize the system tray.
 *
 * Creates the tray icon, attaches a context menu, and wires up
 * click handlers for show/hide behavior.
 *
 * @param mainWindow — Reference to the main BrowserWindow
 * @returns The created Tray instance, or null if creation failed
 */
export function initTray(mainWindow: BrowserWindow | null): Tray | null {
    if (tray && !isDisposed) {
        console.warn('[TRAY] Tray already initialized, destroying old instance');
        destroyTray();
    }

    try {
        const icon = createTrayIcon();
        tray = new Tray(icon);
        isDisposed = false;

        // Set tooltip
        tray.setToolTip(TRAY_TOOLTIP);

        // Build and set context menu
        updateTrayMenu(mainWindow);

        // Click behavior
        tray.on('click', () => {
            if (!mainWindow) return;

            if (mainWindow.isVisible()) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        // Double-click (Windows) opens the app
        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        console.log('[TRAY] System tray initialized');
        return tray;
    } catch (error) {
        console.error('[TRAY] Failed to initialize tray:', error);
        return null;
    }
}

/**
 * Update the tray context menu with new state.
 *
 * @param mainWindow — Reference to the main BrowserWindow
 * @param options — Dynamic menu state
 */
export function updateTrayMenu(
    mainWindow: BrowserWindow | null,
    options: {
        isVisible?: boolean;
        hasUpdate?: boolean;
        updateVersion?: string;
    } = {},
): void {
    if (!tray || isDisposed) return;

    const template = buildContextMenuTemplate(mainWindow, options);
    const contextMenu = Menu.buildFromTemplate(template);
    tray.setContextMenu(contextMenu);
}

/**
 * Update the tray icon based on theme changes.
 *
 * @param isDark — Whether the system is in dark mode
 */
export function updateTrayIcon(isDark?: boolean): void {
    if (!tray || isDisposed) return;

    const icon = createTrayIcon(isDark);
    tray.setImage(icon);
}

/**
 * Set the tray tooltip text.
 *
 * @param text — Tooltip text (defaults to APP_NAME)
 */
export function setTrayTooltip(text: string = TRAY_TOOLTIP): void {
    if (!tray || isDisposed) return;
    tray.setToolTip(text);
}

/**
 * Show a tray balloon notification (Windows only).
 *
 * @param title — Balloon title
 * @param content — Balloon body text
 */
export function showTrayBalloon(title: string, content: string): void {
    if (!tray || isDisposed) return;
    if (process.platform !== 'win32') return;

    tray.displayBalloon({
        title,
        content,
        iconType: 'info',
    });
}

/**
 * Destroy the tray icon and clean up resources.
 */
export function destroyTray(): void {
    if (tray && !isDisposed) {
        tray.destroy();
        isDisposed = true;
        tray = null;
        console.log('[TRAY] System tray destroyed');
    }
}

/**
 * Get the current tray instance.
 *
 * @returns The Tray instance, or null if not initialized
 */
export function getTray(): Tray | null {
    return tray;
}
