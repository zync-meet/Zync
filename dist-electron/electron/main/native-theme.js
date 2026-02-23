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
import { nativeTheme, ipcMain, BrowserWindow } from 'electron';
import { logger } from '../utils/logger.js';
// =============================================================================
// Module State
// =============================================================================
/** Whether the module has been initialized */
let initialized = false;
/** The log instance */
const log = logger;
// =============================================================================
// Public API
// =============================================================================
/**
 * Initialize the native theme manager.
 *
 * Registers IPC handlers and listens for theme changes. Should be called
 * once during app initialization, after app.whenReady().
 */
export function initNativeTheme() {
    if (initialized)
        return;
    // ─────────────────────────────────────────────────────────────────────────
    // IPC: Get current theme info
    // ─────────────────────────────────────────────────────────────────────────
    ipcMain.handle('theme:get', () => {
        return getCurrentThemeInfo();
    });
    // ─────────────────────────────────────────────────────────────────────────
    // IPC: Set theme source
    // ─────────────────────────────────────────────────────────────────────────
    ipcMain.handle('theme:set', (_event, source) => {
        setThemeSource(source);
        return getCurrentThemeInfo();
    });
    // ─────────────────────────────────────────────────────────────────────────
    // IPC: Toggle between light and dark
    // ─────────────────────────────────────────────────────────────────────────
    ipcMain.handle('theme:toggle', () => {
        const newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
        setThemeSource(newTheme);
        return getCurrentThemeInfo();
    });
    // ─────────────────────────────────────────────────────────────────────────
    // Listen for system theme changes
    // ─────────────────────────────────────────────────────────────────────────
    nativeTheme.on('updated', () => {
        const info = getCurrentThemeInfo();
        log.info(`System theme changed: ${info.effectiveTheme}`);
        broadcastThemeChange(info);
    });
    initialized = true;
    log.info(`Native theme initialized (effective: ${getCurrentThemeInfo().effectiveTheme})`);
}
/**
 * Get the current theme information.
 *
 * @returns {ThemeInfo} Current theme state
 */
export function getCurrentThemeInfo() {
    return {
        effectiveTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
        themeSource: nativeTheme.themeSource,
        highContrast: nativeTheme.shouldUseHighContrastColors,
        invertedColors: nativeTheme.shouldUseInvertedColorScheme,
    };
}
/**
 * Set the application theme source.
 *
 * @param {ThemeSource} source - 'system', 'light', or 'dark'
 */
export function setThemeSource(source) {
    nativeTheme.themeSource = source;
    log.info(`Theme source set to: ${source}`);
}
/**
 * Check if the current effective theme is dark.
 *
 * @returns {boolean} True if dark mode is active
 */
export function isDarkMode() {
    return nativeTheme.shouldUseDarkColors;
}
/**
 * Broadcast theme change to all open browser windows.
 *
 * @param {ThemeInfo} info - Theme information to broadcast
 */
function broadcastThemeChange(info) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        if (!win.isDestroyed()) {
            win.webContents.send('theme:changed', info);
        }
    }
}
//# sourceMappingURL=native-theme.js.map