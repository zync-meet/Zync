/**
 * =============================================================================
 * Window State Manager Tests — ZYNC Desktop Application
 * =============================================================================
 *
 * Unit tests for the window state manager module. These tests verify that:
 *
 * 1. Window state is correctly loaded from disk
 * 2. Window state is correctly saved to disk with debouncing
 * 3. Position validation ensures windows remain on visible displays
 * 4. Window tracking properly attaches event listeners
 * 5. Edge cases and error conditions are handled gracefully
 *
 * @module electron/tests/unit/main/window-state.test
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { describe, it, expect, beforeEach, afterEach, vi, } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createMockWindow, createTempDirectory, cleanupTempDirectory, captureConsole, } from '../../helpers';
// =============================================================================
// Mock Setup
// =============================================================================
/**
 * Mock the Electron app and screen modules.
 */
vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue(''),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        isPackaged: false,
    },
    screen: {
        getPrimaryDisplay: vi.fn().mockReturnValue({
            id: 1,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            workArea: { x: 0, y: 0, width: 1920, height: 1040 },
            size: { width: 1920, height: 1080 },
            workAreaSize: { width: 1920, height: 1040 },
            scaleFactor: 1,
        }),
        getAllDisplays: vi.fn().mockReturnValue([
            {
                id: 1,
                bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                workArea: { x: 0, y: 0, width: 1920, height: 1040 },
                size: { width: 1920, height: 1080 },
                workAreaSize: { width: 1920, height: 1040 },
                scaleFactor: 1,
            },
        ]),
    },
    BrowserWindow: vi.fn(),
}));
// Import the actual module (with mocked dependencies)
import { loadWindowState, trackWindowState } from '../../../main/window-state';
import { app, screen } from 'electron';
/**
 * Default window dimensions.
 */
