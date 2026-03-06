import { BrowserWindow } from 'electron';
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
export declare const FILE_FILTERS: {
    readonly ALL: {
        readonly name: "All Files";
        readonly extensions: readonly ["*"];
    };
    readonly IMAGES: {
        readonly name: "Images";
        readonly extensions: readonly ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    };
    readonly DOCUMENTS: {
        readonly name: "Documents";
        readonly extensions: readonly ["pdf", "doc", "docx", "txt", "md", "rtf"];
    };
    readonly JSON: {
        readonly name: "JSON";
        readonly extensions: readonly ["json"];
    };
    readonly ZYNC_PROJECT: {
        readonly name: "ZYNC Project";
        readonly extensions: readonly ["zync"];
    };
    readonly ARCHIVES: {
        readonly name: "Archives";
        readonly extensions: readonly ["zip", "tar", "gz", "rar", "7z"];
    };
    readonly CODE: {
        readonly name: "Code";
        readonly extensions: readonly ["ts", "tsx", "js", "jsx", "py", "go", "rs", "java"];
    };
};
export declare function showInfo(message: string, detail?: string, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
export declare function showWarning(message: string, detail?: string, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
export declare function showError(message: string, detail?: string, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
export declare function showConfirm(message: string, detail?: string, parent?: BrowserWindow | null): Promise<boolean>;
export declare function showMessageBox(options: MessageBoxOptions, parent?: BrowserWindow | null): Promise<MessageBoxResult>;
export declare function showOpenDialog(options?: {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}, parent?: BrowserWindow | null): Promise<string[]>;
export declare function showSaveDialog(options?: {
    title?: string;
    defaultPath?: string;
    filters?: FileFilter[];
}, parent?: BrowserWindow | null): Promise<string | null>;
export declare function registerDialogHandlers(): void;
