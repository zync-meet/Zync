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
import { app } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';
// =============================================================================
// File Association Service
// =============================================================================
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
export class FileAssociationService {
    /** Main window reference */
    mainWindow;
    /** Registered file type associations */
    associations = new Map();
    /** Pending file opens (received before window is ready) */
    pendingFiles = [];
    /** File open callbacks */
    callbacks = new Set();
    /** Whether the service has been initialized */
    initialized = false;
    /** Logger instance */
    log = logger;
    /**
     * Create a new FileAssociationService.
     *
     * @param {BrowserWindow | null} mainWindow - Main window reference
     */
    constructor(mainWindow = null) {
        this.mainWindow = mainWindow;
    }
    // =========================================================================
    // Registration
    // =========================================================================
    /**
     * Register a file type association.
     *
     * @param {FileTypeAssociation} association - File type configuration
     */
    registerType(association) {
        const ext = association.extension.toLowerCase().replace(/^\./, '');
        this.associations.set(ext, { ...association, extension: ext });
        this.log.info(`File association registered: .${ext}`);
    }
    /**
     * Unregister a file type association.
     *
     * @param {string} extension - File extension to unregister
     */
    unregisterType(extension) {
        const ext = extension.toLowerCase().replace(/^\./, '');
        this.associations.delete(ext);
        this.log.info(`File association unregistered: .${ext}`);
    }
    /**
     * Get all registered file type associations.
     *
     * @returns {FileTypeAssociation[]} All associations
     */
    getRegisteredTypes() {
        return Array.from(this.associations.values());
    }
    // =========================================================================
    // Initialization
    // =========================================================================
    /**
     * Initialize the file association handler.
     *
     * On macOS, listens for 'open-file' events from the OS.
     * On other platforms, processes command line arguments.
     */
    initialize() {
        if (this.initialized)
            return;
        // macOS: Handle open-file events
        if (process.platform === 'darwin') {
            app.on('open-file', (event, filePath) => {
                event.preventDefault();
                this.log.info(`macOS open-file event: ${filePath}`);
                this.handleFileOpen(filePath);
            });
        }
        // Process command line arguments (Windows/Linux)
        this.processCommandLineArgs(process.argv);
        this.initialized = true;
        this.log.info('File association service initialized');
    }
    /**
     * Process command line arguments for file paths.
     *
     * @param {string[]} argv - Command line arguments
     */
    processCommandLineArgs(argv) {
        // Skip the first two args (electron executable and main script)
        const fileArgs = argv.slice(app.isPackaged ? 1 : 2);
        for (const arg of fileArgs) {
            // Skip flags/options
            if (arg.startsWith('-') || arg.startsWith('--'))
                continue;
            // Check if it looks like a file path
            if (this.isSupportedFile(arg)) {
                this.handleFileOpen(arg);
            }
        }
    }
    /**
     * Process any pending file opens that arrived before the window was ready.
     */
    processPending() {
        if (this.pendingFiles.length === 0)
            return;
        const pending = [...this.pendingFiles];
        this.pendingFiles = [];
        for (const filePath of pending) {
            this.handleFileOpen(filePath);
        }
        this.log.info(`Processed ${pending.length} pending file opens`);
    }
    // =========================================================================
    // File Handling
    // =========================================================================
    /**
     * Handle a file open request.
     *
     * @param {string} filePath - Path to the file to open
     */
    handleFileOpen(filePath) {
        const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
        const association = this.associations.get(ext);
        // If no window is ready yet, queue it
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            this.pendingFiles.push(filePath);
            this.log.info(`File open queued (window not ready): ${filePath}`);
            return;
        }
        const event = {
            filePath,
            extension: ext,
            timestamp: Date.now(),
        };
        // Call the specific handler if registered
        if (association) {
            try {
                association.handler(filePath);
                this.log.info(`File handled by .${ext} association: ${filePath}`);
            }
            catch (err) {
                this.log.error(`File handler error for .${ext}:`, err);
            }
        }
        // Notify all generic callbacks
        for (const callback of this.callbacks) {
            try {
                callback(event);
            }
            catch (err) {
                this.log.error('File open callback error:', err);
            }
        }
    }
    /**
     * Check if a file path has a supported extension.
     *
     * @param {string} filePath - Path to check
     * @returns {boolean} True if the file type is registered
     */
    isSupportedFile(filePath) {
        if (!filePath || typeof filePath !== 'string')
            return false;
        const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
        return this.associations.has(ext);
    }
    // =========================================================================
    // Event Callbacks
    // =========================================================================
    /**
     * Register a callback for file open events.
     *
     * @param {FileOpenCallback} callback - Callback function
     * @returns {() => void} Unsubscribe function
     */
    onFileOpen(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
    // =========================================================================
    // OS Integration
    // =========================================================================
    /**
     * Set the application as the default handler for a file type.
     * Only works on Windows and Linux.
     *
     * @param {string} extension - File extension (e.g., 'zync')
     * @returns {boolean} True if successful
     */
    setAsDefaultHandler(extension) {
        const ext = extension.toLowerCase().replace(/^\./, '');
        const association = this.associations.get(ext);
        if (!association) {
            this.log.error(`Cannot set default handler: .${ext} not registered`);
            return false;
        }
        try {
            // This sets the app as the default protocol/file handler
            app.setAsDefaultProtocolClient(ext);
            this.log.info(`Set as default handler for .${ext}`);
            return true;
        }
        catch (err) {
            this.log.error(`Failed to set default handler for .${ext}:`, err);
            return false;
        }
    }
    /**
     * Remove the application as the default handler for a file type.
     *
     * @param {string} extension - File extension
     * @returns {boolean} True if successful
     */
    removeAsDefaultHandler(extension) {
        const ext = extension.toLowerCase().replace(/^\./, '');
        try {
            app.removeAsDefaultProtocolClient(ext);
            this.log.info(`Removed as default handler for .${ext}`);
            return true;
        }
        catch (err) {
            this.log.error(`Failed to remove default handler for .${ext}:`, err);
            return false;
        }
    }
    // =========================================================================
    // Cleanup
    // =========================================================================
    /**
     * Update the main window reference.
     *
     * @param {BrowserWindow | null} window - New main window
     */
    setMainWindow(window) {
        this.mainWindow = window;
    }
    /**
     * Dispose of the service.
     */
    dispose() {
        this.associations.clear();
        this.callbacks.clear();
        this.pendingFiles = [];
        this.mainWindow = null;
        this.log.info('File association service disposed');
    }
}
//# sourceMappingURL=file-association.js.map