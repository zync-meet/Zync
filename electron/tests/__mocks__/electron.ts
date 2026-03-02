import { vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as path from 'node:path';
import * as os from 'node:os';


export interface MockElectronState {

  windows: MockBrowserWindow[];


  trays: MockTray[];


  menus: MockMenu[];


  applicationMenu: MockMenu | null;


  ipcMainHandlers: Map<string, (...args: unknown[]) => unknown>;


  ipcMainListeners: Map<string, Set<(...args: unknown[]) => void>>;


  isReady: boolean;


  pathOverrides: Map<string, string>;


  dialogResponse: unknown;
}


export const mockState: MockElectronState = {
  windows: [],
  trays: [],
  menus: [],
  applicationMenu: null,
  ipcMainHandlers: new Map(),
  ipcMainListeners: new Map(),
  isReady: true,
  pathOverrides: new Map(),
  dialogResponse: undefined,
};


export function resetMockState(): void {
  mockState.windows.forEach(win => win.destroy());
  mockState.windows = [];
  mockState.trays.forEach(tray => tray.destroy());
  mockState.trays = [];
  mockState.menus = [];
  mockState.applicationMenu = null;
  mockState.ipcMainHandlers.clear();
  mockState.ipcMainListeners.clear();
  mockState.isReady = true;
  mockState.pathOverrides.clear();
  mockState.dialogResponse = undefined;
}


class MockApp extends EventEmitter {
  private _name = 'ZYNC';
  private _version = '1.0.0';
  private _isPackaged = false;
  private _isQuitting = false;


  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  getVersion(): string {
    return this._version;
  }

  getName(): string {
    return this._name;
  }

  setName(name: string): void {
    this._name = name;
  }

  get isPackaged(): boolean {
    return this._isPackaged;
  }


  quit(): void {
    this._isQuitting = true;
    this.emit('before-quit', { preventDefault: vi.fn() });
    this.emit('will-quit', { preventDefault: vi.fn() });
    this.emit('quit', {}, 0);
  }

  exit(exitCode?: number): void {
    this.emit('quit', {}, exitCode ?? 0);
  }

  relaunch(options?: { args?: string[]; execPath?: string }): void {

    this.emit('relaunch', options);
  }

  isReady(): boolean {
    return mockState.isReady;
  }

  whenReady(): Promise<void> {
    if (mockState.isReady) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.once('ready', () => resolve());
    });
  }

  focus(options?: { steal?: boolean }): void {
    this.emit('focus', options);
  }

  hide(): void {
    this.emit('hide');
  }

  show(): void {
    this.emit('show');
  }


  getPath(name: string): string {
    if (mockState.pathOverrides.has(name)) {
      return mockState.pathOverrides.get(name)!;
    }

    const basePath = path.join(os.tmpdir(), 'zync-test');

    const paths: Record<string, string> = {
      home: os.homedir(),
      appData: path.join(basePath, 'appData'),
      userData: path.join(basePath, 'userData'),
      temp: os.tmpdir(),
      exe: process.execPath,
      module: __dirname,
      desktop: path.join(os.homedir(), 'Desktop'),
      documents: path.join(os.homedir(), 'Documents'),
      downloads: path.join(os.homedir(), 'Downloads'),
      music: path.join(os.homedir(), 'Music'),
      pictures: path.join(os.homedir(), 'Pictures'),
      videos: path.join(os.homedir(), 'Videos'),
      logs: path.join(basePath, 'logs'),
      crashDumps: path.join(basePath, 'crashDumps'),
    };

    return paths[name] || basePath;
  }

  setPath(name: string, path: string): void {
    mockState.pathOverrides.set(name, path);
  }

  getAppPath(): string {
    return path.resolve(__dirname, '../../..');
  }

  getLocale(): string {
    return 'en-US';
  }

  getLocaleCountryCode(): string {
    return 'US';
  }

  getSystemLocale(): string {
    return 'en-US';
  }


  setBadgeCount(count: number): boolean {
    this.emit('badge-count-change', count);
    return true;
  }

  getBadgeCount(): number {
    return 0;
  }


  dock = {
    bounce: vi.fn().mockReturnValue(0),
    cancelBounce: vi.fn(),
    setBadge: vi.fn(),
    getBadge: vi.fn().mockReturnValue(''),
    hide: vi.fn(),
    show: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockReturnValue(true),
    setMenu: vi.fn(),
    getMenu: vi.fn().mockReturnValue(null),
    setIcon: vi.fn(),
  };


  setLoginItemSettings = vi.fn();
  getLoginItemSettings = vi.fn().mockReturnValue({
    openAtLogin: false,
    openAsHidden: false,
  });


  requestSingleInstanceLock = vi.fn().mockReturnValue(true);
  hasSingleInstanceLock = vi.fn().mockReturnValue(true);
  releaseSingleInstanceLock = vi.fn();


  commandLine = {
    appendSwitch: vi.fn(),
    appendArgument: vi.fn(),
    hasSwitch: vi.fn().mockReturnValue(false),
    getSwitchValue: vi.fn().mockReturnValue(''),
  };


  setUserTasks = vi.fn().mockReturnValue(true);


  setJumpList = vi.fn().mockReturnValue('ok');
  getJumpListSettings = vi.fn().mockReturnValue({
    minItems: 0,
    removedItems: [],
  });


  setAboutPanelOptions = vi.fn();
  showAboutPanel = vi.fn();


  setAccessibilitySupportEnabled = vi.fn();
  isAccessibilitySupportEnabled = vi.fn().mockReturnValue(false);


  setAsDefaultProtocolClient = vi.fn().mockReturnValue(true);
  removeAsDefaultProtocolClient = vi.fn().mockReturnValue(true);
  isDefaultProtocolClient = vi.fn().mockReturnValue(false);


  enableSandbox = vi.fn();
}

