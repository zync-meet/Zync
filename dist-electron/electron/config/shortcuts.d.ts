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
/** A keyboard shortcut definition */
export interface ShortcutDefinition {
    /** Unique identifier */
    id: string;
    /** Human-readable label */
    label: string;
    /** Electron accelerator string */
    accelerator: string;
    /** macOS-specific accelerator (if different) */
    macAccelerator?: string;
    /** Category for grouping */
    category: ShortcutCategory;
    /** Whether this is a global shortcut (works when app is not focused) */
    global: boolean;
    /** Whether this shortcut is user-customizable */
    customizable: boolean;
    /** Description for the shortcuts reference panel */
    description: string;
}
/** Shortcut categories */
export type ShortcutCategory = 'general' | 'navigation' | 'editing' | 'view' | 'window' | 'tools' | 'development';
/**
 * Get the platform-appropriate modifier key name.
 *
 * @param {'cmd' | 'ctrl' | 'alt' | 'shift'} modifier - Modifier key
 * @returns {string} Platform key name
 */
export declare function getModifierKey(modifier: 'cmd' | 'ctrl' | 'alt' | 'shift'): string;
/**
 * Convert an Electron accelerator to a human-readable format.
 *
 * @param {string} accelerator - Electron accelerator string
 * @returns {string} Human-readable shortcut
 */
export declare function formatAccelerator(accelerator: string): string;
/**
 * All keyboard shortcuts used in the application.
 */
export declare const SHORTCUTS: Record<string, ShortcutDefinition>;
/**
 * Get all shortcuts in a specific category.
 *
 * @param {ShortcutCategory} category - Category to filter by
 * @returns {ShortcutDefinition[]} Shortcuts in the category
 */
export declare function getShortcutsByCategory(category: ShortcutCategory): ShortcutDefinition[];
/**
 * Get all global shortcuts (work when app is not focused).
 *
 * @returns {ShortcutDefinition[]} Global shortcuts
 */
export declare function getGlobalShortcuts(): ShortcutDefinition[];
/**
 * Get all customizable shortcuts.
 *
 * @returns {ShortcutDefinition[]} Customizable shortcuts
 */
export declare function getCustomizableShortcuts(): ShortcutDefinition[];
/**
 * Get the platform-appropriate accelerator for a shortcut.
 *
 * @param {string} id - Shortcut ID
 * @returns {string | undefined} Accelerator string
 */
export declare function getAccelerator(id: string): string | undefined;
