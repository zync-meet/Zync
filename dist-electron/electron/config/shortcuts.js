/**
 * =============================================================================
 * Keyboard Shortcut Definitions — ZYNC Desktop
 * =============================================================================
 *
 * Centralized definitions for all keyboard shortcuts used in menus,
 * global shortcuts, and in-app key bindings. Provides platform-aware
 * accelerator strings.
 *
 * @module electron/config/shortcuts
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
// =============================================================================
// Platform Helpers
// =============================================================================
const isMac = process.platform === 'darwin';
/**
 * Get the platform-appropriate modifier key name.
 *
 * @param {'cmd' | 'ctrl' | 'alt' | 'shift'} modifier - Modifier key
 * @returns {string} Platform key name
 */
export function getModifierKey(modifier) {
    switch (modifier) {
        case 'cmd':
            return isMac ? '⌘' : 'Ctrl';
        case 'ctrl':
            return isMac ? '⌃' : 'Ctrl';
        case 'alt':
            return isMac ? '⌥' : 'Alt';
        case 'shift':
            return isMac ? '⇧' : 'Shift';
    }
}
/**
 * Convert an Electron accelerator to a human-readable format.
 *
 * @param {string} accelerator - Electron accelerator string
 * @returns {string} Human-readable shortcut
 */
export function formatAccelerator(accelerator) {
    return accelerator
        .replace('CommandOrControl', isMac ? '⌘' : 'Ctrl')
        .replace('Command', '⌘')
        .replace('Control', isMac ? '⌃' : 'Ctrl')
        .replace('Alt', isMac ? '⌥' : 'Alt')
        .replace('Shift', isMac ? '⇧' : 'Shift')
        .replace('Super', isMac ? '⌘' : 'Win')
        .replace('Escape', 'Esc')
        .replace('Delete', 'Del')
        .replace('Backspace', '⌫')
        .replace('Enter', isMac ? '↵' : 'Enter')
        .replace('ArrowUp', '↑')
        .replace('ArrowDown', '↓')
        .replace('ArrowLeft', '←')
        .replace('ArrowRight', '→')
        .replace(/\+/g, isMac ? '' : ' + ');
}
// =============================================================================
// Shortcut Definitions
// =============================================================================
/**
 * All keyboard shortcuts used in the application.
 */
