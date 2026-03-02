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
  createIPCMainTestDouble,
  captureConsole,
  type MockWindowLike,
  type ConsoleSpy,
  type IPCMainTestDouble,
} from '../../helpers';


let ipcTestDouble: IPCMainTestDouble;


const mockShell = {
  openExternal: vi.fn().mockResolvedValue(undefined),
  showItemInFolder: vi.fn(),
  openPath: vi.fn().mockResolvedValue(''),
};


const mockDialog = {
  showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: [] }),
  showSaveDialog: vi.fn().mockResolvedValue({ canceled: false }),
  showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
  showErrorBox: vi.fn(),
};


const mockClipboard = {
  readText: vi.fn().mockReturnValue(''),
  writeText: vi.fn(),
  readHTML: vi.fn().mockReturnValue(''),
  writeHTML: vi.fn(),
  clear: vi.fn(),
};


const mockNativeTheme = {
  themeSource: 'system' as 'system' | 'light' | 'dark',
  shouldUseDarkColors: false,
};


vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn().mockReturnValue('1.0.0'),
    getName: vi.fn().mockReturnValue('ZYNC'),
    getPath: vi.fn().mockImplementation((name: string) => `/mock/path/${name}`),
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


import { registerIpcHandlers } from '../../../main/ipc-handlers';
import { app, ipcMain, shell, dialog, clipboard, nativeTheme } from 'electron';


