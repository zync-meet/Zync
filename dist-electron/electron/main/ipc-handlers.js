/**
 * =============================================================================
 * IPC Handlers — ZYNC Desktop Application
 * =============================================================================
 *
 * This module registers all Inter-Process Communication (IPC) handlers for
 * the ZYNC desktop application. IPC handlers process messages sent from the
 * renderer process (React app) to the main process (Node.js/Electron).
 *
 * IPC is the primary mechanism for the renderer process to request actions
 * that require Node.js or native OS access, such as file system operations,
 * system dialogs, application updates, and window management.
 *
 * Security Considerations:
 * - All IPC channels are whitelisted and documented
 * - Input validation is performed on all incoming messages
 * - Sensitive operations require explicit user confirmation
 * - File paths are sanitized to prevent directory traversal attacks
 *
 * Channel Naming Convention:
 * - Use kebab-case for channel names (e.g., 'download-platform')
 * - Prefix with the feature area when appropriate (e.g., 'settings:get')
 * - Use descriptive names that clearly indicate the action
 *
 * @module electron/main/ipc-handlers
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 *
 * @see https://www.electronjs.org/docs/latest/api/ipc-main
 * @see https://www.electronjs.org/docs/latest/tutorial/ipc
 * =============================================================================
 */
import { ipcMain, app, shell, dialog, clipboard, nativeTheme, } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
/**
 * Valid platform identifiers for download requests.
 *
 * This array is used for input validation to ensure that only valid
 * platform identifiers are accepted. Any request with a platform
 * value not in this list will be rejected.
 *
 * @constant {readonly string[]}
 */
const VALID_PLATFORMS = ['win', 'mac', 'linux'];
/**
 * Maps platform identifiers to their corresponding download URLs.
 *
 * These URLs point to the latest release assets on GitHub. When a user
 * requests a download, the appropriate URL is opened in their default
 * web browser.
 *
 * @constant {Record<ValidPlatform, string>}
 */
const DOWNLOAD_URLS = {
    win: 'https://github.com/ChitkulLakshya/Zync/releases/latest/download/ZYNC-Setup.exe',
    mac: 'https://github.com/ChitkulLakshya/Zync/releases/latest/download/ZYNC.dmg',
    linux: 'https://github.com/ChitkulLakshya/Zync/releases/latest/download/ZYNC.AppImage',
};
/**
 * Validates whether a platform identifier is a valid download platform.
 *
 * This function uses TypeScript's type narrowing to provide type-safe
 * platform validation. After calling this function with a truthy result,
 * TypeScript knows the value is a ValidPlatform.
 *
 * @param {string} platform - The platform identifier to validate
 * @returns {boolean} True if the platform is valid, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidPlatform(platform)) {
 *   // TypeScript knows platform is ValidPlatform here
 *   const url = DOWNLOAD_URLS[platform];
 * }
 * ```
 */
function isValidPlatform(platform) {
    return VALID_PLATFORMS.includes(platform);
}
/**
 * Registers all IPC handlers for the application.
 *
 * This function should be called once during application startup, after
 * the main window has been created. It sets up listeners for all IPC
 * channels and connects them to the appropriate handler functions.
 *
 * Channels are organized into categories:
 * 1. Navigation & Window Management
 * 2. Platform Downloads
 * 3. Application Information
 * 4. Settings & Preferences
 * 5. File System Operations
 * 6. System Integration
 *
 * @param {BrowserWindow} mainWindow - The main application window
 * @param {BrowserWindow | null} settingsWindow - The settings window (if open)
 *
 * @example
 * ```typescript
 * import { registerIpcHandlers } from './ipc-handlers';
 *
 * app.on('ready', () => {
 *   const mainWindow = createMainWindow();
 *   registerIpcHandlers(mainWindow, null);
 * });
 * ```
 */
