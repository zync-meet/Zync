/**
 * =============================================================================
 * Menu Interfaces — ZYNC Desktop
 * =============================================================================
 *
 * Type definitions for the application menu system, including menu item
 * configuration, context menu builders, and menu state management.
 *
 * @module electron/interfaces/menu
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

// =============================================================================
// Menu Item Types
// =============================================================================

/** Menu item role (built-in Electron roles) */
export type MenuItemRole =
    | 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteAndMatchStyle'
    | 'delete' | 'selectAll' | 'reload' | 'forceReload' | 'toggleDevTools'
    | 'resetZoom' | 'zoomIn' | 'zoomOut' | 'togglefullscreen' | 'window'
    | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide'
    | 'hideOthers' | 'unhide' | 'quit' | 'startSpeaking' | 'stopSpeaking'
    | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'windowMenu';

/** Menu item type */
export type MenuItemType = 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';

/**
 * Configuration for a single menu item.
 */
export interface ZyncMenuItem {
    /** Unique identifier for the menu item */
    id?: string;
    /** Display label */
    label?: string;
    /** Sublabel (displayed below the label) */
    sublabel?: string;
    /** Keyboard accelerator (e.g., "CommandOrControl+S") */
    accelerator?: string;
    /** Path to an icon image */
    icon?: string;
    /** Item type */
    type?: MenuItemType;
    /** Built-in role */
    role?: MenuItemRole;
    /** Whether the item is enabled */
    enabled?: boolean;
    /** Whether the item is visible */
    visible?: boolean;
    /** Whether the checkbox/radio is checked */
    checked?: boolean;
    /** Click handler */
    click?: () => void;
    /** Submenu items */
    submenu?: ZyncMenuItem[];
    /** Tooltip text */
    toolTip?: string;
}

// =============================================================================
// Menu Template Types
// =============================================================================

/**
 * A complete menu bar template (array of top-level menus).
 */
export type MenuTemplate = ZyncMenuItem[];

/**
 * Menu bar section identifiers for dynamic menu building.
 */
export type MenuSection =
    | 'app'       // macOS app menu
    | 'file'      // File menu
    | 'edit'      // Edit menu
    | 'view'      // View menu
    | 'project'   // Project-specific menu
    | 'tools'     // Tools menu
    | 'window'    // Window menu
    | 'help';     // Help menu

/**
 * Menu bar configuration with sections.
 */
export interface MenuBarConfig {
    /** Section configurations */
    sections: Record<MenuSection, ZyncMenuItem[]>;
    /** Whether to include dev tools in the View menu */
    includeDevTools: boolean;
    /** Whether to include the macOS app menu */
    includeMacAppMenu: boolean;
}

// =============================================================================
// Context Menu Types
// =============================================================================

/**
 * Context menu trigger positions.
 */
export interface ContextMenuPosition {
    /** X coordinate */
    x: number;
    /** Y coordinate */
    y: number;
}

/**
 * Context for building dynamic context menus.
 */
export interface ContextMenuContext {
    /** Whether text is selected */
    hasSelection: boolean;
    /** The selected text (if any) */
    selectedText?: string;
    /** Whether the click target is editable */
    isEditable: boolean;
    /** Whether a link was right-clicked */
    isLink: boolean;
    /** The link URL (if isLink) */
    linkURL?: string;
    /** Whether an image was right-clicked */
    isImage: boolean;
    /** The image URL (if isImage) */
    imageURL?: string;
    /** Whether spelling suggestions are available */
    hasSpellingSuggestions: boolean;
    /** Spelling suggestions */
    spellingSuggestions?: string[];
    /** The page URL */
    pageURL: string;
    /** The frame URL */
    frameURL: string;
}

/**
 * Context menu builder function type.
 */
export type ContextMenuBuilder = (context: ContextMenuContext) => ZyncMenuItem[];

// =============================================================================
// Menu State Types
// =============================================================================

/**
 * State of checkbox/radio menu items that need to be tracked.
 */
export interface MenuState {
    /** Whether "Always on Top" is enabled */
    alwaysOnTop: boolean;
    /** Whether "Focus Mode" is enabled */
    focusMode: boolean;
    /** Whether the sidebar is visible */
    sidebarVisible: boolean;
    /** Current zoom level */
    zoomLevel: number;
    /** Whether fullscreen mode is active */
    isFullscreen: boolean;
}

/**
 * Default menu state values.
 */
export const DEFAULT_MENU_STATE: MenuState = {
    alwaysOnTop: false,
    focusMode: false,
    sidebarVisible: true,
    zoomLevel: 1.0,
    isFullscreen: false,
};

// =============================================================================
// Menu Event Types
// =============================================================================

/** Menu item click event data */
export interface MenuClickEvent {
    /** ID of the clicked item */
    itemId: string;
    /** Whether the item is checked (for checkbox/radio) */
    checked?: boolean;
    /** Timestamp */
    timestamp: number;
}

/** Menu event callback */
export type MenuEventCallback = (event: MenuClickEvent) => void;