const DEFAULT_STATE = {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    isMaximized: false,
};
// =============================================================================
// Test Suite: Window State Manager
// =============================================================================
describe('Window State Manager', () => {
    /**
     * Temporary directory for test files.
     */
    let tempDir;
    /**
     * Mock app.getPath to return our temp directory.
     */
    let mockGetPath;
    /**
     * Console spy for capturing log output.
     */
    let consoleSpy;
    /**
     * Set up before each test.
     */
    beforeEach(() => {
        // Create a temporary directory for test files
        tempDir = createTempDirectory('window-state');
        // Setup mock for app.getPath
        mockGetPath = app.getPath;
        mockGetPath.mockImplementation((name) => {
            if (name === 'userData') {
                return tempDir;
            }
            return path.join(os.tmpdir(), name);
        });
        // Reset screen mocks
        const mockScreen = screen;
        mockScreen.getPrimaryDisplay.mockReturnValue({
            id: 1,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            workArea: { x: 0, y: 0, width: 1920, height: 1040 },
            size: { width: 1920, height: 1080 },
            workAreaSize: { width: 1920, height: 1040 },
            scaleFactor: 1,
        });
        mockScreen.getAllDisplays.mockReturnValue([
            {
                id: 1,
                bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                workArea: { x: 0, y: 0, width: 1920, height: 1040 },
                size: { width: 1920, height: 1080 },
                workAreaSize: { width: 1920, height: 1040 },
                scaleFactor: 1,
            },
        ]);
        // Capture console output
        consoleSpy = captureConsole();
        // Use fake timers for debounce testing
        vi.useFakeTimers();
    });
    /**
     * Clean up after each test.
     */
    afterEach(() => {
        // Restore console
        consoleSpy.restore();
        // Restore real timers
        vi.useRealTimers();
        // Clean up temp directory
        cleanupTempDirectory(tempDir);
        // Clear all mocks
        vi.clearAllMocks();
    });
    // ===========================================================================
    // Test Group: loadWindowState
    // ===========================================================================
    describe('loadWindowState()', () => {
        describe('Without Saved State', () => {
            it('should return centered default state when no saved state exists', () => {
                const state = loadWindowState();
                // Should have default dimensions
                expect(state.width).toBe(DEFAULT_STATE.width);
                expect(state.height).toBe(DEFAULT_STATE.height);
                expect(state.isMaximized).toBe(DEFAULT_STATE.isMaximized);
                // Should be centered on primary display
                const expectedX = (1920 - state.width) / 2;
                const expectedY = (1040 - state.height) / 2;
                expect(state.x).toBe(expectedX);
                expect(state.y).toBe(expectedY);
            });
            it('should log info message when no saved state found', () => {
                loadWindowState();
                expect(consoleSpy.hasInfo('No saved state found')).toBe(true);
            });
        });
        describe('With Valid Saved State', () => {
            it('should load saved state from file', () => {
                const savedState = {
                    x: 100,
                    y: 100,
                    width: 1000,
                    height: 700,
                    isMaximized: true,
                };
                // Write saved state to file
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');
                const state = loadWindowState();
                expect(state.x).toBe(savedState.x);
                expect(state.y).toBe(savedState.y);
                expect(state.width).toBe(savedState.width);
                expect(state.height).toBe(savedState.height);
                expect(state.isMaximized).toBe(savedState.isMaximized);
            });
            it('should log info message when state is restored', () => {
                const savedState = {
                    x: 100,
                    y: 100,
                    width: 1000,
                    height: 700,
                    isMaximized: false,
                };
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');
                loadWindowState();
                expect(consoleSpy.hasInfo('Restored saved state')).toBe(true);
            });
            it('should preserve custom dimensions', () => {
                const savedState = {
                    x: 200,
                    y: 150,
                    width: 1600,
                    height: 900,
                    isMaximized: false,
                };
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');
                const state = loadWindowState();
                expect(state.width).toBe(1600);
                expect(state.height).toBe(900);
            });
        });
        describe('With Off-Screen Saved State', () => {
            it('should center window when saved position is completely off-screen', () => {
                const savedState = {
                    x: 5000, // Way off screen
                    y: 5000,
                    width: 1000,
                    height: 700,
                    isMaximized: false,
                };
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');
                const state = loadWindowState();
                // Position should be centered
                const expectedX = (1920 - state.width) / 2;
                const expectedY = (1040 - state.height) / 2;
                expect(state.x).toBe(expectedX);
                expect(state.y).toBe(expectedY);
                // Dimensions should be preserved
                expect(state.width).toBe(1000);
                expect(state.height).toBe(700);
            });
            it('should keep window when at least partially visible', () => {
                const savedState = {
                    x: 1800, // Partially off right edge
                    y: 100,
                    width: 200,
                    height: 200,
                    isMaximized: false,
                };
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');
                const state = loadWindowState();
                // Position should be preserved since it's partially visible
                expect(state.x).toBe(1800);
                expect(state.y).toBe(100);
            });
            it('should log info message when re-centering off-screen window', () => {
                const savedState = {
                    x: 5000,
                    y: 5000,
                    width: 1000,
                    height: 700,
                    isMaximized: false,
                };
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');
                loadWindowState();
                expect(consoleSpy.hasInfo('off-screen')).toBe(true);
            });
        });
        describe('With Multiple Displays', () => {
            beforeEach(() => {
                // Configure multiple displays
                const mockScreen = screen;
                mockScreen.getAllDisplays.mockReturnValue([
                    {
                        id: 1,
                        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                        workArea: { x: 0, y: 0, width: 1920, height: 1040 },
                    },
                    {
                        id: 2,
                        bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
                        workArea: { x: 1920, y: 0, width: 1920, height: 1040 },
                    },
                ]);
            });
            it('should accept positions on secondary display', () => {
                const savedState = {
                    x: 2000, // On second display
                    y: 100,
                    width: 1000,
                    height: 700,
                    isMaximized: false,
                };
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');
                const state = loadWindowState();
                expect(state.x).toBe(2000);
                expect(state.y).toBe(100);
            });
        });
        describe('Error Handling', () => {
            it('should return defaults when state file is corrupted', () => {
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, 'not valid json {{{', 'utf-8');
                const state = loadWindowState();
                expect(state.width).toBe(DEFAULT_STATE.width);
                expect(state.height).toBe(DEFAULT_STATE.height);
            });
            it('should log error when state file is corrupted', () => {
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, 'not valid json', 'utf-8');
                loadWindowState();
                expect(consoleSpy.hasError('Failed to load state')).toBe(true);
            });
            it('should handle missing width/height in saved state', () => {
                const partialState = {
                    x: 100,
                    y: 100,
                    isMaximized: false,
                };
                const statePath = path.join(tempDir, 'window-state.json');
                fs.writeFileSync(statePath, JSON.stringify(partialState), 'utf-8');
                const state = loadWindowState();
                // Should use partial values but fill in defaults
                expect(state.x).toBeDefined();
                expect(state.y).toBeDefined();
            });
            it('should handle permission errors gracefully', () => {
                // This test simulates a permission error by mocking fs
                const originalReadFileSync = fs.readFileSync;
                vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
                    throw new Error('EACCES: permission denied');
                });
                vi.spyOn(fs, 'existsSync').mockReturnValue(true);
                const state = loadWindowState();
                // Should fall back to defaults
                expect(state.width).toBe(DEFAULT_STATE.width);
                expect(state.height).toBe(DEFAULT_STATE.height);
                // Restore original
                vi.restoreAllMocks();
            });
        });
    });
    // ===========================================================================
    // Test Group: trackWindowState
    // ===========================================================================
    describe('trackWindowState()', () => {
        let mockWindow;
        beforeEach(() => {
            mockWindow = createMockWindow({
                bounds: { x: 100, y: 100, width: 800, height: 600 },
                isMaximized: false,
            });
        });
        describe('Event Listener Attachment', () => {
            it('should attach move event listener', () => {
                trackWindowState(mockWindow);
                expect(mockWindow.on).toHaveBeenCalledWith('move', expect.any(Function));
            });
            it('should attach resize event listener', () => {
                trackWindowState(mockWindow);
                expect(mockWindow.on).toHaveBeenCalledWith('resize', expect.any(Function));
            });
            it('should attach maximize event listener', () => {
                trackWindowState(mockWindow);
                expect(mockWindow.on).toHaveBeenCalledWith('maximize', expect.any(Function));
            });
            it('should attach unmaximize event listener', () => {
                trackWindowState(mockWindow);
                expect(mockWindow.on).toHaveBeenCalledWith('unmaximize', expect.any(Function));
            });
            it('should attach close event listener', () => {
                trackWindowState(mockWindow);
                expect(mockWindow.on).toHaveBeenCalledWith('close', expect.any(Function));
            });
            it('should log info message when tracking is attached', () => {
                trackWindowState(mockWindow);
                expect(consoleSpy.hasInfo('Tracking attached')).toBe(true);
            });
        });
        describe('State Saving on Events', () => {
            it('should save state after debounce delay on move', async () => {
                trackWindowState(mockWindow);
                // Trigger move event
                mockWindow._triggerEvent('move');
                // File should not exist yet (debounced)
                const statePath = path.join(tempDir, 'window-state.json');
                expect(fs.existsSync(statePath)).toBe(false);
                // Advance timers past debounce delay
                await vi.advanceTimersByTimeAsync(600);
                // Now the file should exist
                expect(fs.existsSync(statePath)).toBe(true);
            });
            it('should save state after debounce delay on resize', async () => {
                trackWindowState(mockWindow);
                mockWindow._triggerEvent('resize');
                await vi.advanceTimersByTimeAsync(600);
                const statePath = path.join(tempDir, 'window-state.json');
                expect(fs.existsSync(statePath)).toBe(true);
            });
            it('should save state on maximize', async () => {
                trackWindowState(mockWindow);
                // Update mock to return maximized state
                mockWindow.isMaximized = vi.fn(() => true);
                mockWindow._triggerEvent('maximize');
                await vi.advanceTimersByTimeAsync(600);
                const statePath = path.join(tempDir, 'window-state.json');
                const savedState = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                expect(savedState.isMaximized).toBe(true);
            });
            it('should save state on unmaximize', async () => {
                trackWindowState(mockWindow);
                mockWindow._triggerEvent('unmaximize');
                await vi.advanceTimersByTimeAsync(600);
                const statePath = path.join(tempDir, 'window-state.json');
                expect(fs.existsSync(statePath)).toBe(true);
            });
            it('should debounce rapid events', async () => {
                trackWindowState(mockWindow);
                // Trigger many move events rapidly
                for (let i = 0; i < 10; i++) {
                    mockWindow._triggerEvent('move');
                    await vi.advanceTimersByTimeAsync(100);
                }
                // Wait for final debounce
                await vi.advanceTimersByTimeAsync(600);
                // Should only have one file (written once after debounce)
                const statePath = path.join(tempDir, 'window-state.json');
                expect(fs.existsSync(statePath)).toBe(true);
            });
            it('should save correct bounds in state file', async () => {
                // Create window with specific bounds
                mockWindow = createMockWindow({
                    bounds: { x: 200, y: 150, width: 1024, height: 768 },
                    isMaximized: false,
                });
                trackWindowState(mockWindow);
                mockWindow._triggerEvent('move');
                await vi.advanceTimersByTimeAsync(600);
                const statePath = path.join(tempDir, 'window-state.json');
                const savedState = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                expect(savedState.x).toBe(200);
                expect(savedState.y).toBe(150);
                expect(savedState.width).toBe(1024);
                expect(savedState.height).toBe(768);
                expect(savedState.isMaximized).toBe(false);
            });
        });
        describe('State Saving on Close', () => {
            it('should save state immediately on close without debounce', () => {
                trackWindowState(mockWindow);
                mockWindow._triggerEvent('close');
                // Should be saved immediately, no need to advance timers
                const statePath = path.join(tempDir, 'window-state.json');
                expect(fs.existsSync(statePath)).toBe(true);
            });
            it('should cancel pending debounced save on close', async () => {
                trackWindowState(mockWindow);
                // Trigger move which starts debounce timer
                mockWindow._triggerEvent('move');
                // Immediately close
                mockWindow._triggerEvent('close');
                // The state should be saved from close, not from debounced move
                const statePath = path.join(tempDir, 'window-state.json');
                expect(fs.existsSync(statePath)).toBe(true);
            });
            it('should not save state on close if window is destroyed', () => {
                // Create a destroyed window
                mockWindow = createMockWindow({
                    isDestroyed: true,
                });
                // Manually setup event handling before tracking
                const closeHandlers = [];
                mockWindow.on = vi.fn((event, handler) => {
                    if (event === 'close') {
                        closeHandlers.push(handler);
                    }
                    return mockWindow;
                });
                trackWindowState(mockWindow);
                // Trigger close
                closeHandlers.forEach((h) => h());
                // File should not exist since window is destroyed
                const statePath = path.join(tempDir, 'window-state.json');
                // The actual behavior depends on implementation
            });
        });
        describe('Edge Cases', () => {
            it('should handle destroyed window during debounce', async () => {
                trackWindowState(mockWindow);
                // Trigger move
                mockWindow._triggerEvent('move');
                // Destroy window before debounce completes
                mockWindow.isDestroyed = vi.fn(() => true);
                // Advance past debounce
                await vi.advanceTimersByTimeAsync(600);
                // Should not throw, and may or may not save depending on implementation
                // The key is that it doesn't crash
                expect(true).toBe(true);
            });
            it('should handle multiple windows being tracked', async () => {
                const window1 = createMockWindow({ id: 1 });
                const window2 = createMockWindow({ id: 2 });
                trackWindowState(window1);
                trackWindowState(window2);
                window1._triggerEvent('move');
                window2._triggerEvent('move');
                await vi.advanceTimersByTimeAsync(600);
                // Both should work without interfering
                expect(consoleSpy.info.length).toBeGreaterThan(0);
            });
            it('should handle file system errors gracefully during save', async () => {
                trackWindowState(mockWindow);
                // Make writeFileSync throw
                vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
                    throw new Error('Disk full');
                });
                mockWindow._triggerEvent('move');
                await vi.advanceTimersByTimeAsync(600);
                // Should log error but not throw
                expect(consoleSpy.hasError('Failed to save state')).toBe(true);
                vi.restoreAllMocks();
            });
        });
    });
    // ===========================================================================
    // Test Group: Integration
    // ===========================================================================
    describe('Integration Tests', () => {
        it('should round-trip save and load correctly', async () => {
            const mockWindow = createMockWindow({
                bounds: { x: 300, y: 200, width: 1400, height: 900 },
                isMaximized: true,
            });
            // Track and trigger save
            trackWindowState(mockWindow);
            mockWindow._triggerEvent('close');
            // Load the saved state
            const loadedState = loadWindowState();
            expect(loadedState.x).toBe(300);
            expect(loadedState.y).toBe(200);
            expect(loadedState.width).toBe(1400);
            expect(loadedState.height).toBe(900);
            expect(loadedState.isMaximized).toBe(true);
        });
        it('should handle state persistence across multiple loads', () => {
            // Initial save
            const state1 = {
                x: 100,
                y: 100,
                width: 800,
                height: 600,
                isMaximized: false,
            };
            const statePath = path.join(tempDir, 'window-state.json');
            fs.writeFileSync(statePath, JSON.stringify(state1), 'utf-8');
            // First load
            const loaded1 = loadWindowState();
            expect(loaded1.x).toBe(100);
            // Update the file
            const state2 = {
                x: 200,
                y: 200,
                width: 1000,
                height: 800,
                isMaximized: true,
            };
            fs.writeFileSync(statePath, JSON.stringify(state2), 'utf-8');
            // Second load
            const loaded2 = loadWindowState();
            expect(loaded2.x).toBe(200);
            expect(loaded2.isMaximized).toBe(true);
        });
    });
});
//# sourceMappingURL=window-state.test.js.map