export const app = new MockApp();


export class MockWebContents extends EventEmitter {
  id: number;
  private _url = '';

  constructor(id: number) {
    super();
    this.id = id;
  }

  loadURL(url: string): Promise<void> {
    this._url = url;
    this.emit('did-start-loading');
    this.emit('did-finish-load');
    return Promise.resolve();
  }

  loadFile(filePath: string): Promise<void> {
    this._url = `file://${filePath}`;
    this.emit('did-start-loading');
    this.emit('did-finish-load');
    return Promise.resolve();
  }

  getURL(): string {
    return this._url;
  }

  getTitle(): string {
    return 'Mock Title';
  }

  send(channel: string, ...args: unknown[]): void {
    this.emit('ipc-message', { sender: this }, channel, ...args);
  }

  openDevTools = vi.fn();
  closeDevTools = vi.fn();
  isDevToolsOpened = vi.fn().mockReturnValue(false);
  toggleDevTools = vi.fn();

  reload = vi.fn();
  reloadIgnoringCache = vi.fn();

  canGoBack = vi.fn().mockReturnValue(false);
  canGoForward = vi.fn().mockReturnValue(false);
  goBack = vi.fn();
  goForward = vi.fn();

  setZoomFactor = vi.fn();
  getZoomFactor = vi.fn().mockReturnValue(1);
  setZoomLevel = vi.fn();
  getZoomLevel = vi.fn().mockReturnValue(0);

  setAudioMuted = vi.fn();
  isAudioMuted = vi.fn().mockReturnValue(false);

  copy = vi.fn();
  cut = vi.fn();
  paste = vi.fn();
  selectAll = vi.fn();
  undo = vi.fn();
  redo = vi.fn();

  print = vi.fn();
  printToPDF = vi.fn().mockResolvedValue(Buffer.from(''));

  executeJavaScript = vi.fn().mockResolvedValue(undefined);
  insertCSS = vi.fn().mockResolvedValue('');

  session = {
    clearCache: vi.fn().mockResolvedValue(undefined),
    clearStorageData: vi.fn().mockResolvedValue(undefined),
  };
}


export class MockBrowserWindow extends EventEmitter {
  private static _windowIdCounter = 1;

  readonly id: number;
  readonly webContents: MockWebContents;

  private _bounds = { x: 100, y: 100, width: 800, height: 600 };
  private _title = 'ZYNC';
  private _isVisible = true;
  private _isMinimized = false;
  private _isMaximized = false;
  private _isFullScreen = false;
  private _isFocused = true;
  private _isDestroyed = false;
  private _options: Electron.BrowserWindowConstructorOptions;

