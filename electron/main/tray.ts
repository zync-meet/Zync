import {
    app,
    Tray,
    Menu,
    BrowserWindow,
    nativeImage,
    MenuItemConstructorOptions,
} from 'electron';
import * as path from 'path';


const TRAY_ICON_SIZE = 16;


export function createSystemTray(mainWindow: BrowserWindow): Tray {

    const iconName = 'icon.png';


    const iconPath = path.join(
        app.isPackaged
            ? path.join(process.resourcesPath, 'assets')
            : path.join(app.getAppPath(), 'electron', 'assets'),
        iconName,
    );


    let trayIcon: Electron.NativeImage;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);

        trayIcon = trayIcon.resize({ width: TRAY_ICON_SIZE, height: TRAY_ICON_SIZE });
    } catch {

        console.warn('[Tray] Icon not found, using empty fallback');
        trayIcon = nativeImage.createEmpty();
    }


    const tray = new Tray(trayIcon);


    tray.setToolTip(`ZYNC v${app.getVersion()}`);


    const contextMenu: MenuItemConstructorOptions[] = [
        {
            label: 'Show ZYNC',
            click: (): void => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: (): void => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('fromMain', { action: 'open-settings' });
                    mainWindow.show();
                }
            },
        },
        {
            label: 'Check for Updates',
            click: (): void => {
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
            click: (): void => {
                app.quit();
            },
        },
    ];

    tray.setContextMenu(Menu.buildFromTemplate(contextMenu));


    tray.on('click', (): void => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });


    tray.on('double-click', (): void => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    console.info('[Tray] System tray created');
    return tray;
}
