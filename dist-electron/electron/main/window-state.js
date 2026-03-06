import { app, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
const DEFAULT_STATE = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
};
const SAVE_DEBOUNCE_MS = 500;
function getStatePath() {
    return path.join(app.getPath('userData'), 'window-state.json');
}
export function loadWindowState() {
    try {
        const filePath = getStatePath();
        if (!fs.existsSync(filePath)) {
            console.info('[WindowState] No saved state found, using defaults');
            return centerOnPrimaryDisplay(DEFAULT_STATE);
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        const state = JSON.parse(data);
        if (isPositionOnScreen(state.x, state.y, state.width, state.height)) {
            console.info('[WindowState] Restored saved state');
            return state;
        }
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
function saveWindowState(state) {
    try {
        const filePath = getStatePath();
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('[WindowState] Failed to save state:', error);
    }
}
function isPositionOnScreen(x, y, width, height) {
    const displays = screen.getAllDisplays();
    return displays.some((display) => {
        const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
        return (x < dx + dw &&
            x + width > dx &&
            y < dy + dh &&
            y + height > dy);
    });
}
function centerOnPrimaryDisplay(state) {
    const primary = screen.getPrimaryDisplay();
    const { width: dw, height: dh } = primary.workAreaSize;
    return {
        ...state,
        x: Math.round((dw - state.width) / 2),
        y: Math.round((dh - state.height) / 2),
    };
}
export function trackWindowState(window) {
    let saveTimeout = null;
    const debouncedSave = () => {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
            if (window.isDestroyed()) {
                return;
            }
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