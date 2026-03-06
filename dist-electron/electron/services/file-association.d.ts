import { BrowserWindow } from 'electron';
export interface FileTypeAssociation {
    extension: string;
    mimeType: string;
    description: string;
    icon?: string;
    handler: (filePath: string) => void;
}
export interface FileOpenEvent {
    filePath: string;
    extension: string;
    timestamp: number;
}
export type FileOpenCallback = (event: FileOpenEvent) => void;
export declare class FileAssociationService {
    private mainWindow;
    private associations;
    private pendingFiles;
    private callbacks;
    private initialized;
    private log;
    constructor(mainWindow?: BrowserWindow | null);
    registerType(association: FileTypeAssociation): void;
    unregisterType(extension: string): void;
    getRegisteredTypes(): FileTypeAssociation[];
    initialize(): void;
    processCommandLineArgs(argv: string[]): void;
    processPending(): void;
    handleFileOpen(filePath: string): void;
    isSupportedFile(filePath: string): boolean;
    onFileOpen(callback: FileOpenCallback): () => void;
    setAsDefaultHandler(extension: string): boolean;
    removeAsDefaultHandler(extension: string): boolean;
    setMainWindow(window: BrowserWindow | null): void;
    dispose(): void;
}