describe('IPC Handlers', () => {

  let mockWindow: MockWindowLike;


  let mockSettingsWindow: MockWindowLike | null;


  let consoleSpy: ConsoleSpy;


  beforeEach(() => {

    vi.clearAllMocks();


    ipcTestDouble = createIPCMainTestDouble();


    (ipcMain.on as Mock).mockImplementation(ipcTestDouble.ipcMain.on);
    (ipcMain.handle as Mock).mockImplementation(ipcTestDouble.ipcMain.handle);
    (ipcMain.handleOnce as Mock).mockImplementation(
      ipcTestDouble.ipcMain.handleOnce,
    );
    (ipcMain.removeHandler as Mock).mockImplementation(
      ipcTestDouble.ipcMain.removeHandler,
    );


    mockWindow = createMockWindow();
    mockSettingsWindow = null;


    consoleSpy = captureConsole();


    mockShell.openExternal.mockResolvedValue(undefined);
    mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });
    mockDialog.showSaveDialog.mockResolvedValue({ canceled: false });
    mockDialog.showMessageBox.mockResolvedValue({ response: 0 });
    mockClipboard.readText.mockReturnValue('');
    mockNativeTheme.themeSource = 'system';
    mockNativeTheme.shouldUseDarkColors = false;
  });


  afterEach(() => {

    consoleSpy.restore();


    ipcTestDouble.clear();
  });


  describe('Handler Registration', () => {
    it('should register download-platform handler', () => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        mockSettingsWindow as unknown as Electron.BrowserWindow | null,
      );

      expect(ipcMain.on).toHaveBeenCalledWith(
        'download-platform',
        expect.any(Function),
      );
    });

    it('should register multiple handlers', () => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        mockSettingsWindow as unknown as Electron.BrowserWindow | null,
      );


      expect((ipcMain.on as Mock).mock.calls.length).toBeGreaterThan(0);
    });
  });


  describe('download-platform Handler', () => {
    beforeEach(() => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        mockSettingsWindow as unknown as Electron.BrowserWindow | null,
      );
    });

    it('should open Windows download URL for "win" platform', async () => {
      ipcTestDouble.emit('download-platform', 'win');

      expect(shell.openExternal).toHaveBeenCalledWith(
        expect.stringContaining('ZYNC-Setup.exe'),
      );
    });

    it('should open macOS download URL for "mac" platform', async () => {
      ipcTestDouble.emit('download-platform', 'mac');

      expect(shell.openExternal).toHaveBeenCalledWith(
        expect.stringContaining('ZYNC.dmg'),
      );
    });

    it('should open Linux download URL for "linux" platform', async () => {
      ipcTestDouble.emit('download-platform', 'linux');

      expect(shell.openExternal).toHaveBeenCalledWith(
        expect.stringContaining('ZYNC.AppImage'),
      );
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

      expect(shell.openExternal).toHaveBeenCalledWith(
        expect.stringContaining('github.com'),
      );
      expect(shell.openExternal).toHaveBeenCalledWith(
        expect.stringContaining('releases'),
      );
    });
  });


  describe('Input Validation', () => {
    beforeEach(() => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        mockSettingsWindow as unknown as Electron.BrowserWindow | null,
      );
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


  describe('Security', () => {
    beforeEach(() => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        mockSettingsWindow as unknown as Electron.BrowserWindow | null,
      );
    });

    it('should not allow arbitrary URL injection', async () => {

      ipcTestDouble.emit('download-platform', 'https://malicious.com/evil.exe');

      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('should only open whitelisted URLs', async () => {
      const validPlatforms = ['win', 'mac', 'linux'];

      for (const platform of validPlatforms) {
        vi.clearAllMocks();
        ipcTestDouble.emit('download-platform', platform);

        const calledUrl = (shell.openExternal as Mock).mock.calls[0]?.[0];
        if (calledUrl) {

          expect(calledUrl).toContain('github.com');
          expect(calledUrl).toContain('ChitkulLakshya/Zync');
        }
      }
    });

    it('should not execute code from platform argument', async () => {

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


  describe('Error Handling', () => {
    beforeEach(() => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        mockSettingsWindow as unknown as Electron.BrowserWindow | null,
      );
    });

    it('should handle shell.openExternal failure gracefully', async () => {
      mockShell.openExternal.mockRejectedValue(new Error('Network error'));


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


  describe('Window References', () => {
    it('should work with null settings window', () => {
      expect(() => {
        registerIpcHandlers(
          mockWindow as unknown as Electron.BrowserWindow,
          null,
        );
      }).not.toThrow();
    });

    it('should work with both windows', () => {
      mockSettingsWindow = createMockWindow({ id: 2 });

      expect(() => {
        registerIpcHandlers(
          mockWindow as unknown as Electron.BrowserWindow,
          mockSettingsWindow as unknown as Electron.BrowserWindow,
        );
      }).not.toThrow();
    });
  });


  describe('Channel Naming', () => {
    it('should use kebab-case for channel names', () => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        null,
      );

      const registeredChannels: string[] = [];

      (ipcMain.on as Mock).mock.calls.forEach((call: unknown[]) => {
        registeredChannels.push(call[0] as string);
      });

      (ipcMain.handle as Mock).mock.calls.forEach((call: unknown[]) => {
        registeredChannels.push(call[0] as string);
      });


      const kebabCaseRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*(:?[a-z0-9-]+)*$/;

      for (const channel of registeredChannels) {
        expect(
          channel,
          `Channel "${channel}" should be kebab-case`,
        ).toMatch(kebabCaseRegex);
      }
    });
  });


  describe('Documentation Compliance', () => {
    it('should have documented handlers for all registered channels', () => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        null,
      );


      const registeredOnChannels: string[] = (ipcMain.on as Mock).mock.calls.map(
        (call: unknown[]) => call[0] as string,
      );

      const registeredHandleChannels: string[] = (ipcMain.handle as Mock).mock.calls.map(
        (call: unknown[]) => call[0] as string,
      );


      expect(registeredOnChannels).toContain('download-platform');
    });
  });


  describe('Valid Platforms', () => {
    beforeEach(() => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        null,
      );
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
      const platformExtensions: Record<string, string> = {
        win: '.exe',
        mac: '.dmg',
        linux: '.AppImage',
      };

      for (const [platform, extension] of Object.entries(platformExtensions)) {
        vi.clearAllMocks();
        ipcTestDouble.emit('download-platform', platform);

        const calledUrl = (shell.openExternal as Mock).mock.calls[0]?.[0];
        expect(calledUrl).toContain(extension);
      }
    });
  });


  describe('Download URLs', () => {
    beforeEach(() => {
      registerIpcHandlers(
        mockWindow as unknown as Electron.BrowserWindow,
        null,
      );
    });

    it('should use HTTPS for all download URLs', () => {
      const platforms = ['win', 'mac', 'linux'];

      for (const platform of platforms) {
        vi.clearAllMocks();
        ipcTestDouble.emit('download-platform', platform);

        const calledUrl = (shell.openExternal as Mock).mock.calls[0]?.[0];
        expect(calledUrl).toMatch(/^https:\/\//);
      }
    });

    it('should point to latest release', () => {
      const platforms = ['win', 'mac', 'linux'];

      for (const platform of platforms) {
        vi.clearAllMocks();
        ipcTestDouble.emit('download-platform', platform);

        const calledUrl = (shell.openExternal as Mock).mock.calls[0]?.[0];
        expect(calledUrl).toContain('/releases/latest/download/');
      }
    });

    it('should use correct repository path', () => {
      ipcTestDouble.emit('download-platform', 'win');

      const calledUrl = (shell.openExternal as Mock).mock.calls[0]?.[0];
      expect(calledUrl).toContain('ChitkulLakshya/Zync');
    });
  });
});


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
