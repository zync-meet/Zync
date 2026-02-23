/**
 * =============================================================================
 * Window Interfaces — ZYNC Desktop Application
 * =============================================================================
 *
 * TypeScript interfaces for window management, state persistence, and
 * multi-window coordination in the Electron main process.
 *
 * @module electron/interfaces/window
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/**
 * Window type identifiers used to distinguish between different
 * application windows.
 *
 * @enum WindowType
 */
export var WindowType;
(function (WindowType) {
    /** The main application window */
    WindowType["MAIN"] = "main";
    /** The native settings window */
    WindowType["SETTINGS"] = "settings";
    /** The about dialog window */
    WindowType["ABOUT"] = "about";
    /** The keyboard shortcuts reference window */
    WindowType["SHORTCUTS"] = "shortcuts";
    /** The splash screen shown during startup */
    WindowType["SPLASH"] = "splash";
})(WindowType || (WindowType = {}));
/**
 * Default window state values.
 *
 * @const DEFAULT_WINDOW_STATE
 */
export const DEFAULT_WINDOW_STATE = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullScreen: false,
};
/**
 * Window event names for internal event handling.
 *
 * @enum WindowEvent
 */
export var WindowEvent;
(function (WindowEvent) {
    WindowEvent["CREATED"] = "window:created";
    WindowEvent["CLOSED"] = "window:closed";
    WindowEvent["FOCUSED"] = "window:focused";
    WindowEvent["BLURRED"] = "window:blurred";
    WindowEvent["MAXIMIZED"] = "window:maximized";
    WindowEvent["UNMAXIMIZED"] = "window:unmaximized";
    WindowEvent["MINIMIZED"] = "window:minimized";
    WindowEvent["RESTORED"] = "window:restored";
    WindowEvent["MOVED"] = "window:moved";
    WindowEvent["RESIZED"] = "window:resized";
    WindowEvent["ENTER_FULLSCREEN"] = "window:enter-fullscreen";
    WindowEvent["LEAVE_FULLSCREEN"] = "window:leave-fullscreen";
})(WindowEvent || (WindowEvent = {}));
//# sourceMappingURL=window.js.map