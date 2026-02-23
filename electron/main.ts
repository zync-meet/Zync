/**
 * =============================================================================
 * Main Process — ZYNC Desktop Application
 * =============================================================================
 *
 * This is the entry point for the Electron main process. It manages the
 * application lifecycle, creates the primary and secondary windows, and
 * initializes all system-level modules (menu, tray, IPC, deep linking,
 * crash reporting, settings, splash screen, and security hardening).
 *
 * Startup Sequence:
 * 1. Request single instance lock (quit if already running)
 * 2. Initialize deep link handler (before app.whenReady())
 * 3. Disable hardware acceleration if user opted out
 * 4. Wait for app.whenReady()
 * 5. Initialize crash reporter
 * 6. Apply global security policies
 * 7. Initialize settings store
 * 8. Create splash screen
 * 9. Create main window (hidden)
 * 10. Initialize menu, IPC, tray, auto-updater
 * 11. Show main window & close splash
 * 12. Process pending deep links
 * 13. Clean up temporary files
 *
 * @module electron/main
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import modular components
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

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Global References (prevent garbage collection)
// =============================================================================

/** The main application window */
let mainWindow: BrowserWindow | null = null;

/** The settings window */
let settingsWindow: BrowserWindow | null = null;

/** The splash screen window */
let splashWindow: BrowserWindow | null = null;

/** The system tray instance */
let tray: ReturnType<typeof createSystemTray> | null = null;

/** The auto-updater service */
let autoUpdater: AutoUpdaterService | null = null;

/** Whether the app is running in development mode */
const isDev = !app.isPackaged;

/** Logger instance */
const log = logger;

// =============================================================================
// Pre-Ready Setup
// =============================================================================

// Initialize deep links BEFORE app.whenReady() to catch launch URLs
initializeDeepLinks();

// Request single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    log.info('Another instance is running. Quitting.');
    app.quit();
} else {
    // Handle second instance (focus window + process deep links)
    app.on('second-instance', (_event, argv) => {
        log.info('Second instance detected');
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
        handleSecondInstanceArgs(argv, mainWindow);
    });
}

// =============================================================================
// Splash Screen
// =============================================================================

/**
 * Creates the splash screen window.
 *
 * Displayed during startup while the main window loads. It's a small,
 * frameless, always-on-top window centered on the primary display.
 */
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

/**
 * Closes the splash screen with a fade-out animation.
 */
function closeSplashScreen(): void {
    if (!splashWindow || splashWindow.isDestroyed()) return;

    // Send close signal to the splash renderer for fade animation
    splashWindow.webContents.send('splash:close');

    // Wait for fade-out animation, then destroy
    setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
            splashWindow = null;
        }
    }, 400);

    log.info('Splash screen closing');
}

/**
 * Sends a status update to the splash screen.
 *
 * @param {string} message - Status message to display
 */
function updateSplashStatus(message: string): void {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('splash:status', message);
    }
}

// =============================================================================
// Main Window
// =============================================================================

/**
 * Creates the main application window.
 *
 * Loads the window state from disk, creates a BrowserWindow with proper
 * security settings, attaches CSP headers, and initializes crash handling.
 */
function createMainWindow(): void {
    updateSplashStatus('Creating main window…');
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

    // Attach window state persistence
    trackWindowState(mainWindow);

    // Apply security hardening (navigation/popup blocking)
    hardenWindow(mainWindow);

    // Setup permission handler for this window's session
    setupPermissionHandlers();

    // Attach renderer crash handler for auto-recovery
    attachRendererCrashHandler(mainWindow, 'main-window');

    // Restore maximized state
    if (state.isMaximized) {
        mainWindow.maximize();
    }

    // Load the application URL
    updateSplashStatus('Loading application…');
    const url = isDev ? DEV_SERVER_URL : (process.env.APP_URL || WEB_APP_URL);
    mainWindow.loadURL(url).catch((err) => {
        log.error('Failed to load application URL:', err);
    });

    // Set Content Security Policy headers for our own origins
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

    // Open DevTools in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Show main window when ready, close splash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        closeSplashScreen();
        log.info('Main window ready and visible');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        log.info('Main window closed');
    });

    // Handle close-to-tray behavior
    mainWindow.on('close', (event) => {
        try {
            const closeToTray = getSetting('closeToTray');
            if (closeToTray && tray) {
                event.preventDefault();
                mainWindow?.hide();
                log.info('Main window hidden to tray');
            }
        } catch {
            // If settings haven't loaded yet, allow normal close
        }
    });
}

