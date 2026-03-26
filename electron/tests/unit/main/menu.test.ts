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


let lastBuiltTemplate: Electron.MenuItemConstructorOptions[] = [];
let applicationMenu: unknown = null;


vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn().mockReturnValue('1.0.0'),
    getName: vi.fn().mockReturnValue('ZYNC'),
    quit: vi.fn(),
    isPackaged: false,
  },
  shell: {
    openExternal: vi.fn().mockResolvedValue(undefined),
  },
  dialog: {
    showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
  },
  Menu: {
    buildFromTemplate: vi.fn((template: Electron.MenuItemConstructorOptions[]) => {
      lastBuiltTemplate = template;
      return { items: template };
    }),
    setApplicationMenu: vi.fn((menu: unknown) => {
      applicationMenu = menu;
    }),
    getApplicationMenu: vi.fn(() => applicationMenu),
  },
  BrowserWindow: vi.fn(),
}));


import { buildApplicationMenu } from '../../../main/menu';
import { app, Menu, shell, dialog } from 'electron';


interface MenuItemLike {
  [key: string]: any;
}


function findMenuItem(
  menu: MenuItemLike[],
  path: string[],
): MenuItemLike | undefined {
  let current: MenuItemLike[] = menu;

  for (let i = 0; i < path.length; i++) {
    const label = path[i];
    const found = current.find((item) => item.label === label);

    if (!found) {
      return undefined;
    }

    if (i === path.length - 1) {
      return found;
    }


    if (found.submenu) {
      current = Array.isArray(found.submenu)
        ? found.submenu
        : found.submenu.items;
    } else {
      return undefined;
    }
  }

  return undefined;
}


function getTopLevelMenus(template: MenuItemLike[]): string[] {
  return template.map((item) => item.label || '').filter(Boolean);
}


function countAllMenuItems(items: MenuItemLike[]): number {
  let count = 0;

  for (const item of items) {
    count++;
    if (item.submenu) {
      const subItems = Array.isArray(item.submenu)
        ? item.submenu
        : item.submenu.items;
      count += countAllMenuItems(subItems);
    }
  }

  return count;
}


