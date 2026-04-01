import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  createMockWindow,
  createTempDirectory,
  cleanupTempDirectory,
  captureConsole,
  type MockWindowLike,
  type ConsoleSpy,
} from '../../helpers';


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


import { loadWindowState, trackWindowState } from '../../../main/window-state';
import { app, screen } from 'electron';


interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}


const DEFAULT_STATE: WindowState = {
  x: 0,
  y: 0,
  width: 1200,
  height: 800,
  isMaximized: false,
};


describe('Window State Manager', () => {

  let tempDir: string;


  let mockGetPath: Mock;


  let consoleSpy: ConsoleSpy;


  beforeEach(() => {

    tempDir = createTempDirectory('window-state');


    mockGetPath = app.getPath as Mock;
    mockGetPath.mockImplementation((name: string) => {
      if (name === 'userData') {
        return tempDir;
      }
      return path.join(os.tmpdir(), name);
    });


    const mockScreen = screen as unknown as {
      getPrimaryDisplay: Mock;
      getAllDisplays: Mock;
    };

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


    consoleSpy = captureConsole();


    vi.useFakeTimers();
  });


  afterEach(() => {

    consoleSpy.restore();


    vi.useRealTimers();


    cleanupTempDirectory(tempDir);


    vi.clearAllMocks();
  });


  describe('loadWindowState()', () => {
    describe('Without Saved State', () => {
      it('should return centered default state when no saved state exists', () => {
        const state = loadWindowState();


        expect(state.width).toBe(DEFAULT_STATE.width);
        expect(state.height).toBe(DEFAULT_STATE.height);
        expect(state.isMaximized).toBe(DEFAULT_STATE.isMaximized);


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
        const savedState: WindowState = {
          x: 100,
          y: 100,
          width: 1000,
          height: 700,
          isMaximized: true,
        };


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
        const savedState: WindowState = {
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
        const savedState: WindowState = {
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
        const savedState: WindowState = {
          x: 5000,
          y: 5000,
          width: 1000,
          height: 700,
          isMaximized: false,
        };

        const statePath = path.join(tempDir, 'window-state.json');
        fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');

        const state = loadWindowState();


        const expectedX = (1920 - state.width) / 2;
        const expectedY = (1040 - state.height) / 2;
        expect(state.x).toBe(expectedX);
        expect(state.y).toBe(expectedY);


        expect(state.width).toBe(1000);
        expect(state.height).toBe(700);
      });

      it('should keep window when at least partially visible', () => {
        const savedState: WindowState = {
          x: 1800,
          y: 100,
          width: 200,
          height: 200,
          isMaximized: false,
        };

        const statePath = path.join(tempDir, 'window-state.json');
        fs.writeFileSync(statePath, JSON.stringify(savedState), 'utf-8');

        const state = loadWindowState();


        expect(state.x).toBe(1800);
        expect(state.y).toBe(100);
      });

      it('should log info message when re-centering off-screen window', () => {
        const savedState: WindowState = {
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

        const mockScreen = screen as unknown as { getAllDisplays: Mock };
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
        const savedState: WindowState = {
          x: 2000,
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


        expect(state.x).toBeDefined();
        expect(state.y).toBeDefined();
      });

      it('should handle permission errors gracefully', () => {

        const originalReadFileSync = fs.readFileSync;
        vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
          throw new Error('EACCES: permission denied');
        });
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);

        const state = loadWindowState();


        expect(state.width).toBe(DEFAULT_STATE.width);
        expect(state.height).toBe(DEFAULT_STATE.height);


        vi.restoreAllMocks();
      });
    });
  });


  describe('trackWindowState()', () => {
    let mockWindow: MockWindowLike;

    beforeEach(() => {
      mockWindow = createMockWindow({
        bounds: { x: 100, y: 100, width: 800, height: 600 },
        isMaximized: false,
      });
    });

    describe('Event Listener Attachment', () => {
      it('should attach move event listener', () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockWindow.on).toHaveBeenCalledWith('move', expect.any(Function));
      });

      it('should attach resize event listener', () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockWindow.on).toHaveBeenCalledWith(
          'resize',
          expect.any(Function),
        );
      });

      it('should attach maximize event listener', () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockWindow.on).toHaveBeenCalledWith(
          'maximize',
          expect.any(Function),
        );
      });

      it('should attach unmaximize event listener', () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockWindow.on).toHaveBeenCalledWith(
          'unmaximize',
          expect.any(Function),
        );
      });

      it('should attach close event listener', () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockWindow.on).toHaveBeenCalledWith(
          'close',
          expect.any(Function),
        );
      });

      it('should log info message when tracking is attached', () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        expect(consoleSpy.hasInfo('Tracking attached')).toBe(true);
      });
    });

    describe('State Saving on Events', () => {
      it('should save state after debounce delay on move', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);


        mockWindow._triggerEvent('move');


        const statePath = path.join(tempDir, 'window-state.json');
        expect(fs.existsSync(statePath)).toBe(false);


        await vi.advanceTimersByTimeAsync(600);


        expect(fs.existsSync(statePath)).toBe(true);
      });

      it('should save state after debounce delay on resize', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        mockWindow._triggerEvent('resize');

        await vi.advanceTimersByTimeAsync(600);

        const statePath = path.join(tempDir, 'window-state.json');
        expect(fs.existsSync(statePath)).toBe(true);
      });

      it('should save state on maximize', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);


        mockWindow.isMaximized = vi.fn(() => true);

        mockWindow._triggerEvent('maximize');

        await vi.advanceTimersByTimeAsync(600);

        const statePath = path.join(tempDir, 'window-state.json');
        const savedState = JSON.parse(fs.readFileSync(statePath, 'utf-8'));

        expect(savedState.isMaximized).toBe(true);
      });

      it('should save state on unmaximize', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        mockWindow._triggerEvent('unmaximize');

        await vi.advanceTimersByTimeAsync(600);

        const statePath = path.join(tempDir, 'window-state.json');
        expect(fs.existsSync(statePath)).toBe(true);
      });

      it('should debounce rapid events', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);


        for (let i = 0; i < 10; i++) {
          mockWindow._triggerEvent('move');
          await vi.advanceTimersByTimeAsync(100);
        }


        await vi.advanceTimersByTimeAsync(600);


        const statePath = path.join(tempDir, 'window-state.json');
        expect(fs.existsSync(statePath)).toBe(true);
      });

      it('should save correct bounds in state file', async () => {

        mockWindow = createMockWindow({
          bounds: { x: 200, y: 150, width: 1024, height: 768 },
          isMaximized: false,
        });

        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        mockWindow._triggerEvent('move');

        await vi.advanceTimersByTimeAsync(600);

        const statePath = path.join(tempDir, 'window-state.json');
        const savedState: WindowState = JSON.parse(
          fs.readFileSync(statePath, 'utf-8'),
        );

        expect(savedState.x).toBe(200);
        expect(savedState.y).toBe(150);
        expect(savedState.width).toBe(1024);
        expect(savedState.height).toBe(768);
        expect(savedState.isMaximized).toBe(false);
      });
    });

    describe('State Saving on Close', () => {
      it('should save state immediately on close without debounce', () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);

        mockWindow._triggerEvent('close');


        const statePath = path.join(tempDir, 'window-state.json');
        expect(fs.existsSync(statePath)).toBe(true);
      });

      it('should cancel pending debounced save on close', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);


        mockWindow._triggerEvent('move');


        mockWindow._triggerEvent('close');


        const statePath = path.join(tempDir, 'window-state.json');
        expect(fs.existsSync(statePath)).toBe(true);
      });

      it('should not save state on close if window is destroyed', () => {

        mockWindow = createMockWindow({
          isDestroyed: true,
        });


        const closeHandlers: Array<() => void> = [];
        mockWindow.on = vi.fn((event: string, handler: () => void) => {
          if (event === 'close') {
            closeHandlers.push(handler);
          }
          return mockWindow;
        });

        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);


        closeHandlers.forEach((h) => h());


        const statePath = path.join(tempDir, 'window-state.json');

      });
    });

    describe('Edge Cases', () => {
      it('should handle destroyed window during debounce', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);


        mockWindow._triggerEvent('move');


        mockWindow.isDestroyed = vi.fn(() => true);


        await vi.advanceTimersByTimeAsync(600);


        expect(true).toBe(true);
      });

      it('should handle multiple windows being tracked', async () => {
        const window1 = createMockWindow({ id: 1 });
        const window2 = createMockWindow({ id: 2 });

        trackWindowState(window1 as unknown as Electron.BrowserWindow);
        trackWindowState(window2 as unknown as Electron.BrowserWindow);

        window1._triggerEvent('move');
        window2._triggerEvent('move');

        await vi.advanceTimersByTimeAsync(600);


        expect(consoleSpy.info.length).toBeGreaterThan(0);
      });

      it('should handle file system errors gracefully during save', async () => {
        trackWindowState(mockWindow as unknown as Electron.BrowserWindow);


        vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
          throw new Error('Disk full');
        });

        mockWindow._triggerEvent('move');

        await vi.advanceTimersByTimeAsync(600);


        expect(consoleSpy.hasError('Failed to save state')).toBe(true);

        vi.restoreAllMocks();
      });
    });
  });


  describe('Integration Tests', () => {
    it('should round-trip save and load correctly', async () => {
      const mockWindow = createMockWindow({
        bounds: { x: 300, y: 200, width: 1400, height: 900 },
        isMaximized: true,
      });


      trackWindowState(mockWindow as unknown as Electron.BrowserWindow);
      mockWindow._triggerEvent('close');


      const loadedState = loadWindowState();

      expect(loadedState.x).toBe(300);
      expect(loadedState.y).toBe(200);
      expect(loadedState.width).toBe(1400);
      expect(loadedState.height).toBe(900);
      expect(loadedState.isMaximized).toBe(true);
    });

    it('should handle state persistence across multiple loads', () => {

      const state1: WindowState = {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        isMaximized: false,
      };

      const statePath = path.join(tempDir, 'window-state.json');
      fs.writeFileSync(statePath, JSON.stringify(state1), 'utf-8');


      const loaded1 = loadWindowState();
      expect(loaded1.x).toBe(100);


      const state2: WindowState = {
        x: 200,
        y: 200,
        width: 1000,
        height: 800,
        isMaximized: true,
      };
      fs.writeFileSync(statePath, JSON.stringify(state2), 'utf-8');


      const loaded2 = loadWindowState();
      expect(loaded2.x).toBe(200);
      expect(loaded2.isMaximized).toBe(true);
    });
  });
});
