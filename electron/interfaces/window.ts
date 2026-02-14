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
export enum WindowType {
    /** The main application window */
    MAIN = 'main',

    /** The native settings window */
    SETTINGS = 'settings',

    /** The about dialog window */
    ABOUT = 'about',

    /** The keyboard shortcuts reference window */
    SHORTCUTS = 'shortcuts',

    /** The splash screen shown during startup */
    SPLASH = 'splash',
}

/**
 * Persisted window state for restoration across sessions.
 *
 * @interface WindowState
 */
export interface WindowState {
    /** Window X position on screen */
    x: number;

    /** Window Y position on screen */
    y: number;

    /** Window width in pixels */
    width: number;

    /** Window height in pixels */
    height: number;

    /** Whether the window was maximized */
    isMaximized: boolean;

    /** Whether the window was in fullscreen */
    isFullScreen: boolean;
}

/**
 * Default window state values.
 *
 * @const DEFAULT_WINDOW_STATE
 */
export const DEFAULT_WINDOW_STATE: WindowState = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullScreen: false,
};

/**
 * Window creation options tailored for ZYNC windows.
 *
 * @interface ZyncWindowOptions
 */
export interface ZyncWindowOptions {
    /** Window type */
    type: WindowType;

    /** URL to load */
    url?: string;

    /** HTML file path to load (mutually exclusive with url) */
    filePath?: string;

    /** Window title */
    title: string;

    /** Window width */
    width: number;

    /** Window height */
    height: number;

    /** Minimum width */
    minWidth?: number;

    /** Minimum height */
    minHeight?: number;

    /** Whether the window is resizable */
    resizable: boolean;

    /** Whether to show the window menu bar */
    menuBar: boolean;

    /** Parent window (for modal behavior) */
    parent?: Electron.BrowserWindow;

    /** Whether the window is modal */
    modal: boolean;

    /** Whether to use the preload script */
    usePreload: boolean;

    /** Whether to center the window on screen */
    center: boolean;

    /** Whether the window should have a frame */
    frame: boolean;

    /** Background color */
    backgroundColor: string;
}

/**
 * Window manager state tracking multiple windows.
 *
 * @interface WindowManagerState
 */
export interface WindowManagerState {
    /** Map of window type to window instance ID */
    windows: Map<WindowType, number>;

    /** The currently focused window type */
    focusedWindow: WindowType | null;

    /** Total number of open windows */
    windowCount: number;
}

/**
 * Window event names for internal event handling.
 *
 * @enum WindowEvent
 */
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

/**
 * Window event payload.
 *
 * @interface WindowEventPayload
 */
export interface WindowEventPayload {
    /** The type of window that triggered the event */
    windowType: WindowType;

    /** The BrowserWindow ID */
    windowId: number;

    /** The event that occurred */
    event: WindowEvent;

    /** Event-specific data */
    data?: Record<string, unknown>;

    /** Timestamp of the event */
    timestamp: string;
}
