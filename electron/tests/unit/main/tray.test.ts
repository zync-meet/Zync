import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import * as path from 'node:path';
import {
  createMockWindow,
  createMockTray,
  captureConsole,
  type MockWindowLike,
  type MockTrayLike,
  type ConsoleSpy,
} from '../../helpers';


let createdTrayIcon: unknown = null;
let lastContextMenuTemplate: Electron.MenuItemConstructorOptions[] = [];
let mockTrayInstance: MockTrayLike | null = null;


const mockNativeImage = {
  createFromPath: vi.fn((iconPath: string) => ({
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


const mockMenu = {
  buildFromTemplate: vi.fn((template: Electron.MenuItemConstructorOptions[]) => {
    lastContextMenuTemplate = template;
    return { items: template, popup: vi.fn() };
  }),
};


const MockTrayConstructor = vi.fn((icon: unknown) => {
  createdTrayIcon = icon;
  mockTrayInstance = createMockTray(icon);
  return mockTrayInstance;
});


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


import { createSystemTray } from '../../../main/tray';
import { app, Tray, Menu, nativeImage } from 'electron';


interface ContextMenuItemLike {
  label?: string;
  type?: string;
  enabled?: boolean;
  click?: (...args: unknown[]) => void;
}


function findContextMenuItem(label: string): ContextMenuItemLike | undefined {
  return lastContextMenuTemplate.find((item) => item.label === label);
}


function getTrayClickHandler(): ((...args: unknown[]) => void) | undefined {
  if (!mockTrayInstance) {return undefined;}


  const onCalls = mockTrayInstance.on.mock.calls;
  const clickCall = onCalls.find(
    (call: unknown[]) => call[0] === 'click',
  );
  return clickCall?.[1] as ((...args: unknown[]) => void) | undefined;
}


function getTrayDoubleClickHandler(): ((...args: unknown[]) => void) | undefined {
  if (!mockTrayInstance) {return undefined;}

  const onCalls = mockTrayInstance.on.mock.calls;
  const dblClickCall = onCalls.find(
    (call: unknown[]) => call[0] === 'double-click',
  );
  return dblClickCall?.[1] as ((...args: unknown[]) => void) | undefined;
}


describe('System Tray Manager', () => {

  let mockWindow: MockWindowLike;


  let consoleSpy: ConsoleSpy;


  let originalPlatform: string;


  beforeEach(() => {

    vi.clearAllMocks();
    createdTrayIcon = null;
    lastContextMenuTemplate = [];
    mockTrayInstance = null;


    mockWindow = createMockWindow({
      isVisible: true,
    });


    consoleSpy = captureConsole();


    originalPlatform = process.platform;


    (app.isPackaged as unknown) = false;
  });


  afterEach(() => {

    consoleSpy.restore();


    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });


  describe('Tray Creation', () => {
    it('should create a Tray instance', () => {
      const tray = createSystemTray(
        mockWindow as unknown as Electron.BrowserWindow,
      );

      expect(tray).toBeDefined();
      expect(MockTrayConstructor).toHaveBeenCalled();
    });

    it('should create tray with an icon', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      expect(nativeImage.createFromPath).toHaveBeenCalled();
      expect(createdTrayIcon).toBeDefined();
    });

    it('should resize icon to 16x16 pixels', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);


      const createFromPathCalls = mockNativeImage.createFromPath.mock.results;
      if (createFromPathCalls.length > 0) {
        const icon = createFromPathCalls[0].value;
        expect(icon.resize).toHaveBeenCalledWith({ width: 16, height: 16 });
      }
    });

    it('should log info message when tray is created', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      expect(consoleSpy.hasInfo('System tray created')).toBe(true);
    });
  });


  describe('Icon Selection', () => {
    describe('macOS', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      it('should use Template icon on macOS', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const iconPath = mockNativeImage.createFromPath.mock.calls[0][0] as string;
        expect(iconPath).toContain('Template');
      });

      it('should use tray-icon-Template.png on macOS', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const iconPath = mockNativeImage.createFromPath.mock.calls[0][0] as string;
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
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const iconPath = mockNativeImage.createFromPath.mock.calls[0][0] as string;
        expect(iconPath).not.toContain('Template');
      });

      it('should use tray-icon.png on Windows', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const iconPath = mockNativeImage.createFromPath.mock.calls[0][0] as string;
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
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const iconPath = mockNativeImage.createFromPath.mock.calls[0][0] as string;
        expect(iconPath).toContain('tray-icon.png');
      });
    });

    describe('Fallback Icon', () => {
      it('should use empty icon as fallback when file not found', () => {

        mockNativeImage.createFromPath.mockImplementationOnce(() => {
          throw new Error('File not found');
        });

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockNativeImage.createEmpty).toHaveBeenCalled();
      });

      it('should log warning when using fallback icon', () => {
        mockNativeImage.createFromPath.mockImplementationOnce(() => {
          throw new Error('File not found');
        });

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        expect(consoleSpy.hasWarn('Icon not found')).toBe(true);
      });
    });
  });


  describe('Tooltip', () => {
    it('should set tooltip with app name', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      expect(mockTrayInstance?.setToolTip).toHaveBeenCalledWith(
        expect.stringContaining('ZYNC'),
      );
    });

    it('should set tooltip with app version', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      expect(mockTrayInstance?.setToolTip).toHaveBeenCalledWith(
        expect.stringContaining('v1.0.0'),
      );
    });

    it('should format tooltip as "ZYNC v{version}"', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      expect(mockTrayInstance?.setToolTip).toHaveBeenCalledWith('ZYNC v1.0.0');
    });
  });


  describe('Context Menu', () => {
    it('should set context menu on tray', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      expect(mockTrayInstance?.setContextMenu).toHaveBeenCalled();
      expect(Menu.buildFromTemplate).toHaveBeenCalled();
    });

    it('should include Show ZYNC item', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const showItem = findContextMenuItem('Show ZYNC');
      expect(showItem).toBeDefined();
    });

    it('should include Settings item', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const settingsItem = findContextMenuItem('Settings');
      expect(settingsItem).toBeDefined();
    });

    it('should include Check for Updates item', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const updateItem = findContextMenuItem('Check for Updates');
      expect(updateItem).toBeDefined();
    });

    it('should include About item with version', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const aboutItem = lastContextMenuTemplate.find((item) =>
        item.label?.includes('About ZYNC v'),
      );
      expect(aboutItem).toBeDefined();
      expect(aboutItem?.label).toContain('v1.0.0');
    });

    it('should have About item disabled (display only)', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const aboutItem = lastContextMenuTemplate.find((item) =>
        item.label?.includes('About ZYNC v'),
      );
      expect(aboutItem?.enabled).toBe(false);
    });

    it('should include Quit item', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const quitItem = findContextMenuItem('Quit ZYNC');
      expect(quitItem).toBeDefined();
    });

    it('should have separators between menu groups', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const separators = lastContextMenuTemplate.filter(
        (item) => item.type === 'separator',
      );
      expect(separators.length).toBeGreaterThan(0);
    });
  });


  describe('Context Menu Click Handlers', () => {
    describe('Show ZYNC', () => {
      it('should show and focus window when clicked', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const showItem = findContextMenuItem('Show ZYNC');
        showItem?.click?.({}, undefined, {});

        expect(mockWindow.show).toHaveBeenCalled();
        expect(mockWindow.focus).toHaveBeenCalled();
      });

      it('should not throw when window is destroyed', () => {
        mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const showItem = findContextMenuItem('Show ZYNC');

        expect(() => {
          showItem?.click?.({}, undefined, {});
        }).not.toThrow();
      });
    });

    describe('Settings', () => {
      it('should send IPC message to open settings', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const settingsItem = findContextMenuItem('Settings');
        settingsItem?.click?.({}, undefined, {});

        expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
          action: 'open-settings',
        });
      });

      it('should show window when Settings clicked', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const settingsItem = findContextMenuItem('Settings');
        settingsItem?.click?.({}, undefined, {});

        expect(mockWindow.show).toHaveBeenCalled();
      });
    });

    describe('Check for Updates', () => {
      it('should send IPC message to check updates', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const updateItem = findContextMenuItem('Check for Updates');
        updateItem?.click?.({}, undefined, {});

        expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
          action: 'check-updates',
        });
      });
    });

    describe('Quit ZYNC', () => {
      it('should call app.quit when clicked', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const quitItem = findContextMenuItem('Quit ZYNC');
        quitItem?.click?.({}, undefined, {});

        expect(app.quit).toHaveBeenCalled();
      });
    });
  });


  describe('Tray Click Events', () => {
    describe('Single Click', () => {
      it('should attach click event handler', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockTrayInstance?.on).toHaveBeenCalledWith(
          'click',
          expect.any(Function),
        );
      });

      it('should hide visible window on click', () => {
        mockWindow.isVisible = vi.fn().mockReturnValue(true);

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const clickHandler = getTrayClickHandler();
        clickHandler?.();

        expect(mockWindow.hide).toHaveBeenCalled();
      });

      it('should show and focus hidden window on click', () => {
        mockWindow.isVisible = vi.fn().mockReturnValue(false);

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

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

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const clickHandler = getTrayClickHandler();


        clickHandler?.();
        expect(mockWindow.hide).toHaveBeenCalled();


        clickHandler?.();
        expect(mockWindow.show).toHaveBeenCalled();
      });

      it('should not throw when window is destroyed', () => {
        mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const clickHandler = getTrayClickHandler();

        expect(() => {
          clickHandler?.();
        }).not.toThrow();
      });
    });

    describe('Double Click', () => {
      it('should attach double-click event handler', () => {
        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        expect(mockTrayInstance?.on).toHaveBeenCalledWith(
          'double-click',
          expect.any(Function),
        );
      });

      it('should always show and focus window on double-click', () => {
        mockWindow.isVisible = vi.fn().mockReturnValue(false);

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const dblClickHandler = getTrayDoubleClickHandler();
        dblClickHandler?.();

        expect(mockWindow.show).toHaveBeenCalled();
        expect(mockWindow.focus).toHaveBeenCalled();
      });

      it('should show and focus even if window is already visible', () => {
        mockWindow.isVisible = vi.fn().mockReturnValue(true);

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const dblClickHandler = getTrayDoubleClickHandler();
        dblClickHandler?.();

        expect(mockWindow.show).toHaveBeenCalled();
        expect(mockWindow.focus).toHaveBeenCalled();
      });

      it('should not throw when window is destroyed', () => {
        mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

        createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

        const dblClickHandler = getTrayDoubleClickHandler();

        expect(() => {
          dblClickHandler?.();
        }).not.toThrow();
      });
    });
  });


  describe('Packaged App', () => {
    beforeEach(() => {
      (app.isPackaged as unknown) = true;
    });

    it('should use resourcesPath for icon in packaged app', () => {

      const originalResourcesPath = process.resourcesPath;
      Object.defineProperty(process, 'resourcesPath', {
        value: '/path/to/resources',
        writable: true,
      });

      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const iconPath = mockNativeImage.createFromPath.mock.calls[0][0] as string;
      expect(iconPath).toContain('resources');


      Object.defineProperty(process, 'resourcesPath', {
        value: originalResourcesPath,
        writable: true,
      });
    });
  });


  describe('Return Value', () => {
    it('should return the created Tray instance', () => {
      const tray = createSystemTray(
        mockWindow as unknown as Electron.BrowserWindow,
      );

      expect(tray).toBe(mockTrayInstance);
    });

    it('should return a Tray with event handlers attached', () => {
      const tray = createSystemTray(
        mockWindow as unknown as Electron.BrowserWindow,
      );


      expect(mockTrayInstance?.on).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
      );
      expect(mockTrayInstance?.on).toHaveBeenCalledWith(
        'double-click',
        expect.any(Function),
      );
    });
  });


  describe('Edge Cases', () => {
    it('should handle null window gracefully', () => {

      expect(() => {
        createSystemTray(null as unknown as Electron.BrowserWindow);
      }).not.toThrow();
    });

    it('should handle window becoming destroyed after tray creation', () => {
      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);


      mockWindow.isDestroyed = vi.fn().mockReturnValue(true);


      const clickHandler = getTrayClickHandler();
      expect(() => clickHandler?.()).not.toThrow();


      const showItem = findContextMenuItem('Show ZYNC');
      expect(() => showItem?.click?.({}, undefined, {})).not.toThrow();
    });

    it('should handle rapid successive clicks', () => {
      let visible = true;
      mockWindow.isVisible = vi.fn(() => visible);
      mockWindow.show = vi.fn(() => { visible = true; });
      mockWindow.hide = vi.fn(() => { visible = false; });

      createSystemTray(mockWindow as unknown as Electron.BrowserWindow);

      const clickHandler = getTrayClickHandler();


      for (let i = 0; i < 10; i++) {
        clickHandler?.();
      }


      expect(mockWindow.show.mock.calls.length + mockWindow.hide.mock.calls.length).toBe(10);
    });
  });
});
