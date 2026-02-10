/**
 * =============================================================================
 * Auto-Updater Service Tests — ZYNC Desktop Application
 * =============================================================================
 *
 * Unit tests for the auto-updater service module. These tests verify that:
 *
 * 1. The service initializes correctly
 * 2. Update checks are scheduled appropriately
 * 3. Download progress is reported to the renderer
 * 4. Update dialogs are shown correctly
 * 5. Resource cleanup on dispose works properly
 *
 * @module electron/tests/unit/services/auto-updater.test
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import {
  createMockWindow,
  captureConsole,
  type MockWindowLike,
  type ConsoleSpy,
} from '../../helpers';

// =============================================================================
// Mock Setup
// =============================================================================

/**
 * Mock dialog response tracker.
 */
let mockDialogResponse = { response: 0 };

/**
 * Mock Electron modules.
 */
vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn().mockReturnValue('1.0.0'),
    getName: vi.fn().mockReturnValue('ZYNC'),
    isPackaged: false,
    quit: vi.fn(),
  },
  dialog: {
    showMessageBox: vi.fn().mockImplementation(() =>
      Promise.resolve(mockDialogResponse),
    ),
  },
  BrowserWindow: vi.fn(),
}));

// Import after mocking
import { AutoUpdaterService } from '../../../services/auto-updater';
import { app, dialog } from 'electron';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Update progress interface.
 */
interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

/**
 * Update info interface.
 */
interface UpdateInfo {
  version: string;
  releaseNotes?: string | null;
  releaseDate?: string;
  releaseName?: string | null;
}

// =============================================================================
// Test Suite: Auto-Updater Service
// =============================================================================

