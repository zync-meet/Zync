/**
 * =============================================================================
 * IPC Handlers Tests — ZYNC Desktop Application
 * =============================================================================
 *
 * Unit tests for the IPC handlers module. These tests verify that:
 *
 * 1. All IPC channels are properly registered
 * 2. Input validation works correctly
 * 3. Handlers respond with expected data
 * 4. Error conditions are handled gracefully
 * 5. Security constraints are enforced
 *
 * @module electron/tests/unit/main/ipc-handlers.test
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { describe, it, expect, beforeEach, afterEach, vi, } from 'vitest';
import { createMockWindow, createIPCMainTestDouble, captureConsole, } from '../../helpers';
// =============================================================================
// Mock Setup
// =============================================================================
/**
 * IPC Main test double for capturing handler registrations.
 */
let ipcTestDouble;
/**
 * Mock shell for external URL opening.
 */
const mockShell = {
    openExternal: vi.fn().mockResolvedValue(undefined),
    showItemInFolder: vi.fn(),
    openPath: vi.fn().mockResolvedValue(''),
};
/**
 * Mock dialog for native dialogs.
 */
const mockDialog = {
    showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: [] }),
    showSaveDialog: vi.fn().mockResolvedValue({ canceled: false }),
    showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
    showErrorBox: vi.fn(),
};
/**
 * Mock clipboard.
 */
const mockClipboard = {
    readText: vi.fn().mockReturnValue(''),
    writeText: vi.fn(),
    readHTML: vi.fn().mockReturnValue(''),
    writeHTML: vi.fn(),
    clear: vi.fn(),
};
/**
 * Mock nativeTheme.
 */
const mockNativeTheme = {
    themeSource: 'system',
    shouldUseDarkColors: false,
};
/**
 * Mock Electron modules.
 */
