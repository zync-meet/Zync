/**
 * =============================================================================
 * Dialog Manager — ZYNC Desktop
 * =============================================================================
 *
 * Provides a centralized API for showing native OS dialogs (message boxes,
 * file dialogs, error dialogs) from the main process. Wraps Electron's
 * dialog module with typed helpers and IPC integration.
 *
 * @module electron/main/dialog-manager
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { dialog, BrowserWindow, ipcMain } from 'electron';
import { logger } from '../utils/logger.js';
// =============================================================================
// Predefined File Filters
// =============================================================================
/** Common file filters for dialogs */
export const FILE_FILTERS = {
    /** All files */
    ALL: { name: 'All Files', extensions: ['*'] },
    /** Image files */
    IMAGES: { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
    /** Document files */
    DOCUMENTS: { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'] },
    /** JSON files */
    JSON: { name: 'JSON', extensions: ['json'] },
    /** ZYNC project files */
    ZYNC_PROJECT: { name: 'ZYNC Project', extensions: ['zync'] },
    /** Archive files */
    ARCHIVES: { name: 'Archives', extensions: ['zip', 'tar', 'gz', 'rar', '7z'] },
    /** Code files */
    CODE: { name: 'Code', extensions: ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java'] },
};
// =============================================================================
// Dialog Manager
// =============================================================================
const log = logger;
/**
 * Get the focused window or null.
 */
function getFocusedWindow() {
    return BrowserWindow.getFocusedWindow();
}
// =============================================================================
// Message Boxes
// =============================================================================
/**
 * Show an information dialog.
 *
 * @param {string} message - Message text
 * @param {string} [detail] - Additional detail text
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export async function showInfo(message, detail, parent) {
    const win = parent || getFocusedWindow();
    const options = {
        type: 'info',
        title: 'Information',
        message,
        detail,
        buttons: ['OK'],
    };
    if (win) {
        return dialog.showMessageBox(win, options);
    }
    return dialog.showMessageBox(options);
}
/**
 * Show a warning dialog.
 *
 * @param {string} message - Warning message
 * @param {string} [detail] - Additional detail
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export async function showWarning(message, detail, parent) {
    const win = parent || getFocusedWindow();
    const options = {
        type: 'warning',
        title: 'Warning',
        message,
        detail,
        buttons: ['OK'],
    };
    if (win) {
        return dialog.showMessageBox(win, options);
    }
    return dialog.showMessageBox(options);
}
/**
 * Show an error dialog.
 *
 * @param {string} message - Error message
 * @param {string} [detail] - Stack trace or additional info
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export async function showError(message, detail, parent) {
    const win = parent || getFocusedWindow();
    const options = {
        type: 'error',
        title: 'Error',
        message,
        detail,
        buttons: ['OK'],
    };
    if (win) {
        return dialog.showMessageBox(win, options);
    }
    return dialog.showMessageBox(options);
}
/**
 * Show a confirmation dialog with Yes/No buttons.
 *
 * @param {string} message - Question message
 * @param {string} [detail] - Additional detail
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<boolean>} True if user clicked Yes
 */
export async function showConfirm(message, detail, parent) {
    const win = parent || getFocusedWindow();
    const options = {
        type: 'question',
        title: 'Confirm',
        message,
        detail,
        buttons: ['Yes', 'No'],
        defaultId: 0,
        cancelId: 1,
    };
    const result = win
        ? await dialog.showMessageBox(win, options)
        : await dialog.showMessageBox(options);
    return result.response === 0;
}
/**
 * Show a custom message box with configurable buttons.
 *
 * @param {MessageBoxOptions} options - Dialog options
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export async function showMessageBox(options, parent) {
    const win = parent || getFocusedWindow();
    const electronOptions = {
        type: options.type ?? 'info',
        title: options.title ?? 'ZYNC',
        message: options.message,
        detail: options.detail,
        buttons: options.buttons ?? ['OK'],
        defaultId: options.defaultId ?? 0,
        cancelId: options.cancelId,
        noLink: options.noLink,
        checkboxLabel: options.checkboxLabel,
        checkboxChecked: options.checkboxChecked,
    };
    if (win) {
        return dialog.showMessageBox(win, electronOptions);
    }
    return dialog.showMessageBox(electronOptions);
}
// =============================================================================
// File Dialogs
// =============================================================================
/**
 * Show a file open dialog.
 *
 * @param {object} options - Dialog options
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<string[]>} Selected file paths (empty if cancelled)
 */
export async function showOpenDialog(options = {}, parent) {
    const win = parent || getFocusedWindow();
    const electronOptions = {
        title: options.title ?? 'Open',
        defaultPath: options.defaultPath,
        filters: options.filters,
        properties: options.properties ?? ['openFile'],
    };
    const result = win
        ? await dialog.showOpenDialog(win, electronOptions)
        : await dialog.showOpenDialog(electronOptions);
    return result.canceled ? [] : result.filePaths;
}
/**
 * Show a file save dialog.
 *
 * @param {object} options - Dialog options
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<string | null>} Selected save path, or null if cancelled
 */
export async function showSaveDialog(options = {}, parent) {
    const win = parent || getFocusedWindow();
    const electronOptions = {
        title: options.title ?? 'Save',
        defaultPath: options.defaultPath,
        filters: options.filters,
    };
    const result = win
        ? await dialog.showSaveDialog(win, electronOptions)
        : await dialog.showSaveDialog(electronOptions);
    return result.canceled ? null : (result.filePath ?? null);
}
// =============================================================================
// IPC Integration
// =============================================================================
/**
 * Register dialog-related IPC handlers.
 * Call this once during app initialization.
 */
export function registerDialogHandlers() {
    ipcMain.handle('dialog:message', async (_event, options) => {
        return showMessageBox(options);
    });
    ipcMain.handle('dialog:confirm', async (_event, message, detail) => {
        return showConfirm(message, detail);
    });
    ipcMain.handle('dialog:error', async (_event, message, detail) => {
        return showError(message, detail);
    });
    ipcMain.handle('dialog:open-file', async (_event, options) => {
        return showOpenDialog(options);
    });
    ipcMain.handle('dialog:save-file', async (_event, options) => {
        return showSaveDialog(options);
    });
    log.info('Dialog IPC handlers registered');
}
//# sourceMappingURL=dialog-manager.js.map