/**
 * @file main.ts
 * @description Main process entry point for the ZYNC Desktop Application.
 * This file is responsible for creating windows, handling IPC communication,
 * and managing the application lifecycle.
 *
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 */

import { app, BrowserWindow, Menu, ipcMain, shell, IpcMainEvent } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Define the current directory path for ESM modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global reference to the main application window.
 * Kept global to prevent garbage collection.
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Global reference to the settings window.
 */
let settingsWindow: BrowserWindow | null = null;

/**
 * Creates the main application window.
 * Sets up the window properties, loads the application URL, and handles
 * development-specific configurations.
 *
 * @returns {void}
 */
const createWindow = (): void => {
  // Create the browser window with specified dimensions and preferences
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'ZYNC - All-in-One Workspace',
    backgroundColor: '#ffffff',
    webPreferences: {
      // Preload script to securely expose APIs to the renderer process
      preload: path.join(__dirname, 'preload.js'),
      // Security: Disable Node.js integration in the renderer
      nodeIntegration: false,
      // Security: Enable context isolation
      contextIsolation: true,
      // Security: Disable sandbox for this window (optional, depending on needs)
      sandbox: false,
    },
  });

  const isDev = !app.isPackaged;
  // The application URL: Use environment variable or default to a placeholder
  // In production, this should point to the deployed application or local static files
  const appUrl = process.env.APP_URL || 'https://google.com';
  const devUrl = 'http://localhost:5173';

  /**
   * Load the appropriate URL based on the environment.
   * In development, try to load the Vite dev server.
   * In production, load the static app URL.
   */
  if (isDev) {
    mainWindow.loadURL(devUrl).catch((err) => {
      console.error('Failed to load dev server URL:', err);
      console.log('Falling back to production APP_URL');
      mainWindow.loadURL(appUrl);
    });

    // Open the DevTools automatically in development mode for debugging
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(appUrl).catch((err) => {
      console.error('Failed to load application URL:', err);
    });
  }

  // Handle window closed event
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
};

/**
 * Creates or focuses the settings window.
 * Ensures only one instance of the settings window exists.
 *
 * @returns {void}
 */
const createSettingsWindow = (): void => {
  // If the window already exists, bring it to focus instead of creating a new one
  if (settingsWindow) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.focus();
    return;
  }

  // Create the settings window
  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    title: 'ZYNC Settings',
    resizable: false,
    autoHideMenuBar: true,
    parent: mainWindow || undefined, // Make it a child of the main window
    modal: false,       // Set to true if you want a modal dialog
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the local HTML file for settings
  const settingsPath = path.join(__dirname, 'settings/index.html');
  settingsWindow.loadFile(settingsPath).catch((err) => {
    console.error('Failed to load settings window:', err);
  });

  // Handle window closed event
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
};

/**
 * Configures the application menu.
 * customize this to add native menus for File, Edit, View, etc.
 *
 * @returns {void}
 */
const createMenu = (): void => {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: createSettingsWindow },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    } as Electron.MenuItemConstructorOptions] : []),
    // File Menu
    {
      label: 'File',
      submenu: [
        { label: 'Settings', click: createSettingsWindow },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    // Help Menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Application Lifecycle Handlers

/**
 * Called when Electron has finished initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
  console.log('App is ready, initializing...');

  // Set up IPC Main Handlers
  setupIpcHandlers();

  // Create Application Menu
  createMenu();

  // Create Main Window
  createWindow();

  // On macOS, it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed, except on macOS.
 * There, it's common for applications and their menu bar to stay active
 * until the user quits explicitly with Cmd + Q.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('All windows closed, quitting app.');
    app.quit();
  }
});

// IPC Handler Setup

/**
 * Sets up the Inter-Process Communication (IPC) handlers.
 * Listens for messages from the renderer process.
 */
function setupIpcHandlers(): void {
  /**
   * Handler to open the settings window.
   */
  ipcMain.on('open-settings', () => {
    createSettingsWindow();
  });

  /**
   * Handler to download the application for a specific platform.
   * Opens the download URL in the user's default browser.
   *
   * @param {IpcMainEvent} event - The IPC event.
   * @param {string} platform - The target platform ('win', 'mac', 'linux').
   */
  ipcMain.on('download-platform', (event: IpcMainEvent, platform: string) => {
    console.log(`Received download request for platform: ${platform}`);
    let url = '';

    // Determine the download URL based on the requested platform
    switch (platform) {
      case 'win':
        // TODO: Replace with actual Windows installer URL
        url = 'https://example.com/download/windows';
        break;
      case 'mac':
        // TODO: Replace with actual macOS DMG URL
        url = 'https://example.com/download/mac';
        break;
      case 'linux':
        // TODO: Replace with actual Linux AppImage URL
        url = 'https://example.com/download/linux';
        break;
      default:
        console.warn(`Unknown platform requested: ${platform}`);
        return;
    }

    if (url) {
      shell.openExternal(url).then(() => {
        console.log(`Opened URL for ${platform}: ${url}`);
      }).catch((err) => {
        console.error(`Failed to open URL for ${platform}:`, err);
      });
    }
  });
}