export const SHORTCUTS = {
    // ─── General ───────────────────────────────────────────────────────
    OPEN_SETTINGS: {
        id: 'open-settings',
        label: 'Open Settings',
        accelerator: 'CommandOrControl+,',
        category: 'general',
        global: false,
        customizable: true,
        description: 'Open the settings window',
    },
    QUIT: {
        id: 'quit',
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        category: 'general',
        global: false,
        customizable: false,
        description: 'Quit the application',
    },
    SEARCH: {
        id: 'search',
        label: 'Search',
        accelerator: 'CommandOrControl+K',
        category: 'general',
        global: false,
        customizable: true,
        description: 'Open the command palette / search',
    },
    // ─── Navigation ────────────────────────────────────────────────────
    GO_BACK: {
        id: 'go-back',
        label: 'Go Back',
        accelerator: 'Alt+Left',
        macAccelerator: 'Command+[',
        category: 'navigation',
        global: false,
        customizable: true,
        description: 'Navigate to the previous page',
    },
    GO_FORWARD: {
        id: 'go-forward',
        label: 'Go Forward',
        accelerator: 'Alt+Right',
        macAccelerator: 'Command+]',
        category: 'navigation',
        global: false,
        customizable: true,
        description: 'Navigate to the next page',
    },
    GO_HOME: {
        id: 'go-home',
        label: 'Go Home',
        accelerator: 'CommandOrControl+Shift+H',
        category: 'navigation',
        global: false,
        customizable: true,
        description: 'Navigate to the home page',
    },
    // ─── Editing ───────────────────────────────────────────────────────
    UNDO: {
        id: 'undo',
        label: 'Undo',
        accelerator: 'CommandOrControl+Z',
        category: 'editing',
        global: false,
        customizable: false,
        description: 'Undo the last action',
    },
    REDO: {
        id: 'redo',
        label: 'Redo',
        accelerator: 'CommandOrControl+Shift+Z',
        category: 'editing',
        global: false,
        customizable: false,
        description: 'Redo the last undone action',
    },
    COPY: {
        id: 'copy',
        label: 'Copy',
        accelerator: 'CommandOrControl+C',
        category: 'editing',
        global: false,
        customizable: false,
        description: 'Copy selection to clipboard',
    },
    PASTE: {
        id: 'paste',
        label: 'Paste',
        accelerator: 'CommandOrControl+V',
        category: 'editing',
        global: false,
        customizable: false,
        description: 'Paste from clipboard',
    },
    CUT: {
        id: 'cut',
        label: 'Cut',
        accelerator: 'CommandOrControl+X',
        category: 'editing',
        global: false,
        customizable: false,
        description: 'Cut selection to clipboard',
    },
    SELECT_ALL: {
        id: 'select-all',
        label: 'Select All',
        accelerator: 'CommandOrControl+A',
        category: 'editing',
        global: false,
        customizable: false,
        description: 'Select all content',
    },
    // ─── View ──────────────────────────────────────────────────────────
    ZOOM_IN: {
        id: 'zoom-in',
        label: 'Zoom In',
        accelerator: 'CommandOrControl+=',
        category: 'view',
        global: false,
        customizable: true,
        description: 'Increase zoom level',
    },
    ZOOM_OUT: {
        id: 'zoom-out',
        label: 'Zoom Out',
        accelerator: 'CommandOrControl+-',
        category: 'view',
        global: false,
        customizable: true,
        description: 'Decrease zoom level',
    },
    ZOOM_RESET: {
        id: 'zoom-reset',
        label: 'Reset Zoom',
        accelerator: 'CommandOrControl+0',
        category: 'view',
        global: false,
        customizable: true,
        description: 'Reset zoom to 100%',
    },
    TOGGLE_FULLSCREEN: {
        id: 'toggle-fullscreen',
        label: 'Toggle Fullscreen',
        accelerator: 'F11',
        macAccelerator: 'Control+Command+F',
        category: 'view',
        global: false,
        customizable: true,
        description: 'Toggle fullscreen mode',
    },
    TOGGLE_SIDEBAR: {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar',
        accelerator: 'CommandOrControl+B',
        category: 'view',
        global: false,
        customizable: true,
        description: 'Show/hide the sidebar',
    },
    // ─── Window ────────────────────────────────────────────────────────
    NEW_WINDOW: {
        id: 'new-window',
        label: 'New Window',
        accelerator: 'CommandOrControl+Shift+N',
        category: 'window',
        global: false,
        customizable: true,
        description: 'Open a new window',
    },
    CLOSE_WINDOW: {
        id: 'close-window',
        label: 'Close Window',
        accelerator: 'CommandOrControl+W',
        category: 'window',
        global: false,
        customizable: false,
        description: 'Close the current window',
    },
    MINIMIZE_WINDOW: {
        id: 'minimize-window',
        label: 'Minimize',
        accelerator: 'CommandOrControl+M',
        category: 'window',
        global: false,
        customizable: false,
        description: 'Minimize the window',
    },
    // ─── Tools ─────────────────────────────────────────────────────────
    QUICK_NOTE: {
        id: 'quick-note',
        label: 'Quick Note',
        accelerator: 'CommandOrControl+Shift+N',
        category: 'tools',
        global: true,
        customizable: true,
        description: 'Create a quick note',
    },
    CAPTURE_SCREENSHOT: {
        id: 'capture-screenshot',
        label: 'Capture Screenshot',
        accelerator: 'CommandOrControl+Shift+4',
        category: 'tools',
        global: true,
        customizable: true,
        description: 'Capture a screenshot',
    },
    TOGGLE_FOCUS_MODE: {
        id: 'toggle-focus-mode',
        label: 'Focus Mode',
        accelerator: 'CommandOrControl+Shift+F',
        category: 'tools',
        global: false,
        customizable: true,
        description: 'Toggle focus mode',
    },
    // ─── Development ───────────────────────────────────────────────────
    TOGGLE_DEV_TOOLS: {
        id: 'toggle-dev-tools',
        label: 'Toggle DevTools',
        accelerator: 'F12',
        category: 'development',
        global: false,
        customizable: false,
        description: 'Toggle Chrome DevTools',
    },
    RELOAD: {
        id: 'reload',
        label: 'Reload',
        accelerator: 'CommandOrControl+R',
        category: 'development',
        global: false,
        customizable: false,
        description: 'Reload the current page',
    },
    HARD_RELOAD: {
        id: 'hard-reload',
        label: 'Hard Reload',
        accelerator: 'CommandOrControl+Shift+R',
        category: 'development',
        global: false,
        customizable: false,
        description: 'Reload ignoring cache',
    },
};
// =============================================================================
// Query Functions
// =============================================================================
/**
 * Get all shortcuts in a specific category.
 *
 * @param {ShortcutCategory} category - Category to filter by
 * @returns {ShortcutDefinition[]} Shortcuts in the category
 */
export function getShortcutsByCategory(category) {
    return Object.values(SHORTCUTS).filter((s) => s.category === category);
}
/**
 * Get all global shortcuts (work when app is not focused).
 *
 * @returns {ShortcutDefinition[]} Global shortcuts
 */
export function getGlobalShortcuts() {
    return Object.values(SHORTCUTS).filter((s) => s.global);
}
/**
 * Get all customizable shortcuts.
 *
 * @returns {ShortcutDefinition[]} Customizable shortcuts
 */
export function getCustomizableShortcuts() {
    return Object.values(SHORTCUTS).filter((s) => s.customizable);
}
/**
 * Get the platform-appropriate accelerator for a shortcut.
 *
 * @param {string} id - Shortcut ID
 * @returns {string | undefined} Accelerator string
 */
export function getAccelerator(id) {
    const shortcut = Object.values(SHORTCUTS).find((s) => s.id === id);
    if (!shortcut)
        return undefined;
    return isMac && shortcut.macAccelerator ? shortcut.macAccelerator : shortcut.accelerator;
}
//# sourceMappingURL=shortcuts.js.map