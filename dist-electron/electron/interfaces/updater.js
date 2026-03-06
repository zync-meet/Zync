export var UpdateState;
(function (UpdateState) {
    UpdateState["IDLE"] = "idle";
    UpdateState["CHECKING"] = "checking";
    UpdateState["AVAILABLE"] = "available";
    UpdateState["NOT_AVAILABLE"] = "not-available";
    UpdateState["DOWNLOADING"] = "downloading";
    UpdateState["DOWNLOADED"] = "downloaded";
    UpdateState["ERROR"] = "error";
})(UpdateState || (UpdateState = {}));
export const DEFAULT_UPDATE_CONFIG = {
    owner: 'ChitkulLakshya',
    repo: 'Zync',
    allowPrerelease: false,
    autoDownload: false,
    autoInstallOnAppQuit: true,
    checkInterval: 4 * 60 * 60 * 1000,
    initialDelay: 10 * 1000,
};
//# sourceMappingURL=updater.js.map