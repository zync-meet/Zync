/**
 * =============================================================================
 * Service Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript interfaces for background services that run in the Electron
 * main process. These services handle long-running operations like auto-updates,
 * activity tracking, and background synchronization.
 *
 * All services implement the Disposable pattern for clean resource management.
 *
 * @module electron/interfaces/services
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { BrowserWindow } from 'electron';

/**
 * Base interface for all background services.
 *
 * Every service in the application should implement this interface to ensure
 * consistent lifecycle management. Services are initialized during application
 * startup and disposed during shutdown.
 *
 * @interface IService
 *
 * @example
 * ```typescript
 * class MyService implements IService {
 *   private timer: NodeJS.Timeout | null = null;
 *
 *   async initialize(): Promise<void> {
 *     this.timer = setInterval(() => this.doWork(), 60000);
 *   }
 *
 *   async dispose(): Promise<void> {
 *     if (this.timer) clearInterval(this.timer);
 *   }
 *
 *   isRunning(): boolean {
 *     return this.timer !== null;
 *   }
 * }
 * ```
 */
export interface IService {
    /**
     * Initializes the service and starts any background operations.
     * Called once during application startup.
     *
     * @returns Promise that resolves when initialization is complete
     * @throws Error if initialization fails
     */
    initialize(): Promise<void> | void;

    /**
     * Cleans up all resources held by the service.
     * Called during application shutdown.
     *
     * @returns Promise that resolves when cleanup is complete
     */
    dispose(): Promise<void> | void;

    /**
     * Returns whether the service is currently active and running.
     *
     * @returns True if the service is running
     */
    isRunning(): boolean;
}

/**
 * Interface for the auto-updater service.
 *
 * Manages checking for, downloading, and installing application updates
 * from GitHub Releases using electron-updater.
 *
 * @interface IAutoUpdaterService
 * @extends IService
 */
export interface IAutoUpdaterService extends IService {
    /**
     * Manually triggers an update check.
     * Does nothing in development mode.
     *
     * @returns Promise that resolves when the check is complete
     */
    checkForUpdates(): Promise<void>;

    /**
     * Enables or disables automatic periodic update checks.
     *
     * @param enabled - Whether to enable auto-checking
     */
    setAutoCheckEnabled(enabled: boolean): void;

    /**
     * Sets the main window reference for displaying update dialogs.
     *
     * @param window - The main BrowserWindow instance (or null to detach)
     */
    setMainWindow(window: BrowserWindow | null): void;

    /**
     * Returns whether an update is currently being downloaded.
     *
     * @returns True if an update download is in progress
     */
    isDownloading(): boolean;

    /**
     * Returns the version of the pending update (if any).
     *
     * @returns Version string or null if no update is pending
     */
    getPendingVersion(): string | null;
}

/**
 * Download progress information from the auto-updater.
 *
 * @interface UpdateProgress
 */
export interface UpdateProgress {
    /** Download speed in bytes per second */
    bytesPerSecond: number;

    /** Download completion percentage (0-100) */
    percent: number;

    /** Bytes transferred so far */
    transferred: number;

    /** Total bytes to download */
    total: number;
}

/**
 * Update metadata returned by the update check.
 *
 * @interface UpdateInfo
 */
export interface UpdateInfo {
    /** Version of the available update (semver) */
    version: string;

    /** Release notes (may be HTML or Markdown) */
    releaseNotes?: string | null;

    /** Release date (ISO 8601 string) */
    releaseDate?: string;

    /** Release name/title */
    releaseName?: string | null;

    /** SHA512 hash of the update file for integrity verification */
    sha512?: string;
}

/**
 * Interface for the notification manager service.
 *
 * Handles displaying native desktop notifications and managing
 * notification permissions and history.
 *
 * @interface INotificationService
 * @extends IService
 */
export interface INotificationService extends IService {
    /**
     * Shows a desktop notification.
     *
     * @param title - Notification title
     * @param body - Notification body text
     * @param options - Additional notification options
     * @returns The notification ID for tracking
     */
    show(title: string, body: string, options?: NotificationOptions): string;

    /**
     * Checks if notifications are supported on the current platform.
     *
     * @returns True if notifications are available
     */
    isSupported(): boolean;
}

/**
 * Options for creating a notification.
 *
 * @interface NotificationOptions
 */
export interface NotificationOptions {
    /** Path to a custom icon for the notification */
    icon?: string;

    /** Whether the notification should play a sound */
    silent?: boolean;

    /** Whether the notification requires user interaction to dismiss */
    requireInteraction?: boolean;

    /** Urgency level for Linux notifications */
    urgency?: 'low' | 'normal' | 'critical';

    /** Click handler callback */
    onClick?: () => void;

    /** Close handler callback */
    onClose?: () => void;

    /** Timeout in milliseconds (0 = no timeout) */
    timeoutMs?: number;
}

/**
 * Interface for the crash reporter service.
 *
 * Collects crash reports and submits them for analysis. Also provides
 * methods for manually reporting errors that don't cause crashes.
 *
 * @interface ICrashReporterService
 * @extends IService
 */
export interface ICrashReporterService extends IService {
    /**
     * Starts the crash reporter with the given configuration.
     *
     * @param config - Crash reporter configuration
     */
    start(config?: CrashReporterConfig): void;

    /**
     * Manually reports a non-fatal error.
     *
     * @param error - The error to report
     * @param context - Additional context about the error
     */
    reportError(error: Error, context?: Record<string, unknown>): void;

    /**
     * Returns the path to the crash dumps directory.
     *
     * @returns Absolute path to crash dumps
     */
    getCrashDumpsPath(): string;
}

/**
 * Crash reporter configuration.
 *
 * @interface CrashReporterConfig
 */
export interface CrashReporterConfig {
    /** URL to submit crash reports to */
    submitUrl?: string;

    /** Product name to include in crash reports */
    productName?: string;

    /** Whether to upload crash reports automatically */
    uploadToServer?: boolean;

    /** Additional metadata to include in crash reports */
    extra?: Record<string, string>;
}

/**
 * Interface for the deep link handler.
 *
 * Manages the zync:// protocol and routes incoming deep links
 * to the appropriate handler or renderer route.
 *
 * @interface IDeepLinkHandler
 */
export interface IDeepLinkHandler {
    /**
     * Registers the application as the handler for the zync:// protocol.
     */
    register(): void;

    /**
     * Processes an incoming deep link URL.
     *
     * @param url - The full deep link URL (e.g., 'zync://project/123')
     */
    handleUrl(url: string): void;

    /**
     * Returns whether the protocol handler is registered.
     *
     * @returns True if registered as the default handler
     */
    isRegistered(): boolean;
}

/**
 * Parsed deep link data.
 *
 * @interface DeepLinkData
 */
export interface DeepLinkData {
    /** The protocol scheme (always 'zync') */
    protocol: string;

    /** The path component (e.g., 'project', 'note', 'meeting') */
    path: string;

    /** Path segments split by '/' */
    segments: string[];

    /** Query parameters */
    params: Record<string, string>;

    /** The raw URL string */
    raw: string;
}
