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


const TRAY_TOOLTIP = 'ZYNC';


const TRAY_ICON_SIZE = { width: 16, height: 16 };


let tray: Tray | null = null;


let isDisposed = false;


function resolveTrayIconPath(isDark?: boolean): string {
    const isMac = process.platform === 'darwin';
    const isWin = process.platform === 'win32';

    const iconsDir = path.join(app.getAppPath(), 'assets', 'icons');

    if (isMac) {

        return path.join(iconsDir, 'trayTemplate.png');
    }

    if (isWin) {
        return path.join(iconsDir, 'tray.ico');
    }


    return path.join(iconsDir, isDark ? 'tray-light.png' : 'tray-dark.png');
}


function createTrayIcon(isDark?: boolean): NativeImage {
    const iconPath = resolveTrayIconPath(isDark);

    try {
        const icon = nativeImage.createFromPath(iconPath);

        if (icon.isEmpty()) {
            console.warn(`[TRAY] Icon not found at: ${iconPath}, using empty image`);
            return nativeImage.createEmpty();
        }


        return icon.resize(TRAY_ICON_SIZE);
    } catch (error) {
        console.error(`[TRAY] Failed to load icon: ${error}`);
        return nativeImage.createEmpty();
    }
}


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

        {
            label: isVisible ? 'Hide ZYNC' : 'Show ZYNC',
            click: () => {
                if (!mainWindow) {return;}

                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },


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


export function initTray(mainWindow: BrowserWindow | null): Tray | null {
    if (tray && !isDisposed) {
        console.warn('[TRAY] Tray already initialized, destroying old instance');
        destroyTray();
    }

    try {
        const icon = createTrayIcon();
        tray = new Tray(icon);
        isDisposed = false;


        tray.setToolTip(TRAY_TOOLTIP);


        updateTrayMenu(mainWindow);


        tray.on('click', () => {
            if (!mainWindow) {return;}

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


export function updateTrayMenu(
    mainWindow: BrowserWindow | null,
    options: {
        isVisible?: boolean;
        hasUpdate?: boolean;
        updateVersion?: string;
    } = {},
): void {
    if (!tray || isDisposed) {return;}

    const template = buildContextMenuTemplate(mainWindow, options);
    const contextMenu = Menu.buildFromTemplate(template);
    tray.setContextMenu(contextMenu);
}


export function updateTrayIcon(isDark?: boolean): void {
    if (!tray || isDisposed) {return;}

    const icon = createTrayIcon(isDark);
    tray.setImage(icon);
}


export function setTrayTooltip(text: string = TRAY_TOOLTIP): void {
    if (!tray || isDisposed) {return;}
    tray.setToolTip(text);
}


export function showTrayBalloon(title: string, content: string): void {
    if (!tray || isDisposed) {return;}
    if (process.platform !== 'win32') {return;}

    tray.displayBalloon({
        title,
        content,
        iconType: 'info',
    });
}


export function destroyTray(): void {
    if (tray && !isDisposed) {
        tray.destroy();
        isDisposed = true;
        tray = null;
        console.log('[TRAY] System tray destroyed');
    }
}


export function getTray(): Tray | null {
    return tray;
}
