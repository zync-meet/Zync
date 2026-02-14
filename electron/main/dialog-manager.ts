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

import { dialog, BrowserWindow, ipcMain, shell } from 'electron';
import { logger } from '../utils/logger.js';

// =============================================================================
// Types
// =============================================================================

/** Message box button configuration */
export interface DialogButton {
    /** Button label text */
    label: string;
    /** Whether this button is the default */
    isDefault?: boolean;
    /** Whether this is the cancel button */
    isCancel?: boolean;
}

/** Message box options */
export interface MessageBoxOptions {
    /** Dialog type (icon) */
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    /** Window title */
    title?: string;
    /** Main message text */
    message: string;
    /** Detailed description */
    detail?: string;
    /** Button labels */
    buttons?: string[];
    /** Default button index */
    defaultId?: number;
    /** Cancel button index */
    cancelId?: number;
    /** Don't show the "don't show again" checkbox */
    noLink?: boolean;
    /** Checkbox label (if any) */
    checkboxLabel?: string;
    /** Initial checkbox state */
    checkboxChecked?: boolean;
}

/** Message box result */
export interface MessageBoxResult {
    /** Index of the clicked button */
    response: number;
    /** Whether the checkbox was checked */
    checkboxChecked: boolean;
}

/** File filter for open/save dialogs */
export interface FileFilter {
    /** Filter name (e.g., "Images") */
    name: string;
    /** Allowed extensions (e.g., ['jpg', 'png']) */
    extensions: string[];
}

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
} as const;

// =============================================================================
// Dialog Manager
// =============================================================================

const log = logger;

/**
 * Get the focused window or null.
 */
function getFocusedWindow(): BrowserWindow | null {
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
export async function showInfo(
    message: string,
    detail?: string,
    parent?: BrowserWindow | null,
): Promise<MessageBoxResult> {
    const win = parent || getFocusedWindow();
    const options: Electron.MessageBoxOptions = {
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
export async function showWarning(
    message: string,
    detail?: string,
    parent?: BrowserWindow | null,
): Promise<MessageBoxResult> {
    const win = parent || getFocusedWindow();
    const options: Electron.MessageBoxOptions = {
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
export async function showError(
    message: string,
    detail?: string,
    parent?: BrowserWindow | null,
): Promise<MessageBoxResult> {
    const win = parent || getFocusedWindow();
    const options: Electron.MessageBoxOptions = {
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
export async function showConfirm(
    message: string,
    detail?: string,
    parent?: BrowserWindow | null,
): Promise<boolean> {
    const win = parent || getFocusedWindow();
    const options: Electron.MessageBoxOptions = {
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
export async function showMessageBox(
    options: MessageBoxOptions,
    parent?: BrowserWindow | null,
): Promise<MessageBoxResult> {
    const win = parent || getFocusedWindow();
    const electronOptions: Electron.MessageBoxOptions = {
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
export async function showOpenDialog(
    options: {
        title?: string;
        defaultPath?: string;
        filters?: FileFilter[];
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
    } = {},
    parent?: BrowserWindow | null,
): Promise<string[]> {
    const win = parent || getFocusedWindow();
    const electronOptions: Electron.OpenDialogOptions = {
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
export async function showSaveDialog(
    options: {
        title?: string;
        defaultPath?: string;
        filters?: FileFilter[];
    } = {},
    parent?: BrowserWindow | null,
): Promise<string | null> {
    const win = parent || getFocusedWindow();
    const electronOptions: Electron.SaveDialogOptions = {
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
export function registerDialogHandlers(): void {
    ipcMain.handle('dialog:message', async (_event, options: MessageBoxOptions) => {
        return showMessageBox(options);
    });

    ipcMain.handle('dialog:confirm', async (_event, message: string, detail?: string) => {
        return showConfirm(message, detail);
    });

    ipcMain.handle('dialog:error', async (_event, message: string, detail?: string) => {
        return showError(message, detail);
    });

    ipcMain.handle('dialog:open-file', async (_event, options: Record<string, unknown>) => {
        return showOpenDialog(options as Parameters<typeof showOpenDialog>[0]);
    });

    ipcMain.handle('dialog:save-file', async (_event, options: Record<string, unknown>) => {
        return showSaveDialog(options as Parameters<typeof showSaveDialog>[0]);
    });

    log.info('Dialog IPC handlers registered');
}
