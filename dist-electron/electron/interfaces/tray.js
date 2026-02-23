/**
 * =============================================================================
 * Tray Interfaces — ZYNC Desktop
 * =============================================================================
 *
 * Type definitions for the system tray icon, context menu, and
 * notification badge management.
 *
 * @module electron/interfaces/tray
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/**
 * Default tray configuration.
 */
export const DEFAULT_TRAY_CONFIG = {
    iconPath: '',
    tooltip: 'ZYNC',
    showBadge: false,
    badgeCount: 0,
    clickToToggle: true,
    doubleClickToOpen: false,
};
/**
 * Default tray state.
 */
export const DEFAULT_TRAY_STATE = {
    isVisible: false,
    isWindowVisible: true,
    badgeCount: 0,
    tooltip: 'ZYNC',
    doNotDisturb: false,
    onlineStatus: 'online',
};
//# sourceMappingURL=tray.js.map