  constructor(options?: Electron.BrowserWindowConstructorOptions) {
    super();
    this.id = MockBrowserWindow._windowIdCounter++;
    this.webContents = new MockWebContents(this.id);
    this._options = options || {};


    if (options?.width) {this._bounds.width = options.width;}
    if (options?.height) {this._bounds.height = options.height;}
    if (options?.x !== undefined) {this._bounds.x = options.x;}
    if (options?.y !== undefined) {this._bounds.y = options.y;}
    if (options?.title) {this._title = options.title;}
    if (options?.show === false) {this._isVisible = false;}


    mockState.windows.push(this);
  }


  static getAllWindows(): MockBrowserWindow[] {
    return mockState.windows.filter(w => !w._isDestroyed);
  }

  static getFocusedWindow(): MockBrowserWindow | null {
    return mockState.windows.find(w => w._isFocused && !w._isDestroyed) || null;
  }

  static fromId(id: number): MockBrowserWindow | null {
    return mockState.windows.find(w => w.id === id && !w._isDestroyed) || null;
  }

  static fromWebContents(webContents: MockWebContents): MockBrowserWindow | null {
    return mockState.windows.find(w => w.webContents === webContents) || null;
  }


  show(): void {
    this._isVisible = true;
    this.emit('show');
  }

  hide(): void {
    this._isVisible = false;
    this.emit('hide');
  }

  close(): void {
    if (this._isDestroyed) {return;}
    const event = { preventDefault: vi.fn() };
    this.emit('close', event);
    if (!event.preventDefault.mock.calls.length) {
      this.destroy();
    }
  }

  destroy(): void {
    if (this._isDestroyed) {return;}
    this._isDestroyed = true;
    this._isVisible = false;
    this.emit('closed');
    this.removeAllListeners();
  }

  focus(): void {
    mockState.windows.forEach(w => { w._isFocused = false; });
    this._isFocused = true;
    this.emit('focus');
  }

  blur(): void {
    this._isFocused = false;
    this.emit('blur');
  }

  isFocused(): boolean {
    return this._isFocused;
  }

  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  isVisible(): boolean {
    return this._isVisible;
  }


  minimize(): void {
    this._isMinimized = true;
    this._isMaximized = false;
    this.emit('minimize');
  }

  restore(): void {
    this._isMinimized = false;
    this.emit('restore');
  }

  isMinimized(): boolean {
    return this._isMinimized;
  }

  maximize(): void {
    this._isMaximized = true;
    this._isMinimized = false;
    this.emit('maximize');
  }

  unmaximize(): void {
    this._isMaximized = false;
    this.emit('unmaximize');
  }

  isMaximized(): boolean {
    return this._isMaximized;
  }

  setFullScreen(flag: boolean): void {
    this._isFullScreen = flag;
    this.emit(flag ? 'enter-full-screen' : 'leave-full-screen');
  }

  isFullScreen(): boolean {
    return this._isFullScreen;
  }


  setBounds(bounds: Partial<Electron.Rectangle>): void {
    Object.assign(this._bounds, bounds);
    this.emit('resize');
    this.emit('move');
  }

  getBounds(): Electron.Rectangle {
    return { ...this._bounds };
  }

  setSize(width: number, height: number): void {
    this._bounds.width = width;
    this._bounds.height = height;
    this.emit('resize');
  }

  getSize(): [number, number] {
    return [this._bounds.width, this._bounds.height];
  }

  setPosition(x: number, y: number): void {
    this._bounds.x = x;
    this._bounds.y = y;
    this.emit('move');
  }

  getPosition(): [number, number] {
    return [this._bounds.x, this._bounds.y];
  }

  center(): void {
    this._bounds.x = 0;
    this._bounds.y = 0;
    this.emit('move');
  }


  setTitle(title: string): void {
    this._title = title;
    this.emit('page-title-updated', {}, title);
  }

  getTitle(): string {
    return this._title;
  }


  setAlwaysOnTop = vi.fn();
  isAlwaysOnTop = vi.fn().mockReturnValue(false);
  setResizable = vi.fn();
  isResizable = vi.fn().mockReturnValue(true);
  setMovable = vi.fn();
  isMovable = vi.fn().mockReturnValue(true);
  setMinimizable = vi.fn();
  isMinimizable = vi.fn().mockReturnValue(true);
  setMaximizable = vi.fn();
  isMaximizable = vi.fn().mockReturnValue(true);
  setClosable = vi.fn();
  isClosable = vi.fn().mockReturnValue(true);
  setSkipTaskbar = vi.fn();
  setMenu = vi.fn();
  setAutoHideMenuBar = vi.fn();
  isMenuBarAutoHide = vi.fn().mockReturnValue(false);
  setMenuBarVisibility = vi.fn();
  isMenuBarVisible = vi.fn().mockReturnValue(true);
  setProgressBar = vi.fn();
  setOverlayIcon = vi.fn();
  setHasShadow = vi.fn();
  hasShadow = vi.fn().mockReturnValue(true);
  setOpacity = vi.fn();
  getOpacity = vi.fn().mockReturnValue(1);
  setBackgroundColor = vi.fn();
  getBackgroundColor = vi.fn().mockReturnValue('#ffffff');
  flashFrame = vi.fn();
  setIcon = vi.fn();


