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

// =============================================================================
// Tray Configuration
// =============================================================================

/**
 * Configuration for the system tray icon.
 */
export interface TrayConfig {
    /** Path to the tray icon image */
    iconPath: string;
    /** Path to the pressed/active state icon (macOS) */
    pressedIconPath?: string;
    /** Tooltip text shown on hover */
    tooltip: string;
    /** Whether to show a notification badge */
    showBadge: boolean;
    /** Badge count (0 = hidden) */
    badgeCount: number;
    /** Whether clicking the tray icon shows/hides the window */
    clickToToggle: boolean;
    /** Whether double-click opens the window (Windows) */
    doubleClickToOpen: boolean;
}

/**
 * Default tray configuration.
 */
export const DEFAULT_TRAY_CONFIG: TrayConfig = {
    iconPath: '',
    tooltip: 'ZYNC',
    showBadge: false,
    badgeCount: 0,
    clickToToggle: true,
    doubleClickToOpen: false,
};

// =============================================================================
// Tray Menu Items
// =============================================================================

/**
 * Tray context menu item configuration.
 */
export interface TrayMenuItem {
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Whether this is a separator */
    isSeparator?: boolean;
    /** Whether the item is enabled */
    enabled?: boolean;
    /** Whether the item is visible */
    visible?: boolean;
    /** Whether this is a checkbox item */
    isCheckbox?: boolean;
    /** Checkbox checked state */
    checked?: boolean;
    /** Click handler */
    click?: () => void;
    /** Submenu items */
    submenu?: TrayMenuItem[];
    /** Icon path */
    icon?: string;
}

// =============================================================================
// Tray State
// =============================================================================

/**
 * Current state of the tray icon and its features.
 */
export interface TrayState {
    /** Whether the tray is currently visible */
    isVisible: boolean;
    /** Whether the main window is currently visible */
    isWindowVisible: boolean;
    /** Current badge count */
    badgeCount: number;
    /** Current tooltip text */
    tooltip: string;
    /** Whether the app is in "Do Not Disturb" mode */
    doNotDisturb: boolean;
    /** Online/offline status indicator */
    onlineStatus: 'online' | 'offline' | 'connecting';
}

/**
 * Default tray state.
 */
export const DEFAULT_TRAY_STATE: TrayState = {
    isVisible: false,
    isWindowVisible: true,
    badgeCount: 0,
    tooltip: 'ZYNC',
    doNotDisturb: false,
    onlineStatus: 'online',
};

// =============================================================================
// Tray Events
// =============================================================================

/** Tray event types */
export type TrayEventType =
    | 'click'
    | 'double-click'
    | 'right-click'
    | 'balloon-click'     // Windows notification balloon clicked
    | 'balloon-closed'    // Windows notification balloon closed
    | 'drop-files'        // Files dropped onto the tray icon
    | 'mouse-enter'
    | 'mouse-leave'
    | 'mouse-move';

/** Tray event data */
export interface TrayEvent {
    /** Event type */
    type: TrayEventType;
    /** Mouse position (if applicable) */
    position?: { x: number; y: number };
    /** Modifier keys held during the event */
    modifiers?: {
        altKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        metaKey: boolean;
    };
    /** Dropped file paths (for 'drop-files' event) */
    filePaths?: string[];
    /** Timestamp */
    timestamp: number;
}

/** Tray event callback */
export type TrayEventCallback = (event: TrayEvent) => void;

// =============================================================================
// Tray Actions
// =============================================================================

/**
 * Actions that can be triggered from the tray.
 */
export type TrayAction =
    | 'show-window'
    | 'hide-window'
    | 'toggle-window'
    | 'open-settings'
    | 'check-updates'
    | 'toggle-dnd'
    | 'quit';

/**
 * Map of tray actions to their display labels and handlers.
 */
export interface TrayActionConfig {
    /** Action identifier */
    action: TrayAction;
    /** Display label */
    label: string;
    /** Keyboard accelerator */
    accelerator?: string;
    /** Whether this action is enabled */
    enabled: boolean;
    /** Whether this action is visible */
    visible: boolean;
}
