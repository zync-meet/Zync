export enum WindowType {

    MAIN = 'main',


    SETTINGS = 'settings',


    ABOUT = 'about',


    SHORTCUTS = 'shortcuts',


    SPLASH = 'splash',
}


export interface WindowState {

    x: number;


    y: number;


    width: number;


    height: number;


    isMaximized: boolean;


    isFullScreen: boolean;
}


export const DEFAULT_WINDOW_STATE: WindowState = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullScreen: false,
};


export interface ZyncWindowOptions {

    type: WindowType;


    url?: string;


    filePath?: string;


    title: string;


    width: number;


    height: number;


    minWidth?: number;


    minHeight?: number;


    resizable: boolean;


    menuBar: boolean;


    parent?: Electron.BrowserWindow;


    modal: boolean;


    usePreload: boolean;


    center: boolean;


    frame: boolean;


    backgroundColor: string;
}


export interface WindowManagerState {

    windows: Map<WindowType, number>;


    focusedWindow: WindowType | null;


    windowCount: number;
}


export enum WindowEvent {
    CREATED = 'window:created',
    CLOSED = 'window:closed',
    FOCUSED = 'window:focused',
    BLURRED = 'window:blurred',
    MAXIMIZED = 'window:maximized',
    UNMAXIMIZED = 'window:unmaximized',
    MINIMIZED = 'window:minimized',
    RESTORED = 'window:restored',
    MOVED = 'window:moved',
    RESIZED = 'window:resized',
    ENTER_FULLSCREEN = 'window:enter-fullscreen',
    LEAVE_FULLSCREEN = 'window:leave-fullscreen',
}


export interface WindowEventPayload {

    windowType: WindowType;


    windowId: number;


    event: WindowEvent;


    data?: Record<string, unknown>;


    timestamp: string;
}
