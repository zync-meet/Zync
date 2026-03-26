import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';


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


export class FileAssociationService {

    private mainWindow: BrowserWindow | null;


    private associations: Map<string, FileTypeAssociation> = new Map();


    private pendingFiles: string[] = [];


    private callbacks: Set<FileOpenCallback> = new Set();


    private initialized = false;


    private log = logger;


    constructor(mainWindow: BrowserWindow | null = null) {
        this.mainWindow = mainWindow;
    }


    registerType(association: FileTypeAssociation): void {
        const ext = association.extension.toLowerCase().replace(/^\./, '');
        this.associations.set(ext, { ...association, extension: ext });
        this.log.info(`File association registered: .${ext}`);
    }


    unregisterType(extension: string): void {
        const ext = extension.toLowerCase().replace(/^\./, '');
        this.associations.delete(ext);
        this.log.info(`File association unregistered: .${ext}`);
    }


    getRegisteredTypes(): FileTypeAssociation[] {
        return Array.from(this.associations.values());
    }


    initialize(): void {
        if (this.initialized) {return;}


        if (process.platform === 'darwin') {
            app.on('open-file', (event, filePath) => {
                event.preventDefault();
                this.log.info(`macOS open-file event: ${filePath}`);
                this.handleFileOpen(filePath);
            });
        }


        this.processCommandLineArgs(process.argv);

        this.initialized = true;
        this.log.info('File association service initialized');
    }


    processCommandLineArgs(argv: string[]): void {

        const fileArgs = argv.slice(app.isPackaged ? 1 : 2);

        for (const arg of fileArgs) {

            if (arg.startsWith('-') || arg.startsWith('--')) {continue;}


            if (this.isSupportedFile(arg)) {
                this.handleFileOpen(arg);
            }
        }
    }


    processPending(): void {
        if (this.pendingFiles.length === 0) {return;}

        const pending = [...this.pendingFiles];
        this.pendingFiles = [];

        for (const filePath of pending) {
            this.handleFileOpen(filePath);
        }

        this.log.info(`Processed ${pending.length} pending file opens`);
    }


    handleFileOpen(filePath: string): void {
        const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
        const association = this.associations.get(ext);


        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            this.pendingFiles.push(filePath);
            this.log.info(`File open queued (window not ready): ${filePath}`);
            return;
        }

        const event: FileOpenEvent = {
            filePath,
            extension: ext,
            timestamp: Date.now(),
        };


        if (association) {
            try {
                association.handler(filePath);
                this.log.info(`File handled by .${ext} association: ${filePath}`);
            } catch (err) {
                this.log.error(`File handler error for .${ext}:`, err);
            }
        }


        for (const callback of this.callbacks) {
            try {
                callback(event);
            } catch (err) {
                this.log.error('File open callback error:', err);
            }
        }
    }


    isSupportedFile(filePath: string): boolean {
        if (!filePath || typeof filePath !== 'string') {return false;}

        const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
        return this.associations.has(ext);
    }


    onFileOpen(callback: FileOpenCallback): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }


    setAsDefaultHandler(extension: string): boolean {
        const ext = extension.toLowerCase().replace(/^\./, '');
        const association = this.associations.get(ext);

        if (!association) {
            this.log.error(`Cannot set default handler: .${ext} not registered`);
            return false;
        }

        try {

            app.setAsDefaultProtocolClient(ext);
            this.log.info(`Set as default handler for .${ext}`);
            return true;
        } catch (err) {
            this.log.error(`Failed to set default handler for .${ext}:`, err);
            return false;
        }
    }


    removeAsDefaultHandler(extension: string): boolean {
        const ext = extension.toLowerCase().replace(/^\./, '');

        try {
            app.removeAsDefaultProtocolClient(ext);
            this.log.info(`Removed as default handler for .${ext}`);
            return true;
        } catch (err) {
            this.log.error(`Failed to remove default handler for .${ext}:`, err);
            return false;
        }
    }


    setMainWindow(window: BrowserWindow | null): void {
        this.mainWindow = window;
    }


    dispose(): void {
        this.associations.clear();
        this.callbacks.clear();
        this.pendingFiles = [];
        this.mainWindow = null;
        this.log.info('File association service disposed');
    }
}
