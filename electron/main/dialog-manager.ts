import { dialog, BrowserWindow, ipcMain, shell } from 'electron';
import { logger } from '../utils/logger.js';


export interface DialogButton {

    label: string;

    isDefault?: boolean;

    isCancel?: boolean;
}


export interface MessageBoxOptions {

    type?: 'none' | 'info' | 'error' | 'question' | 'warning';

    title?: string;

    message: string;

    detail?: string;

    buttons?: string[];

    defaultId?: number;

    cancelId?: number;

    noLink?: boolean;

    checkboxLabel?: string;

    checkboxChecked?: boolean;
}


export interface MessageBoxResult {

    response: number;

    checkboxChecked: boolean;
}


export interface FileFilter {

    name: string;

    extensions: string[];
}


export const FILE_FILTERS = {

    ALL: { name: 'All Files', extensions: ['*'] },

    IMAGES: { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },

    DOCUMENTS: { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'] },

    JSON: { name: 'JSON', extensions: ['json'] },

    ZYNC_PROJECT: { name: 'ZYNC Project', extensions: ['zync'] },

    ARCHIVES: { name: 'Archives', extensions: ['zip', 'tar', 'gz', 'rar', '7z'] },

    CODE: { name: 'Code', extensions: ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java'] },
} as const;


const log = logger;


function getFocusedWindow(): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow();
}


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
