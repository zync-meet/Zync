/**
 * =============================================================================
 * IPC Handlers — ZYNC Desktop Application
 * =============================================================================
 *
 * This module registers all Inter-Process Communication (IPC) handlers for
 * the ZYNC desktop application. IPC handlers process messages sent from the
 * renderer process (React app) to the main process (Node.js/Electron).
 *
 * IPC is the primary mechanism for the renderer process to request actions
 * that require Node.js or native OS access, such as file system operations,
 * system dialogs, application updates, and window management.
 *
 * Security Considerations:
 * - All IPC channels are whitelisted and documented
 * - Input validation is performed on all incoming messages
 * - Sensitive operations require explicit user confirmation
 * - File paths are sanitized to prevent directory traversal attacks
 *
 * Channel Naming Convention:
 * - Use kebab-case for channel names (e.g., 'download-platform')
 * - Prefix with the feature area when appropriate (e.g., 'settings:get')
 * - Use descriptive names that clearly indicate the action
 *
 * @module electron/main/ipc-handlers
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 *
 * @see https://www.electronjs.org/docs/latest/api/ipc-main
 * @see https://www.electronjs.org/docs/latest/tutorial/ipc
 * =============================================================================
 */
import { BrowserWindow } from 'electron';
/**
 * Registers all IPC handlers for the application.
 *
 * This function should be called once during application startup, after
 * the main window has been created. It sets up listeners for all IPC
 * channels and connects them to the appropriate handler functions.
 *
 * Channels are organized into categories:
 * 1. Navigation & Window Management
 * 2. Platform Downloads
 * 3. Application Information
 * 4. Settings & Preferences
 * 5. File System Operations
 * 6. System Integration
 *
 * @param {BrowserWindow} mainWindow - The main application window
 * @param {BrowserWindow | null} settingsWindow - The settings window (if open)
 *
 * @example
 * ```typescript
 * import { registerIpcHandlers } from './ipc-handlers';
 *
 * app.on('ready', () => {
 *   const mainWindow = createMainWindow();
 *   registerIpcHandlers(mainWindow, null);
 * });
 * ```
 */
export declare function registerIpcHandlers(mainWindow: BrowserWindow, settingsWindow: BrowserWindow | null): void;
/**
 * Removes all registered IPC handlers.
 *
 * This should be called during application shutdown to clean up
 * resources and prevent memory leaks. It removes all listeners
 * registered by registerIpcHandlers().
 *
 * @example
 * ```typescript
 * app.on('before-quit', () => {
 *   removeIpcHandlers();
 * });
 * ```
 */
export declare function removeIpcHandlers(): void;
