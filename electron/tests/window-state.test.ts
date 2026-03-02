import { describe, it, expect, vi } from 'vitest';


vi.mock('electron', () => ({
    screen: {
        getPrimaryDisplay: vi.fn(() => ({
            workAreaSize: { width: 1920, height: 1080 },
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        })),
        getAllDisplays: vi.fn(() => [
            { bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
        ]),
        getDisplayMatching: vi.fn(() => ({
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        })),
    },
    BrowserWindow: vi.fn(),
}));


interface WindowState {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
    isFullScreen: boolean;
}


function isValidWindowState(state: Record<string, unknown>): state is WindowState {
    return (
        typeof state.x === 'number' &&
        typeof state.y === 'number' &&
        typeof state.width === 'number' &&
        typeof state.height === 'number' &&
        typeof state.isMaximized === 'boolean' &&
        typeof state.isFullScreen === 'boolean' &&
        state.width > 0 &&
        state.height > 0
    );
}

function clampBounds(
    state: WindowState,
    screenWidth: number,
    screenHeight: number,
): WindowState {
    const clamped = { ...state };


    clamped.width = Math.max(clamped.width, 400);
    clamped.height = Math.max(clamped.height, 300);


    if (clamped.x < 0) clamped.x = 0;
    if (clamped.y < 0) clamped.y = 0;
    if (clamped.x + clamped.width > screenWidth) {
        clamped.x = Math.max(0, screenWidth - clamped.width);
    }
    if (clamped.y + clamped.height > screenHeight) {
        clamped.y = Math.max(0, screenHeight - clamped.height);
    }

    return clamped;
}


describe('Window State Validation', () => {
    it('should accept valid state objects', () => {
        const state = {
            x: 100,
            y: 100,
            width: 800,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        expect(isValidWindowState(state)).toBe(true);
    });

    it('should reject state with missing properties', () => {
        const state = { x: 100, y: 100 };
        expect(isValidWindowState(state as any)).toBe(false);
    });

    it('should reject state with zero width', () => {
        const state = {
            x: 0,
            y: 0,
            width: 0,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        expect(isValidWindowState(state)).toBe(false);
    });

    it('should reject state with zero height', () => {
        const state = {
            x: 0,
            y: 0,
            width: 800,
            height: 0,
            isMaximized: false,
            isFullScreen: false,
        };
        expect(isValidWindowState(state)).toBe(false);
    });

    it('should reject state with non-boolean isMaximized', () => {
        const state = {
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            isMaximized: 'yes',
            isFullScreen: false,
        };
        expect(isValidWindowState(state as any)).toBe(false);
    });

    it('should accept state with negative coordinates', () => {

        const state = {
            x: -500,
            y: -200,
            width: 800,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        expect(isValidWindowState(state)).toBe(true);
    });
});


describe('Window Bounds Clamping', () => {
    const screenWidth = 1920;
    const screenHeight = 1080;

    it('should not modify valid bounds', () => {
        const state: WindowState = {
            x: 100,
            y: 100,
            width: 800,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped).toEqual(state);
    });

    it('should clamp negative x to 0', () => {
        const state: WindowState = {
            x: -100,
            y: 100,
            width: 800,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped.x).toBe(0);
    });

    it('should clamp negative y to 0', () => {
        const state: WindowState = {
            x: 100,
            y: -50,
            width: 800,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped.y).toBe(0);
    });

    it('should pull window back when right edge exceeds screen', () => {
        const state: WindowState = {
            x: 1500,
            y: 100,
            width: 800,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped.x + clamped.width).toBeLessThanOrEqual(screenWidth);
    });

    it('should pull window back when bottom edge exceeds screen', () => {
        const state: WindowState = {
            x: 100,
            y: 800,
            width: 800,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped.y + clamped.height).toBeLessThanOrEqual(screenHeight);
    });

    it('should enforce minimum width of 400', () => {
        const state: WindowState = {
            x: 100,
            y: 100,
            width: 100,
            height: 600,
            isMaximized: false,
            isFullScreen: false,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped.width).toBeGreaterThanOrEqual(400);
    });

    it('should enforce minimum height of 300', () => {
        const state: WindowState = {
            x: 100,
            y: 100,
            width: 800,
            height: 50,
            isMaximized: false,
            isFullScreen: false,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped.height).toBeGreaterThanOrEqual(300);
    });

    it('should preserve maximized and fullscreen flags', () => {
        const state: WindowState = {
            x: 100,
            y: 100,
            width: 800,
            height: 600,
            isMaximized: true,
            isFullScreen: true,
        };
        const clamped = clampBounds(state, screenWidth, screenHeight);
        expect(clamped.isMaximized).toBe(true);
        expect(clamped.isFullScreen).toBe(true);
    });
});


describe('Default Window State', () => {
    function getDefaultState(screenWidth: number, screenHeight: number): WindowState {
        const width = Math.round(screenWidth * 0.8);
        const height = Math.round(screenHeight * 0.8);
        return {
            x: Math.round((screenWidth - width) / 2),
            y: Math.round((screenHeight - height) / 2),
            width,
            height,
            isMaximized: false,
            isFullScreen: false,
        };
    }

    it('should center window on screen', () => {
        const state = getDefaultState(1920, 1080);
        const centerX = state.x + state.width / 2;
        const centerY = state.y + state.height / 2;
        expect(Math.abs(centerX - 960)).toBeLessThanOrEqual(1);
        expect(Math.abs(centerY - 540)).toBeLessThanOrEqual(1);
    });

    it('should use 80% of screen dimensions', () => {
        const state = getDefaultState(1920, 1080);
        expect(state.width).toBe(1536);
        expect(state.height).toBe(864);
    });

    it('should not be maximized by default', () => {
        const state = getDefaultState(1920, 1080);
        expect(state.isMaximized).toBe(false);
        expect(state.isFullScreen).toBe(false);
    });

    it('should handle small screens', () => {
        const state = getDefaultState(800, 600);
        expect(state.width).toBeLessThanOrEqual(800);
        expect(state.height).toBeLessThanOrEqual(600);
    });
});


describe('Multi-Display Support', () => {
    function isOnAnyDisplay(
        state: WindowState,
        displays: Array<{ x: number; y: number; width: number; height: number }>,
    ): boolean {
        const windowCenterX = state.x + state.width / 2;
        const windowCenterY = state.y + state.height / 2;

        return displays.some(
            (display) =>
                windowCenterX >= display.x &&
                windowCenterX <= display.x + display.width &&
                windowCenterY >= display.y &&
                windowCenterY <= display.y + display.height,
        );
    }

    const primaryDisplay = { x: 0, y: 0, width: 1920, height: 1080 };
    const secondaryDisplay = { x: 1920, y: 0, width: 2560, height: 1440 };

    it('should detect window on primary display', () => {
        const state: WindowState = {
            x: 100, y: 100, width: 800, height: 600,
            isMaximized: false, isFullScreen: false,
        };
        expect(isOnAnyDisplay(state, [primaryDisplay, secondaryDisplay])).toBe(true);
    });

    it('should detect window on secondary display', () => {
        const state: WindowState = {
            x: 2200, y: 200, width: 800, height: 600,
            isMaximized: false, isFullScreen: false,
        };
        expect(isOnAnyDisplay(state, [primaryDisplay, secondaryDisplay])).toBe(true);
    });

    it('should detect window off all displays', () => {
        const state: WindowState = {
            x: 5000, y: 5000, width: 800, height: 600,
            isMaximized: false, isFullScreen: false,
        };
        expect(isOnAnyDisplay(state, [primaryDisplay])).toBe(false);
    });
});