describe('Application Menu', () => {

  let mockWindow: MockWindowLike;


  let consoleSpy: ConsoleSpy;


  let originalPlatform: string;


  beforeEach(() => {

    vi.clearAllMocks();
    lastBuiltTemplate = [];
    applicationMenu = null;


    mockWindow = createMockWindow();


    consoleSpy = captureConsole();


    originalPlatform = process.platform;
  });


  afterEach(() => {

    consoleSpy.restore();


    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });


  describe('Menu Creation', () => {
    it('should return a Menu object', () => {
      const menu = buildApplicationMenu(
        mockWindow as unknown as Electron.BrowserWindow,
      );

      expect(menu).toBeDefined();
      expect(Menu.buildFromTemplate).toHaveBeenCalled();
    });

    it('should call Menu.buildFromTemplate with an array', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
        expect.any(Array),
      );
    });

    it('should handle null main window', () => {
      const menu = buildApplicationMenu(null);

      expect(menu).toBeDefined();
      expect(lastBuiltTemplate.length).toBeGreaterThan(0);
    });

    it('should create multiple top-level menus', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      expect(lastBuiltTemplate.length).toBeGreaterThan(3);
    });
  });


  describe('Platform Detection', () => {
    describe('macOS', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      it('should include app menu as first menu on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const firstMenu = lastBuiltTemplate[0];
        expect(firstMenu.label).toBe('ZYNC');
      });

      it('should include About item in app menu on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const aboutItem = findMenuItem(lastBuiltTemplate, ['ZYNC', 'About ZYNC']);
        expect(aboutItem).toBeDefined();
        expect(aboutItem?.role).toBe('about');
      });

      it('should include Preferences item with Cmd+, on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const prefsItem = findMenuItem(lastBuiltTemplate, [
          'ZYNC',
          'Preferences...',
        ]);
        expect(prefsItem).toBeDefined();
        expect(prefsItem?.accelerator).toBe('Cmd+,');
      });

      it('should include Services submenu on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const servicesItem = findMenuItem(lastBuiltTemplate, ['ZYNC', 'Services']);
        expect(servicesItem).toBeDefined();
        expect(servicesItem?.role).toBe('services');
      });

      it('should include Hide items on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const hideItem = findMenuItem(lastBuiltTemplate, ['ZYNC', 'Hide ZYNC']);
        const hideOthersItem = findMenuItem(lastBuiltTemplate, [
          'ZYNC',
          'Hide Others',
        ]);
        const showAllItem = findMenuItem(lastBuiltTemplate, ['ZYNC', 'Show All']);

        expect(hideItem?.role).toBe('hide');
        expect(hideOthersItem?.role).toBe('hideOthers');
        expect(showAllItem?.role).toBe('unhide');
      });

      it('should include Quit item at end of app menu on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const quitItem = findMenuItem(lastBuiltTemplate, ['ZYNC', 'Quit ZYNC']);
        expect(quitItem).toBeDefined();
        expect(quitItem?.role).toBe('quit');
      });
    });

    describe('Windows/Linux', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      it('should not include app-named menu as first on Windows', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const firstMenu = lastBuiltTemplate[0];

        expect(firstMenu.label).not.toBe('ZYNC');
      });

      it('should include Exit in File menu on Windows', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const exitItem = findMenuItem(lastBuiltTemplate, ['File', 'Exit']);
        expect(exitItem).toBeDefined();
        expect(exitItem?.role).toBe('quit');
      });

      it('should not include macOS-specific Services menu on Windows', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);


        const servicesInFile = findMenuItem(lastBuiltTemplate, [
          'File',
          'Services',
        ]);
        expect(servicesInFile).toBeUndefined();
      });
    });
  });


  describe('File Menu', () => {
    it('should include File menu', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const topMenus = getTopLevelMenus(lastBuiltTemplate);
      expect(topMenus).toContain('File');
    });

    it('should include New Window item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const newWindowItem = findMenuItem(lastBuiltTemplate, [
        'File',
        'New Window',
      ]);
      expect(newWindowItem).toBeDefined();
      expect(newWindowItem?.accelerator).toBe('CmdOrCtrl+N');
    });

    it('should include Settings item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const settingsItem = findMenuItem(lastBuiltTemplate, ['File', 'Settings']);
      expect(settingsItem).toBeDefined();
      expect(settingsItem?.accelerator).toBe('CmdOrCtrl+,');
    });

    it('should have click handler for New Window', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const newWindowItem = findMenuItem(lastBuiltTemplate, [
        'File',
        'New Window',
      ]);


      newWindowItem?.click?.({}, undefined, {});


      expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
        action: 'new-window',
      });
    });

    it('should have click handler for Settings', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const settingsItem = findMenuItem(lastBuiltTemplate, ['File', 'Settings']);


      settingsItem?.click?.({}, undefined, {});


      expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
        action: 'open-settings',
      });
    });
  });


  describe('Edit Menu', () => {
    it('should include Edit menu', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const topMenus = getTopLevelMenus(lastBuiltTemplate);
      expect(topMenus).toContain('Edit');
    });

    it('should include standard edit items', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const editItems = [
        { label: 'Undo', role: 'undo' },
        { label: 'Redo', role: 'redo' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
      ];

      for (const expected of editItems) {
        const item = findMenuItem(lastBuiltTemplate, ['Edit', expected.label]);
        expect(item).toBeDefined();
        expect(item?.role).toBe(expected.role);
      }
    });

    it('should include Select All item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const selectAllItem = findMenuItem(lastBuiltTemplate, [
        'Edit',
        'Select All',
      ]);
      expect(selectAllItem).toBeDefined();
      expect(selectAllItem?.role).toBe('selectAll');
    });

    it('should have separator between redo and cut', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const editMenu = findMenuItem(lastBuiltTemplate, ['Edit']);
      const submenu = Array.isArray(editMenu?.submenu)
        ? editMenu.submenu
        : editMenu?.submenu?.items;


      let redoIndex = -1;
      let cutIndex = -1;

      submenu?.forEach((item: any, index: number) => {
        if (item.label === 'Redo') {redoIndex = index;}
        if (item.label === 'Cut') {cutIndex = index;}
      });


      expect(cutIndex).toBeGreaterThan(redoIndex);
      expect(submenu?.[redoIndex + 1]?.type).toBe('separator');
    });
  });


  describe('View Menu', () => {
    it('should include View menu', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const topMenus = getTopLevelMenus(lastBuiltTemplate);
      expect(topMenus).toContain('View');
    });

    it('should include Reload item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const reloadItem = findMenuItem(lastBuiltTemplate, ['View', 'Reload']);
      expect(reloadItem).toBeDefined();
      expect(reloadItem?.role).toBe('reload');
    });

    it('should include Force Reload item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const forceReloadItem = findMenuItem(lastBuiltTemplate, [
        'View',
        'Force Reload',
      ]);
      expect(forceReloadItem).toBeDefined();
      expect(forceReloadItem?.role).toBe('forceReload');
    });

    it('should include Toggle Developer Tools item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const devToolsItem = findMenuItem(lastBuiltTemplate, [
        'View',
        'Toggle Developer Tools',
      ]);
      expect(devToolsItem).toBeDefined();
      expect(devToolsItem?.role).toBe('toggleDevTools');
    });

    it('should include zoom controls', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const zoomInItem = findMenuItem(lastBuiltTemplate, ['View', 'Zoom In']);
      const zoomOutItem = findMenuItem(lastBuiltTemplate, ['View', 'Zoom Out']);
      const resetZoomItem = findMenuItem(lastBuiltTemplate, [
        'View',
        'Reset Zoom',
      ]);

      expect(zoomInItem?.role).toBe('zoomIn');
      expect(zoomOutItem?.role).toBe('zoomOut');
      expect(resetZoomItem?.role).toBe('resetZoom');
    });

    it('should include Toggle Fullscreen item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const fullscreenItem = findMenuItem(lastBuiltTemplate, [
        'View',
        'Toggle Fullscreen',
      ]);
      expect(fullscreenItem).toBeDefined();
      expect(fullscreenItem?.role).toBe('togglefullscreen');
    });
  });


  describe('Window Menu', () => {
    it('should include Window menu', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const topMenus = getTopLevelMenus(lastBuiltTemplate);
      expect(topMenus).toContain('Window');
    });

    it('should include Minimize item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const minimizeItem = findMenuItem(lastBuiltTemplate, [
        'Window',
        'Minimize',
      ]);
      expect(minimizeItem).toBeDefined();
      expect(minimizeItem?.role).toBe('minimize');
    });

    it('should include Close item', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const closeItem = findMenuItem(lastBuiltTemplate, ['Window', 'Close']);
      expect(closeItem).toBeDefined();
      expect(closeItem?.role).toBe('close');
    });

    describe('macOS', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      it('should include Zoom item on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const zoomItem = findMenuItem(lastBuiltTemplate, ['Window', 'Zoom']);
        expect(zoomItem).toBeDefined();
        expect(zoomItem?.role).toBe('zoom');
      });

      it('should include Front item on macOS', () => {
        buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

        const frontItem = findMenuItem(lastBuiltTemplate, [
          'Window',
          'Bring All to Front',
        ]);
        expect(frontItem).toBeDefined();
        expect(frontItem?.role).toBe('front');
      });
    });
  });


  describe('Help Menu', () => {
    it('should include Help menu', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const topMenus = getTopLevelMenus(lastBuiltTemplate);
      expect(topMenus).toContain('Help');
    });

    it('should include documentation link', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const docsItem = findMenuItem(lastBuiltTemplate, ['Help', 'Documentation']);
      expect(docsItem).toBeDefined();
      expect(docsItem?.click).toBeDefined();
    });

    it('should open external URL when documentation is clicked', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const docsItem = findMenuItem(lastBuiltTemplate, ['Help', 'Documentation']);


      docsItem?.click?.({}, undefined, {});


      expect(shell.openExternal).toHaveBeenCalled();
    });

    it('should include Report Issue link', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const issueItem = findMenuItem(lastBuiltTemplate, ['Help', 'Report Issue']);
      expect(issueItem).toBeDefined();
    });

    it('should include About item on Windows/Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const aboutItem = findMenuItem(lastBuiltTemplate, ['Help', 'About ZYNC']);
      expect(aboutItem).toBeDefined();
    });
  });


  describe('Keyboard Shortcuts', () => {
    it('should use CmdOrCtrl for cross-platform shortcuts', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);


      const settingsItem = findMenuItem(lastBuiltTemplate, ['File', 'Settings']);
      const newWindowItem = findMenuItem(lastBuiltTemplate, [
        'File',
        'New Window',
      ]);

      expect(settingsItem?.accelerator).toContain('CmdOrCtrl');
      expect(newWindowItem?.accelerator).toContain('CmdOrCtrl');
    });

    it('should have Cmd prefix for macOS-only shortcuts', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
      });

      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const prefsItem = findMenuItem(lastBuiltTemplate, [
        'ZYNC',
        'Preferences...',
      ]);
      expect(prefsItem?.accelerator).toBe('Cmd+,');
    });
  });


  describe('Click Handlers', () => {
    it('should not throw when clicking with null window', () => {
      const menu = buildApplicationMenu(null);

      const newWindowItem = findMenuItem(lastBuiltTemplate, [
        'File',
        'New Window',
      ]);


      expect(() => {
        newWindowItem?.click?.({}, undefined, {});
      }).not.toThrow();
    });

    it('should send correct IPC message for settings', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const settingsItem = findMenuItem(lastBuiltTemplate, ['File', 'Settings']);
      settingsItem?.click?.({}, undefined, {});

      expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
        action: 'open-settings',
      });
    });

    it('should send correct IPC message for new window', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const newWindowItem = findMenuItem(lastBuiltTemplate, [
        'File',
        'New Window',
      ]);
      newWindowItem?.click?.({}, undefined, {});

      expect(mockWindow.webContents.send).toHaveBeenCalledWith('fromMain', {
        action: 'new-window',
      });
    });
  });


  describe('Menu Structure', () => {
    it('should have separators to group related items', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      let separatorCount = 0;

      function countSeparators(items: MenuItemLike[]): void {
        for (const item of items) {
          if (item.type === 'separator') {
            separatorCount++;
          }
          if (item.submenu) {
            const subItems = Array.isArray(item.submenu)
              ? item.submenu
              : item.submenu.items;
            countSeparators(subItems);
          }
        }
      }

      countSeparators(lastBuiltTemplate);


      expect(separatorCount).toBeGreaterThan(5);
    });

    it('should have reasonable total item count', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      const totalItems = countAllMenuItems(lastBuiltTemplate);


      expect(totalItems).toBeGreaterThan(20);

      expect(totalItems).toBeLessThan(100);
    });

    it('should not have empty submenus', () => {
      buildApplicationMenu(mockWindow as unknown as Electron.BrowserWindow);

      function checkForEmptySubmenus(items: MenuItemLike[]): void {
        for (const item of items) {
          if (item.submenu) {
            const subItems = Array.isArray(item.submenu)
              ? item.submenu
              : item.submenu.items;

            expect(subItems.length).toBeGreaterThan(0);
            checkForEmptySubmenus(subItems);
          }
        }
      }

      checkForEmptySubmenus(lastBuiltTemplate);
    });
  });
});