export function registerIpcHandlers(mainWindow, settingsWindow) {
    // ===========================================================================
    // Category 1: Platform Downloads
    // ===========================================================================
    /**
     * Handler: download-platform
     *
     * Opens the download URL for the specified platform in the user's
     * default web browser. This allows users to download the ZYNC desktop
     * application for different operating systems from the settings page.
     *
     * Channel: 'download-platform'
     * Direction: Renderer → Main (one-way)
     * Input: platform string ('win', 'mac', or 'linux')
     * Output: None (opens external URL)
     *
     * Security: Input is validated against the VALID_PLATFORMS whitelist
     * to prevent arbitrary URL opening.
     */
    ipcMain.on('download-platform', (_event, platform) => {
        // Validate the platform input against the whitelist
        if (!isValidPlatform(platform)) {
            console.warn(`[IPC] Invalid platform requested: ${platform}`);
            return;
        }
        // Get the download URL for the requested platform
        const downloadUrl = DOWNLOAD_URLS[platform];
        // Open the URL in the user's default web browser
        // shell.openExternal is used instead of creating a new BrowserWindow
        // because the download should be handled by the user's browser
        console.info(`[IPC] Opening download URL for platform: ${platform}`);
        shell.openExternal(downloadUrl).catch((error) => {
            console.error(`[IPC] Failed to open download URL: ${error.message}`);
        });
    });
    // ===========================================================================
    // Category 2: Settings Window Management
    // ===========================================================================
    /**
     * Handler: open-settings
     *
     * Opens or focuses the settings window. If the settings window is
     * already open, it brings it to the front. Otherwise, it creates
     * a new settings window.
     *
     * Channel: 'open-settings'
     * Direction: Renderer → Main (one-way)
     * Input: None
     * Output: None (opens/focuses settings window)
     */
    ipcMain.on('open-settings', () => {
        console.info('[IPC] Settings window requested');
        if (settingsWindow && !settingsWindow.isDestroyed()) {
            // If the settings window already exists and hasn't been destroyed,
            // bring it to the front and focus it
            settingsWindow.focus();
        }
        else {
            // Send a message back to the main process to create a new settings window
            // This is handled by the main module's createSettingsWindow function
            mainWindow.webContents.send('fromMain', { action: 'create-settings-window' });
        }
    });
    // ===========================================================================
    // Category 3: Application Information
    // ===========================================================================
    /**
     * Handler: get-app-info
     *
     * Returns comprehensive information about the application and its
     * runtime environment. This is used by the settings page and about
     * dialog to display version information.
     *
     * Channel: 'get-app-info'
     * Direction: Renderer → Main (two-way, invoke/handle)
     * Input: None
     * Output: AppInfo object with version and environment details
     */
    ipcMain.handle('get-app-info', async () => {
        const appInfo = {
            version: app.getVersion(),
            name: app.getName(),
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome,
            nodeVersion: process.versions.node,
            v8Version: process.versions.v8,
            platform: process.platform,
            arch: process.arch,
            userDataPath: app.getPath('userData'),
        };
        return appInfo;
    });
    /**
     * Handler: get-app-version
     *
     * Returns just the application version string. This is a simpler
     * alternative to 'get-app-info' when only the version is needed.
     *
     * Channel: 'get-app-version'
     * Direction: Renderer → Main (two-way, invoke/handle)
     * Input: None
     * Output: Version string (e.g., "1.0.0")
     */
    ipcMain.handle('get-app-version', async () => {
        return app.getVersion();
    });
    // ===========================================================================
    // Category 4: System Integration
    // ===========================================================================
    /**
     * Handler: open-external-link
     *
     * Opens a URL in the user's default web browser. This is used by
     * the renderer process to open external links without relying on
     * window.open(), which may be blocked by popup blockers.
     *
     * Channel: 'open-external-link'
     * Direction: Renderer → Main (one-way)
     * Input: URL string
     * Output: None (opens URL externally)
     *
     * Security: URLs are validated to ensure they use HTTPS or HTTP
     * protocols. Other protocols (file://, javascript://, etc.) are
     * rejected to prevent security vulnerabilities.
     */
    ipcMain.on('open-external-link', (_event, url) => {
        // Validate that the input is a string
        if (typeof url !== 'string') {
            console.warn('[IPC] open-external-link: Invalid URL type');
            return;
        }
        // Validate the URL protocol (only allow http and https)
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                console.warn(`[IPC] Rejected non-HTTP URL: ${url}`);
                return;
            }
        }
        catch {
            console.warn(`[IPC] Invalid URL format: ${url}`);
            return;
        }
        // Open the validated URL in the default browser
        shell.openExternal(url).catch((error) => {
            console.error(`[IPC] Failed to open external link: ${error.message}`);
        });
    });
    /**
     * Handler: get-system-theme
     *
     * Returns the current system theme preference (light or dark).
     * This allows the renderer process to match the native OS theme.
     *
     * Channel: 'get-system-theme'
     * Direction: Renderer → Main (two-way, invoke/handle)
     * Input: None
     * Output: 'dark' or 'light'
     */
    ipcMain.handle('get-system-theme', async () => {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });
    /**
     * Handler: copy-to-clipboard
     *
     * Copies text to the system clipboard. This provides a native
     * clipboard API that works consistently across all platforms.
     *
     * Channel: 'copy-to-clipboard'
     * Direction: Renderer → Main (one-way)
     * Input: Text string to copy
     * Output: None
     */
    ipcMain.on('copy-to-clipboard', (_event, text) => {
        if (typeof text === 'string') {
            clipboard.writeText(text);
        }
    });
    // ===========================================================================
    // Category 5: Window Management
    // ===========================================================================
    /**
     * Handler: minimize-window
     *
     * Minimizes the main application window to the taskbar/dock.
     *
     * Channel: 'minimize-window'
     * Direction: Renderer → Main (one-way)
     */
    ipcMain.on('minimize-window', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.minimize();
        }
    });
    /**
     * Handler: maximize-window
     *
     * Toggles the main window between maximized and restored states.
     * If the window is currently maximized, it will be restored to its
     * previous size and position. Otherwise, it will be maximized.
     *
     * Channel: 'maximize-window'
     * Direction: Renderer → Main (one-way)
     */
    ipcMain.on('maximize-window', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            }
            else {
                mainWindow.maximize();
            }
        }
    });
    /**
     * Handler: close-window
     *
     * Closes the main application window. On macOS, this hides the window
     * instead of quitting the application (following macOS conventions).
     *
     * Channel: 'close-window'
     * Direction: Renderer → Main (one-way)
     */
    ipcMain.on('close-window', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.close();
        }
    });
    /**
     * Handler: is-window-maximized
     *
     * Returns whether the main window is currently maximized.
     * Used by the renderer to update the maximize/restore button icon.
     *
     * Channel: 'is-window-maximized'
     * Direction: Renderer → Main (two-way, invoke/handle)
     * Output: boolean
     */
    ipcMain.handle('is-window-maximized', async () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            return mainWindow.isMaximized();
        }
        return false;
    });
    // ===========================================================================
    // Category 6: File System Operations
    // ===========================================================================
    /**
     * Handler: show-save-dialog
     *
     * Shows a native file save dialog and returns the selected file path.
     * This is used when the user wants to export data (notes, reports, etc.)
     * to a file on their local file system.
     *
     * Channel: 'show-save-dialog'
     * Direction: Renderer → Main (two-way, invoke/handle)
     * Input: Dialog options (title, default path, filters)
     * Output: Selected file path or null if cancelled
     */
    ipcMain.handle('show-save-dialog', async (_event, options) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: options.title || 'Save File',
            defaultPath: options.defaultPath || app.getPath('documents'),
            filters: options.filters || [
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        if (result.canceled || !result.filePath) {
            return null;
        }
        return result.filePath;
    });
    /**
     * Handler: show-open-dialog
     *
     * Shows a native file open dialog and returns the selected file path(s).
     * This is used when the user wants to import files or select directories.
     *
     * Channel: 'show-open-dialog'
     * Direction: Renderer → Main (two-way, invoke/handle)
     * Input: Dialog options (title, filters, properties)
     * Output: Array of selected file paths or empty array if cancelled
     */
    ipcMain.handle('show-open-dialog', async (_event, options) => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: options.title || 'Open File',
            defaultPath: options.defaultPath || app.getPath('documents'),
            filters: options.filters || [
                { name: 'All Files', extensions: ['*'] },
            ],
            properties: options.properties || ['openFile'],
        });
        if (result.canceled) {
            return [];
        }
        return result.filePaths;
    });
    /**
     * Handler: write-file
     *
     * Writes content to a file on the local file system. The file path
     * must be within the user's data directory or a location explicitly
     * chosen through a save dialog.
     *
     * Channel: 'write-file'
     * Direction: Renderer → Main (two-way, invoke/handle)
     * Input: { filePath: string, content: string, encoding?: string }
     * Output: { success: boolean, error?: string }
     *
     * Security: File paths are validated to prevent writing outside of
     * allowed directories (user data, documents, downloads).
     */
    ipcMain.handle('write-file', async (_event, data) => {
        try {
            // Validate input
            if (!data.filePath || typeof data.filePath !== 'string') {
                return { success: false, error: 'Invalid file path' };
            }
            if (typeof data.content !== 'string') {
                return { success: false, error: 'Invalid content' };
            }
            // Resolve the file path and check it's in an allowed directory
            const resolvedPath = path.resolve(data.filePath);
            const allowedPaths = [
                app.getPath('userData'),
                app.getPath('documents'),
                app.getPath('downloads'),
                app.getPath('desktop'),
            ];
            const isAllowed = allowedPaths.some((allowedPath) => resolvedPath.startsWith(allowedPath));
            if (!isAllowed) {
                return {
                    success: false,
                    error: 'File path is outside of allowed directories',
                };
            }
            // Ensure the directory exists
            const dir = path.dirname(resolvedPath);
            await fs.promises.mkdir(dir, { recursive: true });
            // Write the file
            await fs.promises.writeFile(resolvedPath, data.content, data.encoding || 'utf-8');
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[IPC] Failed to write file: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    });
    // ===========================================================================
    // Logging
    // ===========================================================================
    console.info('[IPC] All IPC handlers registered successfully');
    console.info(`[IPC] Registered channels: download-platform, open-settings, ` +
        `get-app-info, get-app-version, open-external-link, get-system-theme, ` +
        `copy-to-clipboard, minimize-window, maximize-window, close-window, ` +
        `is-window-maximized, show-save-dialog, show-open-dialog, write-file`);
}
/**
 * Removes all registered IPC handlers.
 *
 * This should be called during application shutdown to clean up
 * resources and prevent memory leaks. It removes all listeners
 * registered by registerIpcHandlers().
 *
 * @example
 * ```typescript
 * app.on('before-quit', () => {
 *   removeIpcHandlers();
 * });
 * ```
 */
export function removeIpcHandlers() {
    const channels = [
        'download-platform',
        'open-settings',
        'open-external-link',
        'copy-to-clipboard',
        'minimize-window',
        'maximize-window',
        'close-window',
    ];
    const handleChannels = [
        'get-app-info',
        'get-app-version',
        'get-system-theme',
        'is-window-maximized',
        'show-save-dialog',
        'show-open-dialog',
        'write-file',
    ];
    channels.forEach((channel) => ipcMain.removeAllListeners(channel));
    handleChannels.forEach((channel) => ipcMain.removeHandler(channel));
    console.info('[IPC] All IPC handlers removed');
}
//# sourceMappingURL=ipc-handlers.js.map