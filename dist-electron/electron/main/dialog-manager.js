import { dialog, BrowserWindow, ipcMain } from 'electron';
import { logger } from '../utils/logger.js';
export const FILE_FILTERS = {
    ALL: { name: 'All Files', extensions: ['*'] },
    IMAGES: { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
    DOCUMENTS: { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'] },
    JSON: { name: 'JSON', extensions: ['json'] },
    ZYNC_PROJECT: { name: 'ZYNC Project', extensions: ['zync'] },
    ARCHIVES: { name: 'Archives', extensions: ['zip', 'tar', 'gz', 'rar', '7z'] },
    CODE: { name: 'Code', extensions: ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java'] },
};
const log = logger;
function getFocusedWindow() {
    return BrowserWindow.getFocusedWindow();
}
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