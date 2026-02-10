/**
 * =============================================================================
 * Window State Manager — ZYNC Desktop Application
 * =============================================================================
 *
 * Persists and restores window position, size, and maximized state
 * across application restarts. Uses a JSON file in the user data
 * directory for storage.
 *
 * @module electron/main/window-state
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { app, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
/** Default window dimensions */
const DEFAULT_STATE = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
};
/** Debounce delay for saving state (ms) */
const SAVE_DEBOUNCE_MS = 500;
/**
 * Path to the window state JSON file.
 */
function getStatePath() {
    return path.join(app.getPath('userData'), 'window-state.json');
}
/**
 * Loads the saved window state from disk.
 *
 * If no saved state exists or the file is corrupted, returns
 * default values centered on the primary display.
 *
 * @returns {WindowState} The loaded or default window state
 */
export function loadWindowState() {
    try {
        const filePath = getStatePath();
        if (!fs.existsSync(filePath)) {
            console.info('[WindowState] No saved state found, using defaults');
            return centerOnPrimaryDisplay(DEFAULT_STATE);
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        const state = JSON.parse(data);
        // Validate that the saved position is still on a visible display
        if (isPositionOnScreen(state.x, state.y, state.width, state.height)) {
            console.info('[WindowState] Restored saved state');
            return state;
        }
        // If the saved position is off-screen (e.g., monitor was disconnected),
        // center the window on the primary display
        console.info('[WindowState] Saved position is off-screen, centering');
        return centerOnPrimaryDisplay({
            ...state,
            width: state.width || DEFAULT_STATE.width,
            height: state.height || DEFAULT_STATE.height,
        });
    }
    catch (error) {
        console.error('[WindowState] Failed to load state:', error);
        return centerOnPrimaryDisplay(DEFAULT_STATE);
    }
}
/**
 * Saves the current window state to disk.
 *
 * @param {WindowState} state - The window state to save
 */
function saveWindowState(state) {
    try {
        const filePath = getStatePath();
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('[WindowState] Failed to save state:', error);
    }
}
/**
 * Checks if a position is visible on any connected display.
 *
 * @param {number} x - Window X position
 * @param {number} y - Window Y position
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @returns {boolean} True if the window would be at least partially visible
 */
function isPositionOnScreen(x, y, width, height) {
    const displays = screen.getAllDisplays();
    return displays.some((display) => {
        const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
        // Check if any part of the window overlaps with this display
        return (x < dx + dw &&
            x + width > dx &&
            y < dy + dh &&
            y + height > dy);
    });
}
/**
 * Centers a window state on the primary display.
 *
 * @param {WindowState} state - The state to center
 * @returns {WindowState} New state with centered position
 */
function centerOnPrimaryDisplay(state) {
    const primary = screen.getPrimaryDisplay();
    const { width: dw, height: dh } = primary.workAreaSize;
    return {
        ...state,
        x: Math.round((dw - state.width) / 2),
        y: Math.round((dh - state.height) / 2),
    };
}
/**
 * Attaches window state tracking to a BrowserWindow.
 *
 * Listens for move, resize, maximize, and unmaximize events and
 * saves the state with debouncing to avoid excessive disk writes.
 *
 * @param {BrowserWindow} window - The window to track
 */
export function trackWindowState(window) {
    let saveTimeout = null;
    const debouncedSave = () => {
        if (saveTimeout)
            clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            if (window.isDestroyed())
                return;
            const bounds = window.getBounds();
            const state = {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                isMaximized: window.isMaximized(),
            };
            saveWindowState(state);
        }, SAVE_DEBOUNCE_MS);
    };
    window.on('move', debouncedSave);
    window.on('resize', debouncedSave);
    window.on('maximize', debouncedSave);
    window.on('unmaximize', debouncedSave);
    // Save state before the window is closed
    window.on('close', () => {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
        if (!window.isDestroyed()) {
            const bounds = window.getBounds();
            saveWindowState({
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                isMaximized: window.isMaximized(),
            });
        }
    });
    console.info('[WindowState] Tracking attached');
}
//# sourceMappingURL=window-state.js.map