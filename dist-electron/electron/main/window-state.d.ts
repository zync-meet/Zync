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
import { BrowserWindow } from 'electron';
/** Persisted window state data */
interface WindowState {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
}
/**
 * Loads the saved window state from disk.
 *
 * If no saved state exists or the file is corrupted, returns
 * default values centered on the primary display.
 *
 * @returns {WindowState} The loaded or default window state
 */
export declare function loadWindowState(): WindowState;
/**
 * Attaches window state tracking to a BrowserWindow.
 *
 * Listens for move, resize, maximize, and unmaximize events and
 * saves the state with debouncing to avoid excessive disk writes.
 *
 * @param {BrowserWindow} window - The window to track
 */
export declare function trackWindowState(window: BrowserWindow): void;
export {};
