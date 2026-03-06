import { app, BrowserWindow, ipcMain, shell, nativeImage } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';


import { buildApplicationMenu } from './main/menu.js';
import { registerIpcHandlers } from './main/ipc-handlers.js';
import { createSystemTray } from './main/tray.js';
import { loadWindowState, trackWindowState } from './main/window-state.js';
import { AutoUpdaterService } from './services/auto-updater.js';
import { logger } from './utils/logger.js';
import {
    APP_NAME,
    DEV_SERVER_URL,
    WEB_APP_URL,
    MIN_WINDOW_WIDTH,
    MIN_WINDOW_HEIGHT,
} from './config/constants.js';
import { buildCSPString, buildDevCSPString } from './config/csp.js';
import { applyGlobalSecurity, hardenWindow } from './config/security.js';
import { setupPermissionHandlers } from './config/permissions.js';
import { initCrashReporter, attachRendererCrashHandler } from './main/crash-reporter.js';
import {
    initializeDeepLinks,
    handleSecondInstanceArgs,
    processPendingDeepLink,
} from './main/deep-link.js';
import { initSettingsStore, getSetting } from './settings/store.js';
import { cleanupTempFiles } from './utils/fs-helpers.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


let mainWindow: BrowserWindow | null = null;


let settingsWindow: BrowserWindow | null = null;


let splashWindow: BrowserWindow | null = null;


let tray: ReturnType<typeof createSystemTray> | null = null;


let autoUpdater: AutoUpdaterService | null = null;


const isDev = !app.isPackaged;


const log = logger;


// On Linux, set WM_CLASS to match the .desktop file for proper taskbar icon
if (process.platform === 'linux') {
    app.commandLine.appendSwitch('class', 'zync');
    app.name = 'zync';
}


initializeDeepLinks();


const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    log.info('Another instance is running. Quitting.');
    app.quit();
} else {

    app.on('second-instance', (_event, argv) => {
        log.info('Second instance detected');
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
        handleSecondInstanceArgs(argv, mainWindow);
    });
}


function createSplashScreen(): void {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        movable: false,
        skipTaskbar: true,
        center: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const splashPath = path.join(__dirname, 'splash', 'index.html');
    splashWindow.loadFile(splashPath).catch((err) => {
        log.error('Failed to load splash screen:', err);
    });

    splashWindow.once('ready-to-show', () => {
        splashWindow?.show();
    });

    splashWindow.on('closed', () => {
        splashWindow = null;
    });

    log.info('Splash screen created');
}


function closeSplashScreen(): void {
    if (!splashWindow || splashWindow.isDestroyed()) return;


    splashWindow.webContents.send('splash:close');


    setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
            splashWindow = null;
        }
    }, 400);

    log.info('Splash screen closing');
}


function updateSplashStatus(message: string): void {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('splash:status', message);
    }
}


function createMainWindow(): void {
    updateSplashStatus('Creating main window…');
    const state = loadWindowState();

    const iconPath = path.join(app.getAppPath(), 'electron', 'assets', 'icon.png');
    const appIcon = nativeImage.createFromPath(iconPath);

    mainWindow = new BrowserWindow({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        minWidth: MIN_WINDOW_WIDTH,
        minHeight: MIN_WINDOW_HEIGHT,
        title: APP_NAME,
        icon: appIcon,
        show: false,
        backgroundColor: '#0f0f1a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            spellcheck: true,
            enableWebSQL: false,
        },
    });


    trackWindowState(mainWindow);


    hardenWindow(mainWindow);


    setupPermissionHandlers();


    attachRendererCrashHandler(mainWindow, 'main-window');


    if (state.isMaximized) {
        mainWindow.maximize();
    }


    updateSplashStatus('Loading application…');
    const url = isDev ? DEV_SERVER_URL : (process.env.APP_URL || WEB_APP_URL);
    mainWindow.loadURL(url).catch((err) => {
        log.error('Failed to load application URL:', err);
    });


    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const isAppOrigin = details.url.startsWith(DEV_SERVER_URL) ||
            details.url.startsWith(WEB_APP_URL) ||
            details.url.startsWith('file://');

        if (isAppOrigin) {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [isDev ? buildDevCSPString() : buildCSPString()],
                },
            });
        } else {
            callback({ responseHeaders: details.responseHeaders });
        }
    });


    if (isDev) {
        mainWindow.webContents.openDevTools();
    }


    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        closeSplashScreen();
        log.info('Main window ready and visible');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        log.info('Main window closed');
    });


    mainWindow.on('close', (event) => {
        try {
            const closeToTray = getSetting('closeToTray');
            if (closeToTray && tray) {
                event.preventDefault();
                mainWindow?.hide();
                log.info('Main window hidden to tray');
            }
        } catch {

        }
    });
}


