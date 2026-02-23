/**
 * =============================================================================
 * Native Theme Manager — ZYNC Desktop
 * =============================================================================
 *
 * Provides centralized native theme tracking and IPC forwarding.
 * Listens for system-level theme changes and broadcasts them to all
 * renderer processes. Integrates with app settings for theme persistence.
 *
 * @module electron/main/native-theme
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/** Theme source modes */
export type ThemeSource = 'system' | 'light' | 'dark';
/** Theme info object sent to renderers */
export interface ThemeInfo {
    /** Resolved effective theme */
    effectiveTheme: 'light' | 'dark';
    /** Current theme source setting */
    themeSource: ThemeSource;
    /** Whether the OS reports high contrast mode */
    highContrast: boolean;
    /** Whether the OS uses inverted colors (macOS) */
    invertedColors: boolean;
}
/**
 * Initialize the native theme manager.
 *
 * Registers IPC handlers and listens for theme changes. Should be called
 * once during app initialization, after app.whenReady().
 */
export declare function initNativeTheme(): void;
/**
 * Get the current theme information.
 *
 * @returns {ThemeInfo} Current theme state
 */
export declare function getCurrentThemeInfo(): ThemeInfo;
/**
 * Set the application theme source.
 *
 * @param {ThemeSource} source - 'system', 'light', or 'dark'
 */
export declare function setThemeSource(source: ThemeSource): void;
/**
 * Check if the current effective theme is dark.
 *
 * @returns {boolean} True if dark mode is active
 */
export declare function isDarkMode(): boolean;
