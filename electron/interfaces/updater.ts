/**
 * =============================================================================
 * Updater Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript interfaces for the auto-update system powered by electron-updater.
 *
 * @module electron/interfaces/updater
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * Update check result.
 *
 * @interface UpdateCheckResult
 */
export interface UpdateCheckResult {
    /** Whether an update is available */
    updateAvailable: boolean;

    /** Information about the available update (if any) */
    updateInfo?: UpdateReleaseInfo;

    /** Cancellation token for aborting the download */
    cancellationToken?: unknown;
}

/**
 * Release information for an available update.
 *
 * @interface UpdateReleaseInfo
 */
export interface UpdateReleaseInfo {
    /** Version of the update (semver) */
    version: string;

    /** Release notes content (may be HTML or Markdown) */
    releaseNotes?: string | ReleaseNoteEntry[] | null;

    /** Release date (ISO 8601 string) */
    releaseDate: string;

    /** Release title/name */
    releaseName?: string | null;

    /** SHA512 hash for integrity verification */
    sha512?: string;

    /** Minimum system version required for this update */
    minimumSystemVersion?: string;

    /** Size of the update download in bytes */
    size?: number;

    /** Whether this is a pre-release version */
    isPrerelease?: boolean;
}

/**
 * Individual release note entry for structured release notes.
 *
 * @interface ReleaseNoteEntry
 */
export interface ReleaseNoteEntry {
    /** Version this note applies to */
    version: string;

    /** Release note content */
    note: string;
}

/**
 * Download progress information.
 *
 * @interface DownloadProgressInfo
 */
export interface DownloadProgressInfo {
    /** Download speed in bytes per second */
    bytesPerSecond: number;

    /** Download completion percentage (0-100) */
    percent: number;

    /** Bytes transferred so far */
    transferred: number;

    /** Total bytes to download */
    total: number;

    /** Estimated time remaining in seconds */
    estimatedTimeRemaining?: number;
}

/**
 * Update state machine states.
 *
 * @enum UpdateState
 */
export enum UpdateState {
    /** No update activity */
    IDLE = 'idle',

    /** Checking for updates */
    CHECKING = 'checking',

    /** Update is available but not yet downloading */
    AVAILABLE = 'available',

    /** No update available (already on latest) */
    NOT_AVAILABLE = 'not-available',

    /** Update is being downloaded */
    DOWNLOADING = 'downloading',

    /** Update has been downloaded and is ready to install */
    DOWNLOADED = 'downloaded',

    /** An error occurred during the update process */
    ERROR = 'error',
}

/**
 * Complete update status snapshot.
 *
 * @interface UpdateStatusSnapshot
 */
export interface UpdateStatusSnapshot {
    /** Current update state */
    state: UpdateState;

    /** Version of the available/downloading/downloaded update */
    version?: string;

    /** Download progress (only valid when state is DOWNLOADING) */
    progress?: DownloadProgressInfo;

    /** Error details (only valid when state is ERROR) */
    error?: UpdateError;

    /** Timestamp of the last state change */
    lastChanged: string;

    /** Timestamp of the last successful update check */
    lastChecked?: string;
}

/**
 * Update error information.
 *
 * @interface UpdateError
 */
export interface UpdateError {
    /** Human-readable error message */
    message: string;

    /** Error code for programmatic handling */
    code?: string;

    /** Stack trace (development only) */
    stack?: string;
}

/**
 * Update configuration options.
 *
 * @interface UpdateConfig
 */
export interface UpdateConfig {
    /** GitHub repository owner */
    owner: string;

    /** GitHub repository name */
    repo: string;

    /** Whether to include pre-release versions */
    allowPrerelease: boolean;

    /** Whether to auto-download available updates */
    autoDownload: boolean;

    /** Whether to auto-install updates on quit */
    autoInstallOnAppQuit: boolean;

    /** Interval between automatic checks (milliseconds) */
    checkInterval: number;

    /** Delay before the first automatic check (milliseconds) */
    initialDelay: number;
}

/**
 * Default update configuration.
 *
 * @const DEFAULT_UPDATE_CONFIG
 */
export const DEFAULT_UPDATE_CONFIG: UpdateConfig = {
    owner: 'ChitkulLakshya',
    repo: 'Zync',
    allowPrerelease: false,
    autoDownload: false,
    autoInstallOnAppQuit: true,
    checkInterval: 4 * 60 * 60 * 1000, // 4 hours
    initialDelay: 10 * 1000, // 10 seconds
};
