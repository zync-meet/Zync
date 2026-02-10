/**
 * =============================================================================
 * System Tray Tests — ZYNC Desktop Application
 * =============================================================================
 *
 * Unit tests for the system tray manager module. These tests verify that:
 *
 * 1. The tray icon is correctly created with proper icon
 * 2. Tooltip is set with app name and version
 * 3. Context menu is built with correct items
 * 4. Click handlers toggle window visibility
 * 5. Platform-specific behavior is handled correctly
 *
 * @module electron/tests/unit/main/tray.test
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { describe, it, expect, beforeEach, afterEach, vi, } from 'vitest';
import { createMockWindow, createMockTray, captureConsole, } from '../../helpers';
// =============================================================================
// Mock Setup
// =============================================================================
/**
 * Stores for tracking mock behavior.
 */
let createdTrayIcon = null;
let lastContextMenuTemplate = [];
let mockTrayInstance = null;
/**
 * Mock nativeImage module.
 */
const mockNativeImage = {
    createFromPath: vi.fn((iconPath) => ({
        isEmpty: vi.fn().mockReturnValue(false),
        resize: vi.fn().mockReturnValue({
            isEmpty: vi.fn().mockReturnValue(false),
            getSize: vi.fn().mockReturnValue({ width: 16, height: 16 }),
        }),
        getSize: vi.fn().mockReturnValue({ width: 32, height: 32 }),
    })),
    createEmpty: vi.fn(() => ({
        isEmpty: vi.fn().mockReturnValue(true),
        resize: vi.fn().mockReturnThis(),
        getSize: vi.fn().mockReturnValue({ width: 16, height: 16 }),
    })),
};
/**
 * Mock Menu module.
 */
const mockMenu = {
    buildFromTemplate: vi.fn((template) => {
        lastContextMenuTemplate = template;
        return { items: template, popup: vi.fn() };
    }),
};
/**
 * Mock Tray constructor.
 */
const MockTrayConstructor = vi.fn((icon) => {
    createdTrayIcon = icon;
    mockTrayInstance = createMockTray(icon);
    return mockTrayInstance;
});
/**
 * Mock Electron modules.
 */
vi.mock('electron', () => ({
    app: {
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        getName: vi.fn().mockReturnValue('ZYNC'),
        quit: vi.fn(),
        isPackaged: false,
    },
    Tray: MockTrayConstructor,
    Menu: mockMenu,
    nativeImage: mockNativeImage,
    BrowserWindow: vi.fn(),
}));
// Import after mocking
import { createSystemTray } from '../../../main/tray';
import { app, Menu, nativeImage } from 'electron';
// =============================================================================
// Test Helpers
// =============================================================================
/**
 * Finds a context menu item by label.
 */
function findContextMenuItem(label) {
    return lastContextMenuTemplate.find((item) => item.label === label);
}
/**
 * Gets click handlers attached to the tray instance.
 */
function getTrayClickHandler() {
    if (!mockTrayInstance)
        return undefined;
    // Find the 'click' event handler
    const onCalls = mockTrayInstance.on.mock.calls;
    const clickCall = onCalls.find((call) => call[0] === 'click');
    return clickCall?.[1];
}
/**
 * Gets double-click handlers attached to the tray instance.
 */