function createSettingsWindow(): void {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 880,
        height: 640,
        minWidth: 700,
        minHeight: 500,
        title: `${APP_NAME} — Settings`,
        parent: mainWindow || undefined,
        modal: false,
        resizable: true,
        show: false,
        backgroundColor: '#f8f9fa',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });


    hardenWindow(settingsWindow);


    attachRendererCrashHandler(settingsWindow, 'settings-window');

    const settingsPath = path.join(__dirname, 'settings', 'index.html');
    settingsWindow.loadFile(settingsPath).catch((err) => {
        log.error('Failed to load settings file:', err);
    });

    settingsWindow.once('ready-to-show', () => {
        settingsWindow?.show();
        log.info('Settings window opened');
    });

    settingsWindow.on('closed', () => {
        settingsWindow = null;
        log.info('Settings window closed');
    });
}


function registerMainIpcHandlers(): void {

    ipcMain.on('fromMain', (_event, { action }) => {
        if (action === 'create-settings-window') {
            createSettingsWindow();
        }
    });

    ipcMain.on('open-settings', () => {
        createSettingsWindow();
    });


    ipcMain.handle('shell:open-external', async (_event, url: string) => {
        if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
            await shell.openExternal(url);
        }
    });


    ipcMain.handle('dialog:open', async (_event, options: Electron.OpenDialogOptions) => {
        const { dialog } = await import('electron');
        if (settingsWindow && !settingsWindow.isDestroyed()) {
            return dialog.showOpenDialog(settingsWindow, options);
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
            return dialog.showOpenDialog(mainWindow, options);
        }
        return dialog.showOpenDialog(options);
    });


    ipcMain.handle('updater:check', async () => {
        if (autoUpdater) {
            try {
                const result = await autoUpdater.checkForUpdates();
                return result;
            } catch {
                return { updateAvailable: false };
            }
        }
        return { updateAvailable: false };
    });

    log.info('Main-level IPC handlers registered');
}


app.whenReady().then(async () => {
    log.info('===== ZYNC Desktop Application Starting =====');
    log.info(`Version: ${app.getVersion()}`);
    log.info(`Electron: ${process.versions.electron}`);
    log.info(`Platform: ${process.platform} (${process.arch})`);
    log.info(`Dev mode: ${isDev}`);


    initCrashReporter({
        uploadToServer: false,
        showCrashDialog: isDev,
        autoRecoverRenderer: true,
    });


    applyGlobalSecurity();


    initSettingsStore();


    createSplashScreen();


    await new Promise((resolve) => setTimeout(resolve, 100));


    createMainWindow();

    if (mainWindow) {


        updateSplashStatus('Setting up menus…');
        buildApplicationMenu(mainWindow);

        updateSplashStatus('Registering IPC handlers…');
        registerIpcHandlers(mainWindow, settingsWindow);
        registerMainIpcHandlers();

        updateSplashStatus('Creating system tray…');
        tray = createSystemTray(mainWindow);

        updateSplashStatus('Initializing auto-updater…');
        autoUpdater = new AutoUpdaterService(mainWindow);
        autoUpdater.initialize();


        processPendingDeepLink(mainWindow);
    }


    cleanupTempFiles(86400000).catch((err) => {
        log.error('Failed to cleanup temp files:', err);
    });

    log.info('===== ZYNC Desktop Application Initialized =====');
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    } else if (mainWindow) {
        mainWindow.show();
    }
});


app.on('before-quit', () => {
    log.info('Application quitting...');


    if (autoUpdater) {
        autoUpdater.dispose();
        autoUpdater = null;
    }


    if (tray) {
        try {
            tray.destroy();
        } catch {

        }
        tray = null;
    }
});
