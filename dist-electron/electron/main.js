/**
 * =============================================================================
 * Main Process — ZYNC Desktop Application
 * =============================================================================
 *
 * This is the entry point for the Electron main process. It manages the
 * application lifecycle, creates the primary and secondary windows, and
 * initializes all system-level modules (menu, tray, IPC, etc.).
 *
 * @module electron/main
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
// Import modular components
import { buildApplicationMenu } from './main/menu.js';
import { registerIpcHandlers } from './main/ipc-handlers.js';
import { createSystemTray } from './main/tray.js';
import { loadWindowState, trackWindowState } from './main/window-state.js';
import { AutoUpdaterService } from './services/auto-updater.js';
import { logger } from './utils/logger.js';
import { APP_NAME, DEV_SERVER_URL, WEB_APP_URL, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT, } from './config/constants.js';
import { buildCSPString, buildDevCSPString } from './config/csp.js';
// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Global references to prevent garbage collection
let mainWindow = null;
let settingsWindow = null;
let tray = null;
let autoUpdater = null;
const isDev = !app.isPackaged;
const log = logger;
/**
 * Creates the main application window.
 */
function createMainWindow() {
    const state = loadWindowState();
    mainWindow = new BrowserWindow({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        minWidth: MIN_WINDOW_WIDTH,
        minHeight: MIN_WINDOW_HEIGHT,
        title: APP_NAME,
        icon: path.join(app.getAppPath(), 'electron', 'assets', 'icon.png'),
        show: false,
        backgroundColor: '#ffffff',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        },
    });
    // Attach window state tracking
    trackWindowState(mainWindow);
    if (state.isMaximized) {
        mainWindow.maximize();
    }
    // Load the application
    const url = isDev ? DEV_SERVER_URL : (process.env.APP_URL || WEB_APP_URL);
    mainWindow.loadURL(url).catch((err) => {
        log.error('Failed to load application URL:', err);
    });
    // Set Content Security Policy only for our own application origins
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
        }
        else {
            callback({ responseHeaders: details.responseHeaders });
        }
    });
    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        log.info('Main window ready-to-show');
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        log.info('Main window closed');
    });
}
/**
 * Creates the settings window.
 */
function createSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.focus();
        return;
    }
    settingsWindow = new BrowserWindow({
        width: 600,
        height: 700,
        title: `${APP_NAME} Settings`,
        parent: mainWindow || undefined,
        modal: false,
        resizable: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    const settingsPath = path.join(__dirname, 'settings/index.html');
    settingsWindow.loadFile(settingsPath).catch((err) => {
        log.error('Failed to load settings file:', err);
    });
    settingsWindow.once('ready-to-show', () => {
        settingsWindow?.show();
    });
    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}
/**
 * App initialization.
 */
app.whenReady().then(() => {
    log.info('Application starting...');
    createMainWindow();
    if (mainWindow) {
        // Initialize modular components
        buildApplicationMenu(mainWindow);
        registerIpcHandlers(mainWindow, settingsWindow);
        tray = createSystemTray(mainWindow);
        // Initialize auto-updater
        autoUpdater = new AutoUpdaterService(mainWindow);
        autoUpdater.initialize();
    }
    // Handle cross-module requests
    ipcMain.on('fromMain', (event, { action }) => {
        if (action === 'create-settings-window') {
            createSettingsWindow();
        }
    });
    log.info('Application initialized');
});
// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
// Prevention of multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}
else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
}
//# sourceMappingURL=main.js.map