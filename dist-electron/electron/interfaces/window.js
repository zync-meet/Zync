export var WindowType;
(function (WindowType) {
    WindowType["MAIN"] = "main";
    WindowType["SETTINGS"] = "settings";
    WindowType["ABOUT"] = "about";
    WindowType["SHORTCUTS"] = "shortcuts";
    WindowType["SPLASH"] = "splash";
})(WindowType || (WindowType = {}));
export const DEFAULT_WINDOW_STATE = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullScreen: false,
};
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