  loadURL(url: string): Promise<void> {
    return this.webContents.loadURL(url);
  }

  loadFile(filePath: string): Promise<void> {
    return this.webContents.loadFile(filePath);
  }
}


export const BrowserWindow = MockBrowserWindow as unknown as typeof Electron.BrowserWindow;


class MockIpcMain extends EventEmitter {
  handle(channel: string, listener: (...args: unknown[]) => unknown): void {
    mockState.ipcMainHandlers.set(channel, listener);
  }

  handleOnce(channel: string, listener: (...args: unknown[]) => unknown): void {
    const wrappedListener = (...args: unknown[]) => {
      mockState.ipcMainHandlers.delete(channel);
      return listener(...args);
    };
    mockState.ipcMainHandlers.set(channel, wrappedListener);
  }

  removeHandler(channel: string): void {
    mockState.ipcMainHandlers.delete(channel);
  }

  on(channel: string, listener: (...args: unknown[]) => void): this {
    if (!mockState.ipcMainListeners.has(channel)) {
      mockState.ipcMainListeners.set(channel, new Set());
    }
    mockState.ipcMainListeners.get(channel)!.add(listener);
    return this;
  }

  once(channel: string, listener: (...args: unknown[]) => void): this {
    const wrappedListener = (...args: unknown[]) => {
      this.removeListener(channel, wrappedListener);
      listener(...args);
    };
    return this.on(channel, wrappedListener);
  }

  removeListener(channel: string, listener: (...args: unknown[]) => void): this {
    mockState.ipcMainListeners.get(channel)?.delete(listener);
    return this;
  }

  removeAllListeners(channel?: string): this {
    if (channel) {
      mockState.ipcMainListeners.delete(channel);
    } else {
      mockState.ipcMainListeners.clear();
    }
    return this;
  }
}

export const ipcMain = new MockIpcMain();


export class MockMenuItem {
  id?: string;
  label?: string;
  type?: Electron.MenuItemConstructorOptions['type'];
  role?: Electron.MenuItemConstructorOptions['role'];
  accelerator?: string;
  icon?: unknown;
  sublabel?: string;
  toolTip?: string;
  enabled: boolean = true;
  visible: boolean = true;
  checked: boolean = false;
  registerAccelerator: boolean = true;
  submenu?: MockMenu;
  click?: (
    menuItem: MockMenuItem,
    browserWindow: MockBrowserWindow | undefined,
    event: Electron.KeyboardEvent
  ) => void;

  constructor(options: Electron.MenuItemConstructorOptions) {
    Object.assign(this, options);
    if (options.submenu && Array.isArray(options.submenu)) {
      this.submenu = MockMenu.buildFromTemplate(options.submenu as Electron.MenuItemConstructorOptions[]);
    }
  }
}


export class MockMenu {
  items: MockMenuItem[] = [];

  constructor() {
    mockState.menus.push(this);
  }

  append(menuItem: MockMenuItem): void {
    this.items.push(menuItem);
  }

  insert(pos: number, menuItem: MockMenuItem): void {
    this.items.splice(pos, 0, menuItem);
  }

  getMenuItemById(id: string): MockMenuItem | null {
    return this.items.find(item => item.id === id) || null;
  }

  popup(options?: Electron.PopupOptions): void {

  }

  closePopup(browserWindow?: MockBrowserWindow): void {

  }

  static setApplicationMenu(menu: MockMenu | null): void {
    mockState.applicationMenu = menu;
  }

  static getApplicationMenu(): MockMenu | null {
    return mockState.applicationMenu;
  }

  static buildFromTemplate(template: Electron.MenuItemConstructorOptions[]): MockMenu {
    const menu = new MockMenu();
    template.forEach(item => {
      menu.append(new MockMenuItem(item));
    });
    return menu;
  }
}

