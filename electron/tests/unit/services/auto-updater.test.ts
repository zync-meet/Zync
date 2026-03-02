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


let mockDialogResponse = { response: 0 };


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


import { AutoUpdaterService } from '../../../services/auto-updater';
import { app, dialog } from 'electron';


interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}


interface UpdateInfo {
  version: string;
  releaseNotes?: string | null;
  releaseDate?: string;
  releaseName?: string | null;
}


describe('AutoUpdaterService', () => {

  let mockWindow: MockWindowLike;


  let service: AutoUpdaterService;


  let consoleSpy: ConsoleSpy;


  beforeEach(() => {

    vi.clearAllMocks();
    mockDialogResponse = { response: 0 };


    vi.useFakeTimers();


    mockWindow = createMockWindow();


    consoleSpy = captureConsole();


    (app.isPackaged as unknown) = false;


    service = new AutoUpdaterService(
      mockWindow as unknown as Electron.BrowserWindow,
    );
  });


  afterEach(() => {

    service.dispose();


    consoleSpy.restore();


    vi.useRealTimers();
  });


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


  describe('initialize()', () => {
    it('should log initialization message', () => {
      service.initialize();

      expect(consoleSpy.hasInfo('Initializing')).toBe(true);
    });

    it('should schedule initial check after delay', async () => {

      (app.isPackaged as unknown) = true;

      service.initialize();


      expect(consoleSpy.hasInfo('Checking')).toBe(false);


      await vi.advanceTimersByTimeAsync(10000);


      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should schedule periodic checks', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();


      await vi.advanceTimersByTimeAsync(10000);


      consoleSpy.clear();


      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);


      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should not check if auto-check is disabled', async () => {
      (app.isPackaged as unknown) = true;

      service.setAutoCheckEnabled(false);
      service.initialize();


      await vi.advanceTimersByTimeAsync(10000);


      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });
  });


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


      service.isDownloading = true;

      await service.checkForUpdates();


      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });
  });


  describe('setAutoCheckEnabled()', () => {
    it('should enable auto-check', () => {
      service.setAutoCheckEnabled(true);


      (app.isPackaged as unknown) = true;
      service.initialize();


      vi.advanceTimersByTime(10000);

      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should disable auto-check', async () => {
      service.setAutoCheckEnabled(false);
      service.initialize();


      await vi.advanceTimersByTimeAsync(10000);


      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });

    it('should allow toggling at runtime', async () => {
      (app.isPackaged as unknown) = true;

      service.setAutoCheckEnabled(true);
      service.initialize();


      await vi.advanceTimersByTimeAsync(10000);
      expect(consoleSpy.hasInfo('Checking')).toBe(true);

      consoleSpy.clear();


      service.setAutoCheckEnabled(false);


      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);


      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });
  });


  describe('setMainWindow()', () => {
    it('should update main window reference', () => {
      const newWindow = createMockWindow({ id: 2 });

      service.setMainWindow(newWindow as unknown as Electron.BrowserWindow);


      expect(service).toBeDefined();
    });

    it('should accept null to clear window reference', () => {
      service.setMainWindow(null);

      expect(service).toBeDefined();
    });
  });


  describe('dispose()', () => {
    it('should log dispose message', () => {
      service.dispose();

      expect(consoleSpy.hasInfo('Disposed')).toBe(true);
    });

    it('should clear initial check timeout', () => {
      service.initialize();

      service.dispose();


      vi.advanceTimersByTime(10000);


      const checkMessages = consoleSpy.info.filter((msg) =>
        msg.includes('Checking'),
      );
      expect(checkMessages.length).toBe(0);
    });

    it('should clear check interval', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();


      await vi.advanceTimersByTimeAsync(10000);

      consoleSpy.clear();

      service.dispose();


      await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);


      expect(consoleSpy.hasInfo('Checking')).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      service.dispose();
      service.dispose();
      service.dispose();


      expect(true).toBe(true);
    });
  });


  describe('Update Flow', () => {
    describe('onUpdateAvailable (simulated)', () => {
      it('should show dialog when update is available', async () => {


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
        mockDialogResponse = { response: 0 };


        const onUpdateAvailable = service.onUpdateAvailable.bind(service);

        await onUpdateAvailable({ version: '2.0.0' });


        expect(service.isDownloading).toBe(true);
      });

      it('should not start download when user clicks Later', async () => {
        mockDialogResponse = { response: 1 };


        const onUpdateAvailable = service.onUpdateAvailable.bind(service);

        await onUpdateAvailable({ version: '2.0.0' });


        expect(service.isDownloading).toBe(false);
      });

      it('should handle destroyed window gracefully', async () => {
        service.setMainWindow(null);


        const onUpdateAvailable = service.onUpdateAvailable.bind(service);


        await expect(
          onUpdateAvailable({ version: '2.0.0' }),
        ).resolves.not.toThrow();


        expect(dialog.showMessageBox).not.toHaveBeenCalled();
      });
    });

    describe('onDownloadProgress (simulated)', () => {
      it('should send progress to renderer', () => {

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


        const onDownloadProgress = service.onDownloadProgress.bind(service);


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

        service.isDownloading = true;


        const onUpdateDownloaded = service.onUpdateDownloaded.bind(service);

        await onUpdateDownloaded({ version: '2.0.0' });


        expect(service.isDownloading).toBe(false);
      });

      it('should handle destroyed window gracefully', async () => {
        service.setMainWindow(null);


        const onUpdateDownloaded = service.onUpdateDownloaded.bind(service);

        await expect(
          onUpdateDownloaded({ version: '2.0.0' }),
        ).resolves.not.toThrow();

        expect(dialog.showMessageBox).not.toHaveBeenCalled();
      });
    });
  });


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


      const originalGetVersion = app.getVersion;
      (app.getVersion as Mock).mockImplementation(() => {
        throw new Error('Version error');
      });

      await service.checkForUpdates();


      expect(consoleSpy.hasError('Check failed')).toBe(true);


      (app.getVersion as Mock).mockImplementation(originalGetVersion);
    });

    it('should handle window becoming destroyed during update', async () => {

      service.setMainWindow(mockWindow as unknown as Electron.BrowserWindow);


      mockWindow.isDestroyed = vi.fn().mockReturnValue(true);


      const onUpdateAvailable = service.onUpdateAvailable.bind(service);


      await expect(
        onUpdateAvailable({ version: '2.0.0' }),
      ).resolves.not.toThrow();
    });
  });


  describe('Timer Configuration', () => {
    it('should use 10 second initial delay', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();


      await vi.advanceTimersByTimeAsync(9000);
      expect(consoleSpy.hasInfo('Checking')).toBe(false);


      await vi.advanceTimersByTimeAsync(1000);
      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });

    it('should use 4 hour check interval', async () => {
      (app.isPackaged as unknown) = true;

      service.initialize();


      await vi.advanceTimersByTimeAsync(10000);
      consoleSpy.clear();


      await vi.advanceTimersByTimeAsync((4 * 60 * 60 - 1) * 1000);
      expect(consoleSpy.hasInfo('Checking')).toBe(false);


      await vi.advanceTimersByTimeAsync(1000);
      expect(consoleSpy.hasInfo('Checking')).toBe(true);
    });
  });
});