vi.mock('electron', () => ({
    app: {
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        getName: vi.fn().mockReturnValue('ZYNC'),
        getPath: vi.fn().mockImplementation((name) => `/mock/path/${name}`),
        isPackaged: false,
        quit: vi.fn(),
    },
    ipcMain: {
        on: vi.fn(),
        once: vi.fn(),
        handle: vi.fn(),
        handleOnce: vi.fn(),
        removeHandler: vi.fn(),
        removeListener: vi.fn(),
        removeAllListeners: vi.fn(),
    },
    shell: mockShell,
    dialog: mockDialog,
    clipboard: mockClipboard,
    nativeTheme: mockNativeTheme,
    BrowserWindow: vi.fn(),
}));
// Import after mocking
import { registerIpcHandlers } from '../../../main/ipc-handlers';
import { ipcMain, shell } from 'electron';
// =============================================================================
// Test Suite: IPC Handlers
// =============================================================================
describe('IPC Handlers', () => {
    /**
     * Mock main window for testing.
     */
    let mockWindow;
    /**
     * Mock settings window for testing.
     */
    let mockSettingsWindow;
    /**
     * Console spy for capturing log output.
     */
    let consoleSpy;
    /**
     * Set up before each test.
     */
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        // Create test double
        ipcTestDouble = createIPCMainTestDouble();
        // Replace ipcMain methods with test double
        ipcMain.on.mockImplementation(ipcTestDouble.ipcMain.on);
        ipcMain.handle.mockImplementation(ipcTestDouble.ipcMain.handle);
        ipcMain.handleOnce.mockImplementation(ipcTestDouble.ipcMain.handleOnce);
        ipcMain.removeHandler.mockImplementation(ipcTestDouble.ipcMain.removeHandler);
        // Create mock windows
        mockWindow = createMockWindow();
        mockSettingsWindow = null;
        // Capture console
        consoleSpy = captureConsole();
        // Reset mocks
        mockShell.openExternal.mockResolvedValue(undefined);
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });
        mockDialog.showSaveDialog.mockResolvedValue({ canceled: false });
        mockDialog.showMessageBox.mockResolvedValue({ response: 0 });
        mockClipboard.readText.mockReturnValue('');
        mockNativeTheme.themeSource = 'system';
        mockNativeTheme.shouldUseDarkColors = false;
    });
    /**
     * Clean up after each test.
     */
    afterEach(() => {
        // Restore console
        consoleSpy.restore();
        // Clear test double
        ipcTestDouble.clear();
    });
    // ===========================================================================
    // Test Group: Registration
    // ===========================================================================
    describe('Handler Registration', () => {
        it('should register download-platform handler', () => {
            registerIpcHandlers(mockWindow, mockSettingsWindow);
            expect(ipcMain.on).toHaveBeenCalledWith('download-platform', expect.any(Function));
        });
        it('should register multiple handlers', () => {
            registerIpcHandlers(mockWindow, mockSettingsWindow);
            // Check that multiple channels were registered
            expect(ipcMain.on.mock.calls.length).toBeGreaterThan(0);
        });
    });
    // ===========================================================================
    // Test Group: download-platform Handler
    // ===========================================================================
    describe('download-platform Handler', () => {
        beforeEach(() => {
            registerIpcHandlers(mockWindow, mockSettingsWindow);
        });
        it('should open Windows download URL for "win" platform', async () => {
            ipcTestDouble.emit('download-platform', 'win');
            expect(shell.openExternal).toHaveBeenCalledWith(expect.stringContaining('ZYNC-Setup.exe'));
        });
        it('should open macOS download URL for "mac" platform', async () => {
            ipcTestDouble.emit('download-platform', 'mac');
            expect(shell.openExternal).toHaveBeenCalledWith(expect.stringContaining('ZYNC.dmg'));
        });
        it('should open Linux download URL for "linux" platform', async () => {
            ipcTestDouble.emit('download-platform', 'linux');
            expect(shell.openExternal).toHaveBeenCalledWith(expect.stringContaining('ZYNC.AppImage'));
        });
        it('should reject invalid platform values', async () => {
            ipcTestDouble.emit('download-platform', 'invalid');
            expect(shell.openExternal).not.toHaveBeenCalled();
            expect(consoleSpy.hasWarn('Invalid platform')).toBe(true);
        });
        it('should reject empty platform value', async () => {
            ipcTestDouble.emit('download-platform', '');
            expect(shell.openExternal).not.toHaveBeenCalled();
        });
        it('should reject null platform value', async () => {
            ipcTestDouble.emit('download-platform', null);
            expect(shell.openExternal).not.toHaveBeenCalled();
        });
        it('should use GitHub releases URL', async () => {
            ipcTestDouble.emit('download-platform', 'win');
            expect(shell.openExternal).toHaveBeenCalledWith(expect.stringContaining('github.com'));
            expect(shell.openExternal).toHaveBeenCalledWith(expect.stringContaining('releases'));
        });
    });
    // ===========================================================================
    // Test Group: Input Validation
    // ===========================================================================
    describe('Input Validation', () => {
        beforeEach(() => {
            registerIpcHandlers(mockWindow, mockSettingsWindow);
        });
        describe('Platform Validation', () => {
            it('should accept lowercase platform values', async () => {
                ipcTestDouble.emit('download-platform', 'win');
                expect(shell.openExternal).toHaveBeenCalled();
            });
            it('should reject uppercase platform values', async () => {
                ipcTestDouble.emit('download-platform', 'WIN');
                expect(shell.openExternal).not.toHaveBeenCalled();
            });
            it('should reject mixed case platform values', async () => {
                ipcTestDouble.emit('download-platform', 'Win');
                expect(shell.openExternal).not.toHaveBeenCalled();
            });
            it('should reject platform with extra whitespace', async () => {
                ipcTestDouble.emit('download-platform', ' win ');
                expect(shell.openExternal).not.toHaveBeenCalled();
            });
            it('should reject similar but invalid platforms', async () => {
                const invalidPlatforms = [
                    'windows',
                    'macos',
                    'darwin',
                    'ubuntu',
                    'debian',
                    'osx',
                    'win32',
                    'win64',
                ];
                for (const platform of invalidPlatforms) {
                    vi.clearAllMocks();
                    ipcTestDouble.emit('download-platform', platform);
                    expect(shell.openExternal).not.toHaveBeenCalled();
                }
            });
        });
    });
    // ===========================================================================
    // Test Group: Security
    // ===========================================================================
    describe('Security', () => {
        beforeEach(() => {
            registerIpcHandlers(mockWindow, mockSettingsWindow);
        });
        it('should not allow arbitrary URL injection', async () => {
            // Try to inject a malicious URL
            ipcTestDouble.emit('download-platform', 'https://malicious.com/evil.exe');
            expect(shell.openExternal).not.toHaveBeenCalled();
        });
        it('should only open whitelisted URLs', async () => {
            const validPlatforms = ['win', 'mac', 'linux'];
            for (const platform of validPlatforms) {
                vi.clearAllMocks();
                ipcTestDouble.emit('download-platform', platform);
                const calledUrl = shell.openExternal.mock.calls[0]?.[0];
                if (calledUrl) {
                    // Verify it's from the expected domain
                    expect(calledUrl).toContain('github.com');
                    expect(calledUrl).toContain('ChitkulLakshya/Zync');
                }
            }
        });
        it('should not execute code from platform argument', async () => {
            // Try code injection
            const maliciousInputs = [
                '$(rm -rf /)',
                '`rm -rf /`',
                '; rm -rf /',
                '| rm -rf /',
                '&& rm -rf /',
                '<script>alert(1)</script>',
            ];
            for (const input of maliciousInputs) {
                vi.clearAllMocks();
                ipcTestDouble.emit('download-platform', input);
                expect(shell.openExternal).not.toHaveBeenCalled();
            }
        });
    });
    // ===========================================================================
    // Test Group: Error Handling
    // ===========================================================================
    describe('Error Handling', () => {
        beforeEach(() => {
            registerIpcHandlers(mockWindow, mockSettingsWindow);
        });
        it('should handle shell.openExternal failure gracefully', async () => {
            mockShell.openExternal.mockRejectedValue(new Error('Network error'));
            // Should not throw
            expect(() => {
                ipcTestDouble.emit('download-platform', 'win');
            }).not.toThrow();
        });
        it('should handle undefined event argument', async () => {
            expect(() => {
                ipcTestDouble.emit('download-platform', undefined);
            }).not.toThrow();
        });
        it('should handle object instead of string', async () => {
            expect(() => {
                ipcTestDouble.emit('download-platform', { platform: 'win' });
            }).not.toThrow();
            expect(shell.openExternal).not.toHaveBeenCalled();
        });
    });
    // ===========================================================================
    // Test Group: Window References
    // ===========================================================================
    describe('Window References', () => {
        it('should work with null settings window', () => {
            expect(() => {
                registerIpcHandlers(mockWindow, null);
            }).not.toThrow();
        });
        it('should work with both windows', () => {
            mockSettingsWindow = createMockWindow({ id: 2 });
            expect(() => {
                registerIpcHandlers(mockWindow, mockSettingsWindow);
            }).not.toThrow();
        });
    });
    // ===========================================================================
    // Test Group: Channel Naming
    // ===========================================================================
    describe('Channel Naming', () => {
        it('should use kebab-case for channel names', () => {
            registerIpcHandlers(mockWindow, null);
            const registeredChannels = [];
            ipcMain.on.mock.calls.forEach((call) => {
                registeredChannels.push(call[0]);
            });
            ipcMain.handle.mock.calls.forEach((call) => {
                registeredChannels.push(call[0]);
            });
            // All channels should be kebab-case (lowercase with hyphens)
            const kebabCaseRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*(:?[a-z0-9-]+)*$/;
            for (const channel of registeredChannels) {
                expect(channel, `Channel "${channel}" should be kebab-case`).toMatch(kebabCaseRegex);
            }
        });
    });
    // ===========================================================================
    // Test Group: Documentation Compliance
    // ===========================================================================
    describe('Documentation Compliance', () => {
        it('should have documented handlers for all registered channels', () => {
            registerIpcHandlers(mockWindow, null);
            // This test verifies that the handlers module follows its own
            // documentation standards. Each channel should have a corresponding
            // handler registered.
            const registeredOnChannels = ipcMain.on.mock.calls.map((call) => call[0]);
            const registeredHandleChannels = ipcMain.handle.mock.calls.map((call) => call[0]);
            // At minimum, download-platform should be registered
            expect(registeredOnChannels).toContain('download-platform');
        });
    });
    // ===========================================================================
    // Test Group: Valid Platforms Constant
    // ===========================================================================
    describe('Valid Platforms', () => {
        beforeEach(() => {
            registerIpcHandlers(mockWindow, null);
        });
        it('should support exactly three platforms', () => {
            const supportedPlatforms = ['win', 'mac', 'linux'];
            for (const platform of supportedPlatforms) {
                vi.clearAllMocks();
                ipcTestDouble.emit('download-platform', platform);
                expect(shell.openExternal).toHaveBeenCalled();
            }
        });
        it('should map platforms to correct file extensions', () => {
            const platformExtensions = {
                win: '.exe',
                mac: '.dmg',
                linux: '.AppImage',
            };
            for (const [platform, extension] of Object.entries(platformExtensions)) {
                vi.clearAllMocks();
                ipcTestDouble.emit('download-platform', platform);
                const calledUrl = shell.openExternal.mock.calls[0]?.[0];
                expect(calledUrl).toContain(extension);
            }
        });
    });
    // ===========================================================================
    // Test Group: Download URLs
    // ===========================================================================
    describe('Download URLs', () => {
        beforeEach(() => {
            registerIpcHandlers(mockWindow, null);
        });
        it('should use HTTPS for all download URLs', () => {
            const platforms = ['win', 'mac', 'linux'];
            for (const platform of platforms) {
                vi.clearAllMocks();
                ipcTestDouble.emit('download-platform', platform);
                const calledUrl = shell.openExternal.mock.calls[0]?.[0];
                expect(calledUrl).toMatch(/^https:\/\//);
            }
        });
        it('should point to latest release', () => {
            const platforms = ['win', 'mac', 'linux'];
            for (const platform of platforms) {
                vi.clearAllMocks();
                ipcTestDouble.emit('download-platform', platform);
                const calledUrl = shell.openExternal.mock.calls[0]?.[0];
                expect(calledUrl).toContain('/releases/latest/download/');
            }
        });
        it('should use correct repository path', () => {
            ipcTestDouble.emit('download-platform', 'win');
            const calledUrl = shell.openExternal.mock.calls[0]?.[0];
            expect(calledUrl).toContain('ChitkulLakshya/Zync');
        });
    });
});
// =============================================================================
// Additional Test Utilities
// =============================================================================
/**
 * Helper to create mock IPC event.
 */
function createMockIPCMainEvent() {
    return {
        sender: {
            send: vi.fn(),
        },
        reply: vi.fn(),
        returnValue: undefined,
        preventDefault: vi.fn(),
        frameId: 1,
        processId: 1,
    };
}
//# sourceMappingURL=ipc-handlers.test.js.map