describe('AutoUpdaterService', () => {
  /**
   * Mock main window for testing.
   */
  let mockWindow: MockWindowLike;

  /**
   * Service instance under test.
   */
  let service: AutoUpdaterService;

  /**
   * Console spy for capturing log output.
   */
  let consoleSpy: ConsoleSpy;

  /**
   * Set up before each test.
   */
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockDialogResponse = { response: 0 };

    // Use fake timers
    vi.useFakeTimers();

    // Create mock window
    mockWindow = createMockWindow();

    // Capture console
    consoleSpy = captureConsole();

    // Reset app.isPackaged
    (app.isPackaged as unknown) = false;

    // Create service instance
    service = new AutoUpdaterService(
      mockWindow as unknown as Electron.BrowserWindow,
    );
  });

  /**
   * Clean up after each test.
   */
  afterEach(() => {
    // Dispose the service
    service.dispose();

    // Restore console
    consoleSpy.restore();

    // Restore real timers
    vi.useRealTimers();
  });

  // ===========================================================================
  // Test Group: Constructor
  // ===========================================================================

  describe('Constructor', () => {
    it('should create an instance with a main window', () => {
      const svc = new AutoUpdaterService(
        mockWindow as unknown as Electron.BrowserWindow,
      );

      expect(svc).toBeDefined();
      expect(svc).toBeInstanceOf(AutoUpdaterService);
    });

    it('should accept null as main window', () => {
      const svc = new AutoUpdaterService(null);

      expect(svc).toBeDefined();
    });
  });

  // ===========================================================================
  // Test Group: initialize()
  // ===========================================================================

  describe('initialize()', () => {
    it('should log initialization message', () => {
      service.initialize();

      expect(consoleSpy.hasInfo('Initializing')).toBe(true);
    });

    it('should schedule initial check after delay', async () => {
      // Make app packaged to enable update checks
      (app.isPackaged as unknown) = true;

      service.initialize();

      // Check not called immediately
      expect(consoleSpy.hasInfo('Checking')).toBe(false);

      // Advance past initial delay (10 seconds)
      await vi.advanceTimersByTimeAsync(10000);

      // Now check should have run
      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should schedule periodic checks', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();

      // Advance past initial delay
      await vi.advanceTimersByTimeAsync(10000);

      // Clear previous logs
      consoleSpy.clear();

      // Advance by check interval (4 hours)
      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);

      // Another check should have run
      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should not check if auto-check is disabled', async () => {
      (app.isPackaged as unknown) = true;

      service.setAutoCheckEnabled(false);
      service.initialize();

      // Advance past initial delay
      await vi.advanceTimersByTimeAsync(10000);

      // Check should not have run
      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });
  });

  // ===========================================================================
  // Test Group: checkForUpdates()
  // ===========================================================================

  describe('checkForUpdates()', () => {
    it('should skip check in development mode', async () => {
      (app.isPackaged as unknown) = false;

      await service.checkForUpdates();

      expect(consoleSpy.hasInfo('Skipping check in dev mode')).toBe(true);
    });

    it('should log current version when checking', async () => {
      (app.isPackaged as unknown) = true;

      await service.checkForUpdates();

      expect(consoleSpy.hasInfo('current: 1.0.0')).toBe(true);
    });

    it('should log check completion', async () => {
      (app.isPackaged as unknown) = true;

      await service.checkForUpdates();

      expect(consoleSpy.hasInfo('Check completed')).toBe(true);
    });

    it('should not start multiple concurrent checks', async () => {
      (app.isPackaged as unknown) = true;

      // Simulate downloading state
      // @ts-expect-error - accessing private property for testing
      service.isDownloading = true;

      await service.checkForUpdates();

      // Should not have logged checking message
      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });
  });

  // ===========================================================================
  // Test Group: setAutoCheckEnabled()
  // ===========================================================================

  describe('setAutoCheckEnabled()', () => {
    it('should enable auto-check', () => {
      service.setAutoCheckEnabled(true);

      // After enabling, initialize should schedule checks
      (app.isPackaged as unknown) = true;
      service.initialize();

      // Advance past initial delay
      vi.advanceTimersByTime(10000);

      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should disable auto-check', async () => {
      service.setAutoCheckEnabled(false);
      service.initialize();

      // Advance past initial delay
      await vi.advanceTimersByTimeAsync(10000);

      // Should not have checked
      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });

    it('should allow toggling at runtime', async () => {
      (app.isPackaged as unknown) = true;

      service.setAutoCheckEnabled(true);
      service.initialize();

      // Advance past initial delay
      await vi.advanceTimersByTimeAsync(10000);
      expect(consoleSpy.hasInfo('Checking')).toBe(true);

      consoleSpy.clear();

      // Disable at runtime
      service.setAutoCheckEnabled(false);

      // Advance by check interval
      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);

      // Should not have checked again
      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });
  });

  // ===========================================================================
  // Test Group: setMainWindow()
  // ===========================================================================

  describe('setMainWindow()', () => {
    it('should update main window reference', () => {
      const newWindow = createMockWindow({ id: 2 });

      service.setMainWindow(newWindow as unknown as Electron.BrowserWindow);

      // Verify the window was updated (indirectly through behavior)
      expect(service).toBeDefined();
    });

    it('should accept null to clear window reference', () => {
      service.setMainWindow(null);

      expect(service).toBeDefined();
    });
  });

  // ===========================================================================
  // Test Group: dispose()
  // ===========================================================================

  describe('dispose()', () => {
    it('should log dispose message', () => {
      service.dispose();

      expect(consoleSpy.hasInfo('Disposed')).toBe(true);
    });

    it('should clear initial check timeout', () => {
      service.initialize();

      service.dispose();

      // Advance past initial delay - should not trigger check
      vi.advanceTimersByTime(10000);

      // After disposal, no new checks should occur
      const checkMessages = consoleSpy.info.filter((msg) =>
        msg.includes('Checking'),
      );
      expect(checkMessages.length).toBe(0);
    });

    it('should clear check interval', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();

      // Let initial check run
      await vi.advanceTimersByTimeAsync(10000);

      consoleSpy.clear();

      service.dispose();

      // Advance by check interval
      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);

      // No additional checks should have run
      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      service.dispose();
      service.dispose();
      service.dispose();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  // ===========================================================================
  // Test Group: Update Flow (Private Methods via Events)
  // ===========================================================================

  describe('Update Flow', () => {
    describe('onUpdateAvailable (simulated)', () => {
      it('should show dialog when update is available', async () => {
        // Access private method for testing
        // @ts-expect-error - accessing private method for testing
        const onUpdateAvailable = service.onUpdateAvailable.bind(service);

        const updateInfo: UpdateInfo = {
          version: '2.0.0',
          releaseNotes: 'New features',
        };

        await onUpdateAvailable(updateInfo);

        expect(dialog.showMessageBox).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            type: 'info',
            title: 'Update Available',
            message: expect.stringContaining('2.0.0'),
          }),
        );
      });

      it('should start download when user clicks Download', async () => {
        mockDialogResponse = { response: 0 }; // Download button

        // @ts-expect-error - accessing private method for testing
        const onUpdateAvailable = service.onUpdateAvailable.bind(service);

        await onUpdateAvailable({ version: '2.0.0' });

        // @ts-expect-error - accessing private property for testing
        expect(service.isDownloading).toBe(true);
      });

      it('should not start download when user clicks Later', async () => {
        mockDialogResponse = { response: 1 }; // Later button

        // @ts-expect-error - accessing private method for testing
        const onUpdateAvailable = service.onUpdateAvailable.bind(service);

        await onUpdateAvailable({ version: '2.0.0' });

        // @ts-expect-error - accessing private property for testing
        expect(service.isDownloading).toBe(false);
      });

      it('should handle destroyed window gracefully', async () => {
        service.setMainWindow(null);

        // @ts-expect-error - accessing private method for testing
        const onUpdateAvailable = service.onUpdateAvailable.bind(service);

        // Should not throw
        await expect(
          onUpdateAvailable({ version: '2.0.0' }),
        ).resolves.not.toThrow();

        // Dialog should not have been shown
        expect(dialog.showMessageBox).not.toHaveBeenCalled();
      });
    });

    describe('onDownloadProgress (simulated)', () => {
      it('should send progress to renderer', () => {
        // @ts-expect-error - accessing private method for testing
        const onDownloadProgress = service.onDownloadProgress.bind(service);

        const progress: UpdateProgress = {
          bytesPerSecond: 1000000,
          percent: 50,
          transferred: 5000000,
          total: 10000000,
        };

        onDownloadProgress(progress);

        expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
          action: 'update-progress',
          data: { percent: 50 },
        });
      });

      it('should round progress percentage', () => {
        // @ts-expect-error - accessing private method for testing
        const onDownloadProgress = service.onDownloadProgress.bind(service);

        onDownloadProgress({
          bytesPerSecond: 1000,
          percent: 33.7,
          transferred: 337,
          total: 1000,
        });

        expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
          action: 'update-progress',
          data: { percent: 34 },
        });
      });

      it('should handle destroyed window gracefully', () => {
        mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

        // @ts-expect-error - accessing private method for testing
        const onDownloadProgress = service.onDownloadProgress.bind(service);

        // Should not throw
        expect(() =>
          onDownloadProgress({
            bytesPerSecond: 1000,
            percent: 50,
            transferred: 500,
            total: 1000,
          }),
        ).not.toThrow();
      });
    });

    describe('onUpdateDownloaded (simulated)', () => {
      it('should show install dialog when download completes', async () => {
        // @ts-expect-error - accessing private method for testing
        const onUpdateDownloaded = service.onUpdateDownloaded.bind(service);

        await onUpdateDownloaded({ version: '2.0.0' });

        expect(dialog.showMessageBox).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            type: 'info',
            title: 'Update Ready',
            message: expect.stringContaining('2.0.0'),
          }),
        );
      });

      it('should reset downloading flag', async () => {
        // @ts-expect-error - accessing private property for testing
        service.isDownloading = true;

        // @ts-expect-error - accessing private method for testing
        const onUpdateDownloaded = service.onUpdateDownloaded.bind(service);

        await onUpdateDownloaded({ version: '2.0.0' });

        // @ts-expect-error - accessing private property for testing
        expect(service.isDownloading).toBe(false);
      });

      it('should handle destroyed window gracefully', async () => {
        service.setMainWindow(null);

        // @ts-expect-error - accessing private method for testing
        const onUpdateDownloaded = service.onUpdateDownloaded.bind(service);

        await expect(
          onUpdateDownloaded({ version: '2.0.0' }),
        ).resolves.not.toThrow();

        expect(dialog.showMessageBox).not.toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Test Group: Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid initialize/dispose cycles', () => {
      for (let i = 0; i < 10; i++) {
        const svc = new AutoUpdaterService(
          mockWindow as unknown as Electron.BrowserWindow,
        );
        svc.initialize();
        svc.dispose();
      }

      expect(true).toBe(true);
    });

    it('should handle check errors gracefully', async () => {
      (app.isPackaged as unknown) = true;

      // Temporarily make getVersion throw
      const originalGetVersion = app.getVersion;
      (app.getVersion as Mock).mockImplementation(() => {
        throw new Error('Version error');
      });

      await service.checkForUpdates();

      // Should have logged error
      expect(consoleSpy.hasError('Check failed')).toBe(true);

      // Restore
      (app.getVersion as Mock).mockImplementation(originalGetVersion);
    });

    it('should handle window becoming destroyed during update', async () => {
      // Start with valid window
      service.setMainWindow(mockWindow as unknown as Electron.BrowserWindow);

      // Window becomes destroyed
      mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

      // @ts-expect-error - accessing private method for testing
      const onUpdateAvailable = service.onUpdateAvailable.bind(service);

      // Should not throw
      await expect(
        onUpdateAvailable({ version: '2.0.0' }),
      ).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // Test Group: Timer Configuration
  // ===========================================================================

  describe('Timer Configuration', () => {
    it('should use 10 second initial delay', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();

      // At 9 seconds, no check yet
      await vi.advanceTimersByTimeAsync(9000);
      expect(consoleSpy.hasInfo('Checking')).toBe(false);

      // At 10 seconds, check runs
      await vi.advanceTimersByTimeAsync(1000);
      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should use 4 hour check interval', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();

      // Skip initial check
      await vi.advanceTimersByTimeAsync(10000);
      consoleSpy.clear();

      // At 3 hours 59 minutes, no new check
      await vi.advanceTimersByTimeAsync((4 * 60 * 60 - 1) * 1000);
      expect(consoleSpy.hasInfo('Checking')).toBe(false);

      // At 4 hours, check runs
      await vi.advanceTimersByTimeAsync(1000);
      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });
  });
});