// =============================================================================
// Settings Window
// =============================================================================

/**
 * Creates the settings window.
 *
 * Reuses the existing window if it's already open. The settings window
 * communicates with the main process via IPC for reading/writing settings.
 */
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

    // Apply security hardening
    hardenWindow(settingsWindow);

    // Attach renderer crash handler
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

// =============================================================================
// IPC Handlers (additional main-level handlers)
// =============================================================================

/**
 * Registers additional IPC handlers that need access to window references
 * (settings window creation, shell operations, dialog forwarding).
 */
function registerMainIpcHandlers(): void {
    // Open settings window
    ipcMain.on('fromMain', (_event, { action }) => {
        if (action === 'create-settings-window') {
            createSettingsWindow();
        }
    });

    ipcMain.on('open-settings', () => {
        createSettingsWindow();
    });

    // Open external links safely
    ipcMain.handle('shell:open-external', async (_event, url: string) => {
        if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
            await shell.openExternal(url);
        }
    });

    // Open dialog forwarding
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

    // Updater check
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

// =============================================================================
// Application Initialization
// =============================================================================

app.whenReady().then(async () => {
    log.info('===== ZYNC Desktop Application Starting =====');
    log.info(`Version: ${app.getVersion()}`);
    log.info(`Electron: ${process.versions.electron}`);
    log.info(`Platform: ${process.platform} (${process.arch})`);
    log.info(`Dev mode: ${isDev}`);

    // =========================================================================
    // Step 1: Initialize crash reporter
    // =========================================================================
    initCrashReporter({
        uploadToServer: false,
        showCrashDialog: isDev,
        autoRecoverRenderer: true,
    });

    // =========================================================================
    // Step 2: Apply global security policies
    // =========================================================================
    applyGlobalSecurity();

    // =========================================================================
    // Step 3: Initialize settings store
    // =========================================================================
    initSettingsStore();

    // =========================================================================
    // Step 4: Create splash screen
    // =========================================================================
    createSplashScreen();

    // Small delay so splash screen renders
    await new Promise((resolve) => setTimeout(resolve, 100));

    // =========================================================================
    // Step 5: Create main window
    // =========================================================================
    createMainWindow();

    if (mainWindow) {
        // =====================================================================
        // Step 6: Initialize modular subsystems
        // =====================================================================
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

        // =====================================================================
        // Step 7: Process pending deep links
        // =====================================================================
        processPendingDeepLink(mainWindow);
    }

    // =========================================================================
    // Step 8: Cleanup old temporary files (async, non-blocking)
    // =========================================================================
    cleanupTempFiles(86400000).catch((err) => {
        log.error('Failed to cleanup temp files:', err);
    });

    log.info('===== ZYNC Desktop Application Initialized =====');
});

// =============================================================================
// Application Lifecycle Events
// =============================================================================

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Re-create window when dock icon is clicked (macOS)
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    } else if (mainWindow) {
        mainWindow.show();
    }
});

// Cleanup on quit
app.on('before-quit', () => {
    log.info('Application quitting...');

    // Dispose auto-updater
    if (autoUpdater) {
        autoUpdater.dispose();
        autoUpdater = null;
    }

    // Destroy tray icon
    if (tray) {
        try {
            tray.destroy();
        } catch {
            // Ignore tray destruction errors
        }
        tray = null;
    }
});
