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
 * Update state machine states.
 *
 * @enum UpdateState
 */
export var UpdateState;
(function (UpdateState) {
    /** No update activity */
    UpdateState["IDLE"] = "idle";
    /** Checking for updates */
    UpdateState["CHECKING"] = "checking";
    /** Update is available but not yet downloading */
    UpdateState["AVAILABLE"] = "available";
    /** No update available (already on latest) */
    UpdateState["NOT_AVAILABLE"] = "not-available";
    /** Update is being downloaded */
    UpdateState["DOWNLOADING"] = "downloading";
    /** Update has been downloaded and is ready to install */
    UpdateState["DOWNLOADED"] = "downloaded";
    /** An error occurred during the update process */
    UpdateState["ERROR"] = "error";
})(UpdateState || (UpdateState = {}));
/**
 * Default update configuration.
 *
 * @const DEFAULT_UPDATE_CONFIG
 */
export const DEFAULT_UPDATE_CONFIG = {
    owner: 'ChitkulLakshya',
    repo: 'Zync',
    allowPrerelease: false,
    autoDownload: false,
    autoInstallOnAppQuit: true,
    checkInterval: 4 * 60 * 60 * 1000, // 4 hours
    initialDelay: 10 * 1000, // 10 seconds
};
//# sourceMappingURL=updater.js.map