export const Menu = MockMenu as unknown as typeof Electron.Menu;
export const MenuItem = MockMenuItem as unknown as typeof Electron.MenuItem;


export class MockTray extends EventEmitter {
  private _icon: unknown;
  private _title = '';
  private _tooltip = '';
  private _contextMenu: MockMenu | null = null;
  private _isDestroyed = false;

  constructor(icon: unknown) {
    super();
    this._icon = icon;
    mockState.trays.push(this);
  }

  setImage(icon: unknown): void {
    this._icon = icon;
  }

  setTitle(title: string): void {
    this._title = title;
  }

  getTitle(): string {
    return this._title;
  }

  setToolTip(toolTip: string): void {
    this._tooltip = toolTip;
  }

  setContextMenu(menu: MockMenu | null): void {
    this._contextMenu = menu;
  }

  getBounds(): Electron.Rectangle {
    return { x: 0, y: 0, width: 16, height: 16 };
  }

  destroy(): void {
    if (this._isDestroyed) {return;}
    this._isDestroyed = true;
    this.removeAllListeners();
  }

  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  popUpContextMenu(menu?: MockMenu, position?: Electron.Point): void {
    const menuToShow = menu || this._contextMenu;
    if (menuToShow) {
      menuToShow.popup();
    }
  }

  setIgnoreDoubleClickEvents = vi.fn();
  getIgnoreDoubleClickEvents = vi.fn().mockReturnValue(false);
  displayBalloon = vi.fn();
  removeBalloon = vi.fn();
  focus = vi.fn();
}

export const Tray = MockTray as unknown as typeof Electron.Tray;


export const dialog = {
  showOpenDialog: vi.fn().mockImplementation(async () => {
    return mockState.dialogResponse ?? { canceled: true, filePaths: [] };
  }),

  showOpenDialogSync: vi.fn().mockImplementation(() => {
    return mockState.dialogResponse ?? undefined;
  }),

  showSaveDialog: vi.fn().mockImplementation(async () => {
    return mockState.dialogResponse ?? { canceled: true };
  }),

  showSaveDialogSync: vi.fn().mockImplementation(() => {
    return mockState.dialogResponse ?? undefined;
  }),

  showMessageBox: vi.fn().mockImplementation(async () => {
    return mockState.dialogResponse ?? { response: 0, checkboxChecked: false };
  }),

  showMessageBoxSync: vi.fn().mockImplementation(() => {
    return mockState.dialogResponse ?? 0;
  }),

  showErrorBox: vi.fn(),

  showCertificateTrustDialog: vi.fn().mockResolvedValue(undefined),
};


export const shell = {
  openExternal: vi.fn().mockResolvedValue(undefined),
  openPath: vi.fn().mockResolvedValue(''),
  showItemInFolder: vi.fn(),
  moveItemToTrash: vi.fn().mockReturnValue(true),
  beep: vi.fn(),
  readShortcutLink: vi.fn().mockReturnValue({
    target: '',
    cwd: '',
    args: '',
  }),
  writeShortcutLink: vi.fn().mockReturnValue(true),
};


export const screen = {
  getCursorScreenPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
  getPrimaryDisplay: vi.fn().mockReturnValue({
    id: 1,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    size: { width: 1920, height: 1080 },
    workAreaSize: { width: 1920, height: 1040 },
    scaleFactor: 1,
    rotation: 0,
    internal: false,
    accelerometerSupport: 'unknown' as const,
    touchSupport: 'unknown' as const,
  }),
  getAllDisplays: vi.fn().mockReturnValue([
    {
      id: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
      size: { width: 1920, height: 1080 },
      workAreaSize: { width: 1920, height: 1040 },
      scaleFactor: 1,
      rotation: 0,
      internal: false,
      accelerometerSupport: 'unknown' as const,
      touchSupport: 'unknown' as const,
    },
  ]),
  getDisplayMatching: vi.fn(),
  getDisplayNearestPoint: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
};


let clipboardText = '';
let clipboardHTML = '';

