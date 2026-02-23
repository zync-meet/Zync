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
import { BrowserWindow } from 'electron';
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
/** Common file filters for dialogs */
export declare const FILE_FILTERS: {
    /** All files */
    readonly ALL: {
        readonly name: "All Files";
        readonly extensions: readonly ["*"];
    };
    /** Image files */
    readonly IMAGES: {
        readonly name: "Images";
        readonly extensions: readonly ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    };
    /** Document files */
    readonly DOCUMENTS: {
        readonly name: "Documents";
        readonly extensions: readonly ["pdf", "doc", "docx", "txt", "md", "rtf"];
    };
    /** JSON files */
    readonly JSON: {
        readonly name: "JSON";
        readonly extensions: readonly ["json"];
    };
    /** ZYNC project files */
    readonly ZYNC_PROJECT: {
        readonly name: "ZYNC Project";
        readonly extensions: readonly ["zync"];
    };
    /** Archive files */
    readonly ARCHIVES: {
        readonly name: "Archives";
        readonly extensions: readonly ["zip", "tar", "gz", "rar", "7z"];
    };
    /** Code files */
    readonly CODE: {
        readonly name: "Code";
        readonly extensions: readonly ["ts", "tsx", "js", "jsx", "py", "go", "rs", "java"];
    };
};
/**
 * Show an information dialog.
 *
 * @param {string} message - Message text
 * @param {string} [detail] - Additional detail text
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export declare function showInfo(message: string, detail?: string, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
/**
 * Show a warning dialog.
 *
 * @param {string} message - Warning message
 * @param {string} [detail] - Additional detail
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export declare function showWarning(message: string, detail?: string, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
/**
 * Show an error dialog.
 *
 * @param {string} message - Error message
 * @param {string} [detail] - Stack trace or additional info
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export declare function showError(message: string, detail?: string, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
/**
 * Show a confirmation dialog with Yes/No buttons.
 *
 * @param {string} message - Question message
 * @param {string} [detail] - Additional detail
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<boolean>} True if user clicked Yes
 */
export declare function showConfirm(message: string, detail?: string, parent?: BrowserWindow | null): Promise<boolean>;
/**
 * Show a custom message box with configurable buttons.
 *
 * @param {MessageBoxOptions} options - Dialog options
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<MessageBoxResult>} Result
 */
export declare function showMessageBox(options: MessageBoxOptions, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
/**
 * Show a file open dialog.
 *
 * @param {object} options - Dialog options
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<string[]>} Selected file paths (empty if cancelled)
 */
export declare function showOpenDialog(options?: {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}, parent?: BrowserWindow | null): Promise<string[]>;
/**
 * Show a file save dialog.
 *
 * @param {object} options - Dialog options
 * @param {BrowserWindow | null} [parent] - Parent window
 * @returns {Promise<string | null>} Selected save path, or null if cancelled
 */
export declare function showSaveDialog(options?: {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
}, parent?: BrowserWindow | null): Promise<string | null>;
/**
 * Register dialog-related IPC handlers.
 * Call this once during app initialization.
 */
export declare function registerDialogHandlers(): void;