function getTrayDoubleClickHandler() {
    if (!mockTrayInstance)
        return undefined;
    const onCalls = mockTrayInstance.on.mock.calls;
    const dblClickCall = onCalls.find((call) => call[0] === 'double-click');
    return dblClickCall?.[1];
}
// =============================================================================
// Test Suite: System Tray
// =============================================================================
describe('System Tray Manager', () => {
    /**
     * Mock main window for testing.
     */
    let mockWindow;
    /**
     * Console spy for capturing log output.
     */
    let consoleSpy;
    /**
     * Original platform value.
     */
    let originalPlatform;
    /**
     * Set up before each test.
     */
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        createdTrayIcon = null;
        lastContextMenuTemplate = [];
        mockTrayInstance = null;
        // Create mock window
        mockWindow = createMockWindow({
            isVisible: true,
        });
        // Capture console
        consoleSpy = captureConsole();
        // Save original platform
        originalPlatform = process.platform;
        // Reset app mock
        app.isPackaged = false;
    });
    /**
     * Clean up after each test.
     */
    afterEach(() => {
        // Restore console
        consoleSpy.restore();
        // Restore platform
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
        });
    });
    // ===========================================================================
    // Test Group: Tray Creation
    // ===========================================================================
    describe('Tray Creation', () => {
        it('should create a Tray instance', () => {
            const tray = createSystemTray(mockWindow);
            expect(tray).toBeDefined();
            expect(MockTrayConstructor).toHaveBeenCalled();
        });
        it('should create tray with an icon', () => {
            createSystemTray(mockWindow);
            expect(nativeImage.createFromPath).toHaveBeenCalled();
            expect(createdTrayIcon).toBeDefined();
        });
        it('should resize icon to 16x16 pixels', () => {
            createSystemTray(mockWindow);
            // The resize method should be called
            const createFromPathCalls = mockNativeImage.createFromPath.mock.results;
            if (createFromPathCalls.length > 0) {
                const icon = createFromPathCalls[0].value;
                expect(icon.resize).toHaveBeenCalledWith({ width: 16, height: 16 });
            }
        });
        it('should log info message when tray is created', () => {
            createSystemTray(mockWindow);
            expect(consoleSpy.hasInfo('System tray created')).toBe(true);
        });
    });
    // ===========================================================================
    // Test Group: Icon Selection
    // ===========================================================================
    describe('Icon Selection', () => {
        describe('macOS', () => {
            beforeEach(() => {
                Object.defineProperty(process, 'platform', {
                    value: 'darwin',
                });
            });
            it('should use Template icon on macOS', () => {
                createSystemTray(mockWindow);
                const iconPath = mockNativeImage.createFromPath.mock.calls[0][0];
                expect(iconPath).toContain('Template');
            });
            it('should use tray-icon-Template.png on macOS', () => {
                createSystemTray(mockWindow);
                const iconPath = mockNativeImage.createFromPath.mock.calls[0][0];
                expect(iconPath).toContain('tray-icon-Template.png');
            });
        });
        describe('Windows', () => {
            beforeEach(() => {
                Object.defineProperty(process, 'platform', {
                    value: 'win32',
                });
            });
            it('should use standard icon on Windows', () => {
                createSystemTray(mockWindow);
                const iconPath = mockNativeImage.createFromPath.mock.calls[0][0];
                expect(iconPath).not.toContain('Template');
            });
            it('should use tray-icon.png on Windows', () => {
                createSystemTray(mockWindow);
                const iconPath = mockNativeImage.createFromPath.mock.calls[0][0];
                expect(iconPath).toContain('tray-icon.png');
            });
        });
        describe('Linux', () => {
            beforeEach(() => {
                Object.defineProperty(process, 'platform', {
                    value: 'linux',
                });
            });
            it('should use standard icon on Linux', () => {
                createSystemTray(mockWindow);
                const iconPath = mockNativeImage.createFromPath.mock.calls[0][0];
                expect(iconPath).toContain('tray-icon.png');
            });
        });
        describe('Fallback Icon', () => {
            it('should use empty icon as fallback when file not found', () => {
                // Make createFromPath throw an error
                mockNativeImage.createFromPath.mockImplementationOnce(() => {
                    throw new Error('File not found');
                });
                createSystemTray(mockWindow);
                expect(mockNativeImage.createEmpty).toHaveBeenCalled();
            });
            it('should log warning when using fallback icon', () => {
                mockNativeImage.createFromPath.mockImplementationOnce(() => {
                    throw new Error('File not found');
                });
                createSystemTray(mockWindow);
                expect(consoleSpy.hasWarn('Icon not found')).toBe(true);
            });
        });
    });
    // ===========================================================================
    // Test Group: Tooltip
    // ===========================================================================
    describe('Tooltip', () => {
        it('should set tooltip with app name', () => {
            createSystemTray(mockWindow);
            expect(mockTrayInstance?.setToolTip).toHaveBeenCalledWith(expect.stringContaining('ZYNC'));
        });
        it('should set tooltip with app version', () => {
            createSystemTray(mockWindow);
            expect(mockTrayInstance?.setToolTip).toHaveBeenCalledWith(expect.stringContaining('v1.0.0'));
        });
        it('should format tooltip as "ZYNC v{version}"', () => {
            createSystemTray(mockWindow);
            expect(mockTrayInstance?.setToolTip).toHaveBeenCalledWith('ZYNC v1.0.0');
        });
    });
    // ===========================================================================
    // Test Group: Context Menu
    // ===========================================================================
    describe('Context Menu', () => {
        it('should set context menu on tray', () => {
            createSystemTray(mockWindow);
            expect(mockTrayInstance?.setContextMenu).toHaveBeenCalled();
            expect(Menu.buildFromTemplate).toHaveBeenCalled();
        });
        it('should include Show ZYNC item', () => {
            createSystemTray(mockWindow);
            const showItem = findContextMenuItem('Show ZYNC');
            expect(showItem).toBeDefined();
        });
        it('should include Settings item', () => {
            createSystemTray(mockWindow);
            const settingsItem = findContextMenuItem('Settings');
            expect(settingsItem).toBeDefined();
        });
        it('should include Check for Updates item', () => {
            createSystemTray(mockWindow);
            const updateItem = findContextMenuItem('Check for Updates');
            expect(updateItem).toBeDefined();
        });
        it('should include About item with version', () => {
            createSystemTray(mockWindow);
            const aboutItem = lastContextMenuTemplate.find((item) => item.label?.includes('About ZYNC v'));
            expect(aboutItem).toBeDefined();
            expect(aboutItem?.label).toContain('v1.0.0');
        });
        it('should have About item disabled (display only)', () => {
            createSystemTray(mockWindow);
            const aboutItem = lastContextMenuTemplate.find((item) => item.label?.includes('About ZYNC v'));
            expect(aboutItem?.enabled).toBe(false);
        });
        it('should include Quit item', () => {
            createSystemTray(mockWindow);
            const quitItem = findContextMenuItem('Quit ZYNC');
            expect(quitItem).toBeDefined();
        });
        it('should have separators between menu groups', () => {
            createSystemTray(mockWindow);
            const separators = lastContextMenuTemplate.filter((item) => item.type === 'separator');
            expect(separators.length).toBeGreaterThan(0);
        });
    });
    // ===========================================================================
    // Test Group: Context Menu Click Handlers
    // ===========================================================================
    describe('Context Menu Click Handlers', () => {
        describe('Show ZYNC', () => {
            it('should show and focus window when clicked', () => {
                createSystemTray(mockWindow);
                const showItem = findContextMenuItem('Show ZYNC');
                showItem?.click?.({}, undefined, {});
                expect(mockWindow.show).toHaveBeenCalled();
                expect(mockWindow.focus).toHaveBeenCalled();
            });
            it('should not throw when window is destroyed', () => {
                mockWindow.isDestroyed = vi.fn().mockReturnValue(true);
                createSystemTray(mockWindow);
                const showItem = findContextMenuItem('Show ZYNC');
                expect(() => {
                    showItem?.click?.({}, undefined, {});
                }).not.toThrow();
            });
        });
        describe('Settings', () => {
            it('should send IPC message to open settings', () => {
                createSystemTray(mockWindow);
                const settingsItem = findContextMenuItem('Settings');
                settingsItem?.click?.({}, undefined, {});
                expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
                    action: 'open-settings',
                });
            });
            it('should show window when Settings clicked', () => {
                createSystemTray(mockWindow);
                const settingsItem = findContextMenuItem('Settings');
                settingsItem?.click?.({}, undefined, {});
                expect(mockWindow.show).toHaveBeenCalled();
            });
        });
        describe('Check for Updates', () => {
            it('should send IPC message to check updates', () => {
                createSystemTray(mockWindow);
                const updateItem = findContextMenuItem('Check for Updates');
                updateItem?.click?.({}, undefined, {});
                expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
                    action: 'check-updates',
                });
            });
        });
        describe('Quit ZYNC', () => {
            it('should call app.quit when clicked', () => {
                createSystemTray(mockWindow);
                const quitItem = findContextMenuItem('Quit ZYNC');
                quitItem?.click?.({}, undefined, {});
                expect(app.quit).toHaveBeenCalled();
            });
        });
    });
    // ===========================================================================
    // Test Group: Tray Click Events
    // ===========================================================================
    describe('Tray Click Events', () => {
        describe('Single Click', () => {
            it('should attach click event handler', () => {
                createSystemTray(mockWindow);
                expect(mockTrayInstance?.on).toHaveBeenCalledWith('click', expect.any(Function));
            });
            it('should hide visible window on click', () => {
                mockWindow.isVisible = vi.fn().mockReturnValue(true);
                createSystemTray(mockWindow);
                const clickHandler = getTrayClickHandler();
                clickHandler?.();
                expect(mockWindow.hide).toHaveBeenCalled();
            });
            it('should show and focus hidden window on click', () => {
                mockWindow.isVisible = vi.fn().mockReturnValue(false);
                createSystemTray(mockWindow);
                const clickHandler = getTrayClickHandler();
                clickHandler?.();
                expect(mockWindow.show).toHaveBeenCalled();
                expect(mockWindow.focus).toHaveBeenCalled();
            });
            it('should toggle window visibility on successive clicks', () => {
                let visible = true;
                mockWindow.isVisible = vi.fn(() => visible);
                mockWindow.show = vi.fn(() => { visible = true; });
                mockWindow.hide = vi.fn(() => { visible = false; });
                createSystemTray(mockWindow);
                const clickHandler = getTrayClickHandler();
                // First click: hide (window is visible)
                clickHandler?.();
                expect(mockWindow.hide).toHaveBeenCalled();
                // Second click: show (window is hidden)
                clickHandler?.();
                expect(mockWindow.show).toHaveBeenCalled();
            });
            it('should not throw when window is destroyed', () => {
                mockWindow.isDestroyed = vi.fn().mockReturnValue(true);
                createSystemTray(mockWindow);
                const clickHandler = getTrayClickHandler();
                expect(() => {
                    clickHandler?.();
                }).not.toThrow();
            });
        });
        describe('Double Click', () => {
            it('should attach double-click event handler', () => {
                createSystemTray(mockWindow);
                expect(mockTrayInstance?.on).toHaveBeenCalledWith('double-click', expect.any(Function));
            });
            it('should always show and focus window on double-click', () => {
                mockWindow.isVisible = vi.fn().mockReturnValue(false);
                createSystemTray(mockWindow);
                const dblClickHandler = getTrayDoubleClickHandler();
                dblClickHandler?.();
                expect(mockWindow.show).toHaveBeenCalled();
                expect(mockWindow.focus).toHaveBeenCalled();
            });
            it('should show and focus even if window is already visible', () => {
                mockWindow.isVisible = vi.fn().mockReturnValue(true);
                createSystemTray(mockWindow);
                const dblClickHandler = getTrayDoubleClickHandler();
                dblClickHandler?.();
                expect(mockWindow.show).toHaveBeenCalled();
                expect(mockWindow.focus).toHaveBeenCalled();
            });
            it('should not throw when window is destroyed', () => {
                mockWindow.isDestroyed = vi.fn().mockReturnValue(true);
                createSystemTray(mockWindow);
                const dblClickHandler = getTrayDoubleClickHandler();
                expect(() => {
                    dblClickHandler?.();
                }).not.toThrow();
            });
        });
    });
    // ===========================================================================
    // Test Group: Packaged App
    // ===========================================================================
    describe('Packaged App', () => {
        beforeEach(() => {
            app.isPackaged = true;
        });
        it('should use resourcesPath for icon in packaged app', () => {
            // Set process.resourcesPath
            const originalResourcesPath = process.resourcesPath;
            Object.defineProperty(process, 'resourcesPath', {
                value: '/path/to/resources',
                writable: true,
            });
            createSystemTray(mockWindow);
            const iconPath = mockNativeImage.createFromPath.mock.calls[0][0];
            expect(iconPath).toContain('resources');
            // Restore
            Object.defineProperty(process, 'resourcesPath', {
                value: originalResourcesPath,
                writable: true,
            });
        });
    });
    // ===========================================================================
    // Test Group: Return Value
    // ===========================================================================
    describe('Return Value', () => {
        it('should return the created Tray instance', () => {
            const tray = createSystemTray(mockWindow);
            expect(tray).toBe(mockTrayInstance);
        });
        it('should return a Tray with event handlers attached', () => {
            const tray = createSystemTray(mockWindow);
            // Verify event handlers are attached
            expect(mockTrayInstance?.on).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockTrayInstance?.on).toHaveBeenCalledWith('double-click', expect.any(Function));
        });
    });
    // ===========================================================================
    // Test Group: Edge Cases
    // ===========================================================================
    describe('Edge Cases', () => {
        it('should handle null window gracefully', () => {
            // TypeScript won't allow this, but test runtime behavior
            expect(() => {
                createSystemTray(null);
            }).not.toThrow();
        });
        it('should handle window becoming destroyed after tray creation', () => {
            createSystemTray(mockWindow);
            // Window becomes destroyed
            mockWindow.isDestroyed = vi.fn().mockReturnValue(true);
            // Tray click should not throw
            const clickHandler = getTrayClickHandler();
            expect(() => clickHandler?.()).not.toThrow();
            // Context menu clicks should not throw
            const showItem = findContextMenuItem('Show ZYNC');
            expect(() => showItem?.click?.({}, undefined, {})).not.toThrow();
        });
        it('should handle rapid successive clicks', () => {
            let visible = true;
            mockWindow.isVisible = vi.fn(() => visible);
            mockWindow.show = vi.fn(() => { visible = true; });
            mockWindow.hide = vi.fn(() => { visible = false; });
            createSystemTray(mockWindow);
            const clickHandler = getTrayClickHandler();
            // Rapid clicks
            for (let i = 0; i < 10; i++) {
                clickHandler?.();
            }
            // Should not throw and should have toggled
            expect(mockWindow.show.mock.calls.length + mockWindow.hide.mock.calls.length).toBe(10);
        });
    });
});
//# sourceMappingURL=tray.test.js.map