import { app, Tray, Menu, nativeImage, } from 'electron';
import * as path from 'path';
const TRAY_ICON_SIZE = 16;
export function createSystemTray(mainWindow) {
    const iconName = 'icon.png';
    const iconPath = path.join(app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(app.getAppPath(), 'electron', 'assets'), iconName);
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        trayIcon = trayIcon.resize({ width: TRAY_ICON_SIZE, height: TRAY_ICON_SIZE });
    }
    catch {
        console.warn('[Tray] Icon not found, using empty fallback');
        trayIcon = nativeImage.createEmpty();
    }
    const tray = new Tray(trayIcon);
    tray.setToolTip(`ZYNC v${app.getVersion()}`);
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