export const clipboard = {
  readText: vi.fn().mockImplementation(() => clipboardText),
  writeText: vi.fn().mockImplementation((text: string) => { clipboardText = text; }),
  readHTML: vi.fn().mockImplementation(() => clipboardHTML),
  writeHTML: vi.fn().mockImplementation((html: string) => { clipboardHTML = html; }),
  readImage: vi.fn().mockReturnValue(null),
  writeImage: vi.fn(),
  readRTF: vi.fn().mockReturnValue(''),
  writeRTF: vi.fn(),
  readBookmark: vi.fn().mockReturnValue({ title: '', url: '' }),
  writeBookmark: vi.fn(),
  clear: vi.fn().mockImplementation(() => { clipboardText = ''; clipboardHTML = ''; }),
  availableFormats: vi.fn().mockReturnValue(['text/plain']),
};


class MockNativeTheme extends EventEmitter {
  private _themeSource: 'system' | 'light' | 'dark' = 'system';

  get themeSource(): 'system' | 'light' | 'dark' {
    return this._themeSource;
  }

  set themeSource(value: 'system' | 'light' | 'dark') {
    this._themeSource = value;
    this.emit('updated');
  }

  get shouldUseDarkColors(): boolean {
    return this._themeSource === 'dark';
  }

  get shouldUseHighContrastColors(): boolean {
    return false;
  }

  get shouldUseInvertedColorScheme(): boolean {
    return false;
  }
}

export const nativeTheme = new MockNativeTheme();


export class MockNativeImage {
  private _isEmpty = false;

  static createEmpty(): MockNativeImage {
    const img = new MockNativeImage();
    img._isEmpty = true;
    return img;
  }

  static createFromPath(path: string): MockNativeImage {
    return new MockNativeImage();
  }

  static createFromBuffer(buffer: Buffer): MockNativeImage {
    return new MockNativeImage();
  }

  static createFromDataURL(dataURL: string): MockNativeImage {
    return new MockNativeImage();
  }

  isEmpty(): boolean {
    return this._isEmpty;
  }

  getSize(): { width: number; height: number } {
    return { width: 16, height: 16 };
  }

  toDataURL(): string {
    return 'data:image/png;base64,';
  }

  toPNG(): Buffer {
    return Buffer.from([]);
  }

  toJPEG(quality: number): Buffer {
    return Buffer.from([]);
  }

  toBitmap(): Buffer {
    return Buffer.from([]);
  }

  resize(options: { width?: number; height?: number }): MockNativeImage {
    return this;
  }

  crop(rect: Electron.Rectangle): MockNativeImage {
    return this;
  }

  getAspectRatio(): number {
    return 1;
  }
}

export const nativeImage = {
  createEmpty: MockNativeImage.createEmpty,
  createFromPath: MockNativeImage.createFromPath,
  createFromBuffer: MockNativeImage.createFromBuffer,
  createFromDataURL: MockNativeImage.createFromDataURL,
};


const registeredShortcuts = new Map<string, () => void>();

export const globalShortcut = {
  register: vi.fn((accelerator: string, callback: () => void) => {
    registeredShortcuts.set(accelerator, callback);
    return true;
  }),
  registerAll: vi.fn((accelerators: string[], callback: () => void) => {
    accelerators.forEach(acc => registeredShortcuts.set(acc, callback));
  }),
  isRegistered: vi.fn((accelerator: string) => registeredShortcuts.has(accelerator)),
  unregister: vi.fn((accelerator: string) => {
    registeredShortcuts.delete(accelerator);
  }),
  unregisterAll: vi.fn(() => {
    registeredShortcuts.clear();
  }),
};


export class MockNotification extends EventEmitter {
  title: string;
  body: string;

  static isSupported(): boolean {
    return true;
  }

  constructor(options?: Electron.NotificationConstructorOptions) {
    super();
    this.title = options?.title || '';
    this.body = options?.body || '';
  }

  show(): void {
    this.emit('show');
  }

  close(): void {
    this.emit('close');
  }
}

export const Notification = MockNotification as unknown as typeof Electron.Notification;


