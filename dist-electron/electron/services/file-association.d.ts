/**
 * =============================================================================
 * File Association Handler — ZYNC Desktop
 * =============================================================================
 *
 * Manages file type associations for the ZYNC desktop application, allowing
 * users to open .zync project files and other supported formats directly
 * from their file manager.
 *
 * @module electron/services/file-association
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { BrowserWindow } from 'electron';
/** Supported file extensions and their metadata */
export interface FileTypeAssociation {
    /** File extension without dot (e.g., 'zync') */
    extension: string;
    /** MIME type */
    mimeType: string;
    /** Human-readable description */
    description: string;
    /** Icon file name */
    icon?: string;
    /** Handler function */
    handler: (filePath: string) => void;
}
/** File open event */
export interface FileOpenEvent {
    /** Full path to the file */
    filePath: string;
    /** File extension */
    extension: string;
    /** Timestamp */
    timestamp: number;
}
/** File open callback */
export type FileOpenCallback = (event: FileOpenEvent) => void;
/**
 * FileAssociationService handles file type associations so users can
 * open supported files directly from the operating system file manager.
 *
 * On macOS, this uses the 'open-file' and 'open-url' app events.
 * On Windows/Linux, file paths are passed as command line arguments.
 *
 * @example
 * ```typescript
 * const fileService = new FileAssociationService(mainWindow);
 *
 * fileService.registerType({
 *   extension: 'zync',
 *   mimeType: 'application/x-zync-project',
 *   description: 'ZYNC Project File',
 *   handler: (filePath) => openProject(filePath),
 * });
 *
 * fileService.initialize();
 * ```
 */
export declare class FileAssociationService {
    /** Main window reference */
    private mainWindow;
    /** Registered file type associations */
    private associations;
    /** Pending file opens (received before window is ready) */
    private pendingFiles;
    /** File open callbacks */
    private callbacks;
    /** Whether the service has been initialized */
    private initialized;
    /** Logger instance */
    private log;
    /**
     * Create a new FileAssociationService.
     *
     * @param {BrowserWindow | null} mainWindow - Main window reference
     */
    constructor(mainWindow?: BrowserWindow | null);
    /**
     * Register a file type association.
     *
     * @param {FileTypeAssociation} association - File type configuration
     */
    registerType(association: FileTypeAssociation): void;
    /**
     * Unregister a file type association.
     *
     * @param {string} extension - File extension to unregister
     */
    unregisterType(extension: string): void;
    /**
     * Get all registered file type associations.
     *
     * @returns {FileTypeAssociation[]} All associations
     */
    getRegisteredTypes(): FileTypeAssociation[];
    /**
     * Initialize the file association handler.
     *
     * On macOS, listens for 'open-file' events from the OS.
     * On other platforms, processes command line arguments.
     */
    initialize(): void;
    /**
     * Process command line arguments for file paths.
     *
     * @param {string[]} argv - Command line arguments
     */
    processCommandLineArgs(argv: string[]): void;
    /**
     * Process any pending file opens that arrived before the window was ready.
     */
    processPending(): void;
    /**
     * Handle a file open request.
     *
     * @param {string} filePath - Path to the file to open
     */
    handleFileOpen(filePath: string): void;
    /**
     * Check if a file path has a supported extension.
     *
     * @param {string} filePath - Path to check
     * @returns {boolean} True if the file type is registered
     */
    isSupportedFile(filePath: string): boolean;
    /**
     * Register a callback for file open events.
     *
     * @param {FileOpenCallback} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onFileOpen(callback: FileOpenCallback): () => void;
    /**
     * Set the application as the default handler for a file type.
     * Only works on Windows and Linux.
     *
     * @param {string} extension - File extension (e.g., 'zync')
     * @returns {boolean} True if successful
     */
    setAsDefaultHandler(extension: string): boolean;
    /**
     * Remove the application as the default handler for a file type.
     *
     * @param {string} extension - File extension
     * @returns {boolean} True if successful
     */
    removeAsDefaultHandler(extension: string): boolean;
    /**
     * Update the main window reference.
     *
     * @param {BrowserWindow | null} window - New main window
     */
    setMainWindow(window: BrowserWindow | null): void;
    /**
     * Dispose of the service.
     */
    dispose(): void;
}