export const session = {
  defaultSession: {
    clearCache: vi.fn().mockResolvedValue(undefined),
    clearStorageData: vi.fn().mockResolvedValue(undefined),
    setProxy: vi.fn().mockResolvedValue(undefined),
    resolveProxy: vi.fn().mockResolvedValue(''),
    getCacheSize: vi.fn().mockResolvedValue(0),
    getUserAgent: vi.fn().mockReturnValue('ZYNC/1.0.0'),
    setUserAgent: vi.fn(),
    webRequest: {
      onBeforeRequest: vi.fn(),
      onBeforeSendHeaders: vi.fn(),
      onSendHeaders: vi.fn(),
      onHeadersReceived: vi.fn(),
      onResponseStarted: vi.fn(),
      onBeforeRedirect: vi.fn(),
      onCompleted: vi.fn(),
      onErrorOccurred: vi.fn(),
    },
    protocol: {
      registerFileProtocol: vi.fn(),
      registerHttpProtocol: vi.fn(),
      registerStringProtocol: vi.fn(),
      registerBufferProtocol: vi.fn(),
      unregisterProtocol: vi.fn(),
      isProtocolRegistered: vi.fn().mockReturnValue(false),
    },
    cookies: {
      get: vi.fn().mockResolvedValue([]),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      flushStore: vi.fn().mockResolvedValue(undefined),
    },
  },
  fromPartition: vi.fn().mockReturnValue({

  }),
};


class MockPowerMonitor extends EventEmitter {
  getSystemIdleState = vi.fn().mockReturnValue('active');
  getSystemIdleTime = vi.fn().mockReturnValue(0);
  isOnBatteryPower = vi.fn().mockReturnValue(false);
}

export const powerMonitor = new MockPowerMonitor();


let powerSaveBlockerId = 0;
const activeBlockers = new Set<number>();

export const powerSaveBlocker = {
  start: vi.fn((type: string) => {
    const id = ++powerSaveBlockerId;
    activeBlockers.add(id);
    return id;
  }),
  stop: vi.fn((id: number) => {
    activeBlockers.delete(id);
  }),
  isStarted: vi.fn((id: number) => activeBlockers.has(id)),
};


export const systemPreferences = {
  isDarkMode: vi.fn().mockReturnValue(false),
  isAeroGlassEnabled: vi.fn().mockReturnValue(false),
  getAccentColor: vi.fn().mockReturnValue('0078d7'),
  getColor: vi.fn().mockReturnValue('#ffffff'),
  getSystemColor: vi.fn().mockReturnValue('#ffffff'),
  isHighContrastColorScheme: vi.fn().mockReturnValue(false),
  getAnimationSettings: vi.fn().mockReturnValue({
    shouldRenderRichAnimation: true,
    scrollAnimationsEnabledBySystem: true,
    prefersReducedMotion: false,
  }),
  askForMediaAccess: vi.fn().mockResolvedValue(true),
  getMediaAccessStatus: vi.fn().mockReturnValue('granted'),
  isTrustedAccessibilityClient: vi.fn().mockReturnValue(true),
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
};


class MockAutoUpdater extends EventEmitter {
  private _feedURL = '';

  setFeedURL(options: { url: string }): void {
    this._feedURL = options.url;
  }

  getFeedURL(): string {
    return this._feedURL;
  }

  checkForUpdates(): void {
    this.emit('checking-for-update');
  }

  quitAndInstall(): void {
    this.emit('before-quit-for-update');
    app.quit();
  }
}

export const autoUpdater = new MockAutoUpdater();


export const contextBridge = {
  exposeInMainWorld: vi.fn((apiKey: string, api: unknown) => {

    (globalThis as unknown as Record<string, unknown>)[apiKey] = api;
  }),
};


class MockIpcRenderer extends EventEmitter {
  send(channel: string, ...args: unknown[]): void {

    const listeners = mockState.ipcMainListeners.get(channel);
    if (listeners) {
      const event = { sender: this, reply: vi.fn() };
      listeners.forEach(listener => listener(event, ...args));
    }
  }

  sendSync(channel: string, ...args: unknown[]): unknown {
    return undefined;
  }

  sendTo(webContentsId: number, channel: string, ...args: unknown[]): void {

  }

  sendToHost(channel: string, ...args: unknown[]): void {

  }

  async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    const handler = mockState.ipcMainHandlers.get(channel);
    if (handler) {
      const event = { sender: this };
      return handler(event, ...args);
    }
    throw new Error(`No handler registered for '${channel}'`);
  }

  postMessage(channel: string, message: unknown, transfer?: MessagePort[]): void {

  }
}

export const ipcRenderer = new MockIpcRenderer();


export default {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  Menu,
  MenuItem,
  Tray,
  dialog,
  shell,
  screen,
  clipboard,
  nativeTheme,
  nativeImage,
  globalShortcut,
  Notification,
  session,
  powerMonitor,
  powerSaveBlocker,
  systemPreferences,
  autoUpdater,
  contextBridge,
};


export const mockElectron = {
  state: mockState,
  reset: resetMockState,
};
