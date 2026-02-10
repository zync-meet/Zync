/**
 * =============================================================================
 * ZYNC Desktop Application - Electron API Mocks
 * =============================================================================
 *
 * This file provides comprehensive mocks for Electron's APIs, enabling unit
 * testing of Electron main process code without requiring a real Electron
 * runtime.
 *
 * The mocks simulate the behavior of Electron's built-in modules:
 * - app: Application lifecycle and events
 * - BrowserWindow: Window creation and management
 * - ipcMain/ipcRenderer: Inter-process communication
 * - Menu/MenuItem: Application menus
 * - Tray: System tray icons
 * - dialog: Native dialogs
 * - shell: Operating system integration
 * - And more...
 *
 * =============================================================================
 * Usage
 * =============================================================================
 *
 * The mocks are automatically loaded when tests import 'electron' due to
 * the alias configured in vitest.config.ts.
 *
 * In test files:
 *   import { app, BrowserWindow } from 'electron';
 *   // These will be the mocked versions
 *
 * To access mock internals:
 *   import { mockElectron } from 'electron';
 *   // Get created windows, emitted events, etc.
 *
 * =============================================================================
 */
import { vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as path from 'node:path';
import * as os from 'node:os';
/**
 * The mock state singleton.
 */
export const mockState = {
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
/**
 * Reset the mock state between tests.
 */
export function resetMockState() {
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
// =============================================================================
// Mock: app
// =============================================================================
/**
 * Mock implementation of Electron's app module.
 */
class MockApp extends EventEmitter {
    _name = 'ZYNC';
    _version = '1.0.0';
    _isPackaged = false;
    _isQuitting = false;
    // Getters and setters
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    getVersion() {
        return this._version;
    }
    getName() {
        return this._name;
    }
    setName(name) {
        this._name = name;
    }
    get isPackaged() {
        return this._isPackaged;
    }
    // Lifecycle methods
    quit() {
        this._isQuitting = true;
        this.emit('before-quit', { preventDefault: vi.fn() });
        this.emit('will-quit', { preventDefault: vi.fn() });
        this.emit('quit', {}, 0);
    }
    exit(exitCode) {
        this.emit('quit', {}, exitCode ?? 0);
    }
    relaunch(options) {
        // Mock: just emit an event for testing
        this.emit('relaunch', options);
    }
    isReady() {
        return mockState.isReady;
    }
    whenReady() {
        if (mockState.isReady) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            this.once('ready', () => resolve());
        });
    }
    focus(options) {
        this.emit('focus', options);
    }
    hide() {
        this.emit('hide');
    }
    show() {
        this.emit('show');
    }
    // Path methods
    getPath(name) {
        if (mockState.pathOverrides.has(name)) {
            return mockState.pathOverrides.get(name);
        }
        const basePath = path.join(os.tmpdir(), 'zync-test');
        const paths = {
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
    setPath(name, path) {
        mockState.pathOverrides.set(name, path);
    }
    getAppPath() {
        return path.resolve(__dirname, '../../..');
    }
    getLocale() {
        return 'en-US';
    }
    getLocaleCountryCode() {
        return 'US';
    }
    getSystemLocale() {
        return 'en-US';
    }
    // Badge count (macOS/Linux)
    setBadgeCount(count) {
        this.emit('badge-count-change', count);
        return true;
    }
    getBadgeCount() {
        return 0;
    }
    // Dock (macOS)
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
    // Login items
    setLoginItemSettings = vi.fn();
    getLoginItemSettings = vi.fn().mockReturnValue({
        openAtLogin: false,
        openAsHidden: false,
    });
    // Single instance
    requestSingleInstanceLock = vi.fn().mockReturnValue(true);
    hasSingleInstanceLock = vi.fn().mockReturnValue(true);
    releaseSingleInstanceLock = vi.fn();
    // Command line
    commandLine = {
        appendSwitch: vi.fn(),
        appendArgument: vi.fn(),
        hasSwitch: vi.fn().mockReturnValue(false),
        getSwitchValue: vi.fn().mockReturnValue(''),
    };
    // User tasks (Windows)
    setUserTasks = vi.fn().mockReturnValue(true);
    // Jump list (Windows)
    setJumpList = vi.fn().mockReturnValue('ok');
    getJumpListSettings = vi.fn().mockReturnValue({
        minItems: 0,
        removedItems: [],
    });
    // About panel
    setAboutPanelOptions = vi.fn();
    showAboutPanel = vi.fn();
    // Accessibility
    setAccessibilitySupportEnabled = vi.fn();
    isAccessibilitySupportEnabled = vi.fn().mockReturnValue(false);
    // Protocol handlers
    setAsDefaultProtocolClient = vi.fn().mockReturnValue(true);
    removeAsDefaultProtocolClient = vi.fn().mockReturnValue(true);
    isDefaultProtocolClient = vi.fn().mockReturnValue(false);
    // Security
    enableSandbox = vi.fn();
}
export const app = new MockApp();
// =============================================================================
// Mock: BrowserWindow
// =============================================================================
/**
 * Mock WebContents implementation.
 */
export class MockWebContents extends EventEmitter {
    id;
    _url = '';
    constructor(id) {
        super();
        this.id = id;
    }
    loadURL(url) {
        this._url = url;
        this.emit('did-start-loading');
        this.emit('did-finish-load');
        return Promise.resolve();
    }
    loadFile(filePath) {
        this._url = `file://${filePath}`;
        this.emit('did-start-loading');
        this.emit('did-finish-load');
        return Promise.resolve();
    }
    getURL() {
        return this._url;
    }
    getTitle() {
        return 'Mock Title';
    }
    send(channel, ...args) {
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
/**
 * Mock BrowserWindow implementation.
 */
export class MockBrowserWindow extends EventEmitter {
    static _windowIdCounter = 1;
    id;
    webContents;
    _bounds = { x: 100, y: 100, width: 800, height: 600 };
    _title = 'ZYNC';
    _isVisible = true;
    _isMinimized = false;
    _isMaximized = false;
    _isFullScreen = false;
    _isFocused = true;
    _isDestroyed = false;
    _options;
    constructor(options) {
        super();
        this.id = MockBrowserWindow._windowIdCounter++;
        this.webContents = new MockWebContents(this.id);
        this._options = options || {};
        // Apply initial options
        if (options?.width)
            this._bounds.width = options.width;
        if (options?.height)
            this._bounds.height = options.height;
        if (options?.x !== undefined)
            this._bounds.x = options.x;
        if (options?.y !== undefined)
            this._bounds.y = options.y;
        if (options?.title)
            this._title = options.title;
        if (options?.show === false)
            this._isVisible = false;
        // Register this window
        mockState.windows.push(this);
    }
    // Static methods
    static getAllWindows() {
        return mockState.windows.filter(w => !w._isDestroyed);
    }
    static getFocusedWindow() {
        return mockState.windows.find(w => w._isFocused && !w._isDestroyed) || null;
    }
    static fromId(id) {
        return mockState.windows.find(w => w.id === id && !w._isDestroyed) || null;
    }
    static fromWebContents(webContents) {
        return mockState.windows.find(w => w.webContents === webContents) || null;
    }
    // Instance methods - Window state
    show() {
        this._isVisible = true;
        this.emit('show');
    }
    hide() {
        this._isVisible = false;
        this.emit('hide');
    }
    close() {
        if (this._isDestroyed)
            return;
        const event = { preventDefault: vi.fn() };
        this.emit('close', event);
        if (!event.preventDefault.mock.calls.length) {
            this.destroy();
        }
    }
    destroy() {
        if (this._isDestroyed)
            return;
        this._isDestroyed = true;
        this._isVisible = false;
        this.emit('closed');
        this.removeAllListeners();
    }
    focus() {
        mockState.windows.forEach(w => { w._isFocused = false; });
        this._isFocused = true;
        this.emit('focus');
    }
    blur() {
        this._isFocused = false;
        this.emit('blur');
    }
    isFocused() {
        return this._isFocused;
    }
    isDestroyed() {
        return this._isDestroyed;
    }
    isVisible() {
        return this._isVisible;
    }
    // Minimize/Maximize/Fullscreen
    minimize() {
        this._isMinimized = true;
        this._isMaximized = false;
        this.emit('minimize');
    }
    restore() {
        this._isMinimized = false;
        this.emit('restore');
    }
    isMinimized() {
        return this._isMinimized;
    }
    maximize() {
        this._isMaximized = true;
        this._isMinimized = false;
        this.emit('maximize');
    }
    unmaximize() {
        this._isMaximized = false;
        this.emit('unmaximize');
    }
    isMaximized() {
        return this._isMaximized;
    }
    setFullScreen(flag) {
        this._isFullScreen = flag;
        this.emit(flag ? 'enter-full-screen' : 'leave-full-screen');
    }
    isFullScreen() {
        return this._isFullScreen;
    }
    // Bounds
    setBounds(bounds) {
        Object.assign(this._bounds, bounds);
        this.emit('resize');
        this.emit('move');
    }
    getBounds() {
        return { ...this._bounds };
    }
    setSize(width, height) {
        this._bounds.width = width;
        this._bounds.height = height;
        this.emit('resize');
    }
    getSize() {
        return [this._bounds.width, this._bounds.height];
    }
    setPosition(x, y) {
        this._bounds.x = x;
        this._bounds.y = y;
        this.emit('move');
    }
    getPosition() {
        return [this._bounds.x, this._bounds.y];
    }
    center() {
        this._bounds.x = 0;
        this._bounds.y = 0;
        this.emit('move');
    }
    // Title
    setTitle(title) {
        this._title = title;
        this.emit('page-title-updated', {}, title);
    }
    getTitle() {
        return this._title;
    }
    // Other window properties
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
    // Load methods (delegate to webContents)
    loadURL(url) {
        return this.webContents.loadURL(url);
    }
    loadFile(filePath) {
        return this.webContents.loadFile(filePath);
    }
}
// Assign static methods explicitly for type compatibility
export const BrowserWindow = MockBrowserWindow;
// =============================================================================
// Mock: ipcMain
// =============================================================================
/**
 * Mock ipcMain implementation.
 */
class MockIpcMain extends EventEmitter {
    handle(channel, listener) {
        mockState.ipcMainHandlers.set(channel, listener);
    }
    handleOnce(channel, listener) {
        const wrappedListener = (...args) => {
            mockState.ipcMainHandlers.delete(channel);
            return listener(...args);
        };
        mockState.ipcMainHandlers.set(channel, wrappedListener);
    }
    removeHandler(channel) {
        mockState.ipcMainHandlers.delete(channel);
    }
    on(channel, listener) {
        if (!mockState.ipcMainListeners.has(channel)) {
            mockState.ipcMainListeners.set(channel, new Set());
        }
        mockState.ipcMainListeners.get(channel).add(listener);
        return this;
    }
    once(channel, listener) {
        const wrappedListener = (...args) => {
            this.removeListener(channel, wrappedListener);
            listener(...args);
        };
        return this.on(channel, wrappedListener);
    }
    removeListener(channel, listener) {
        mockState.ipcMainListeners.get(channel)?.delete(listener);
        return this;
    }
    removeAllListeners(channel) {
        if (channel) {
            mockState.ipcMainListeners.delete(channel);
        }
        else {
            mockState.ipcMainListeners.clear();
        }
        return this;
    }
}
export const ipcMain = new MockIpcMain();
// =============================================================================
// Mock: Menu and MenuItem
// =============================================================================
/**
 * Mock MenuItem implementation.
 */
export class MockMenuItem {
    id;
    label;
    type;
    role;
    accelerator;
    icon;
    sublabel;
    toolTip;
    enabled = true;
    visible = true;
    checked = false;
    registerAccelerator = true;
    submenu;
    click;
    constructor(options) {
        Object.assign(this, options);
        if (options.submenu && Array.isArray(options.submenu)) {
            this.submenu = MockMenu.buildFromTemplate(options.submenu);
        }
    }
}
/**
 * Mock Menu implementation.
 */
export class MockMenu {
    items = [];
    constructor() {
        mockState.menus.push(this);
    }
    append(menuItem) {
        this.items.push(menuItem);
    }
    insert(pos, menuItem) {
        this.items.splice(pos, 0, menuItem);
    }
    getMenuItemById(id) {
        return this.items.find(item => item.id === id) || null;
    }
    popup(options) {
        // Mock: emit event for testing
    }
    closePopup(browserWindow) {
        // Mock: emit event for testing
    }
    static setApplicationMenu(menu) {
        mockState.applicationMenu = menu;
    }
    static getApplicationMenu() {
        return mockState.applicationMenu;
    }
    static buildFromTemplate(template) {
        const menu = new MockMenu();
        template.forEach(item => {
            menu.append(new MockMenuItem(item));
        });
        return menu;
    }
}
export const Menu = MockMenu;
export const MenuItem = MockMenuItem;
// =============================================================================
// Mock: Tray
// =============================================================================
/**
 * Mock Tray implementation.
 */
export class MockTray extends EventEmitter {
    _icon;
    _title = '';
    _tooltip = '';
    _contextMenu = null;
    _isDestroyed = false;
    constructor(icon) {
        super();
        this._icon = icon;
        mockState.trays.push(this);
    }
    setImage(icon) {
        this._icon = icon;
    }
    setTitle(title) {
        this._title = title;
    }
    getTitle() {
        return this._title;
    }
    setToolTip(toolTip) {
        this._tooltip = toolTip;
    }
    setContextMenu(menu) {
        this._contextMenu = menu;
    }
    getBounds() {
        return { x: 0, y: 0, width: 16, height: 16 };
    }
    destroy() {
        if (this._isDestroyed)
            return;
        this._isDestroyed = true;
        this.removeAllListeners();
    }
    isDestroyed() {
        return this._isDestroyed;
    }
    popUpContextMenu(menu, position) {
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
export const Tray = MockTray;
// =============================================================================
// Mock: dialog
// =============================================================================
/**
 * Mock dialog module.
 */
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
// =============================================================================
// Mock: shell
// =============================================================================
/**
 * Mock shell module.
 */
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
// =============================================================================
// Mock: screen
// =============================================================================
/**
 * Mock screen module.
 */
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
        accelerometerSupport: 'unknown',
        touchSupport: 'unknown',
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
            accelerometerSupport: 'unknown',
            touchSupport: 'unknown',
        },
    ]),
    getDisplayMatching: vi.fn(),
    getDisplayNearestPoint: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
};
// =============================================================================
// Mock: clipboard
// =============================================================================
/**
 * Mock clipboard module.
 */
let clipboardText = '';
let clipboardHTML = '';
export const clipboard = {
    readText: vi.fn().mockImplementation(() => clipboardText),
    writeText: vi.fn().mockImplementation((text) => { clipboardText = text; }),
    readHTML: vi.fn().mockImplementation(() => clipboardHTML),
    writeHTML: vi.fn().mockImplementation((html) => { clipboardHTML = html; }),
    readImage: vi.fn().mockReturnValue(null),
    writeImage: vi.fn(),
    readRTF: vi.fn().mockReturnValue(''),
    writeRTF: vi.fn(),
    readBookmark: vi.fn().mockReturnValue({ title: '', url: '' }),
    writeBookmark: vi.fn(),
    clear: vi.fn().mockImplementation(() => { clipboardText = ''; clipboardHTML = ''; }),
    availableFormats: vi.fn().mockReturnValue(['text/plain']),
};
// =============================================================================
// Mock: nativeTheme
// =============================================================================
/**
 * Mock nativeTheme module.
 */
class MockNativeTheme extends EventEmitter {
    _themeSource = 'system';
    get themeSource() {
        return this._themeSource;
    }
    set themeSource(value) {
        this._themeSource = value;
        this.emit('updated');
    }
    get shouldUseDarkColors() {
        return this._themeSource === 'dark';
    }
    get shouldUseHighContrastColors() {
        return false;
    }
    get shouldUseInvertedColorScheme() {
        return false;
    }
}
export const nativeTheme = new MockNativeTheme();
// =============================================================================
// Mock: nativeImage
// =============================================================================
/**
 * Mock NativeImage implementation.
 */
export class MockNativeImage {
    _isEmpty = false;
    static createEmpty() {
        const img = new MockNativeImage();
        img._isEmpty = true;
        return img;
    }
    static createFromPath(path) {
        return new MockNativeImage();
    }
    static createFromBuffer(buffer) {
        return new MockNativeImage();
    }
    static createFromDataURL(dataURL) {
        return new MockNativeImage();
    }
    isEmpty() {
        return this._isEmpty;
    }
    getSize() {
        return { width: 16, height: 16 };
    }
    toDataURL() {
        return 'data:image/png;base64,';
    }
    toPNG() {
        return Buffer.from([]);
    }
    toJPEG(quality) {
        return Buffer.from([]);
    }
    toBitmap() {
        return Buffer.from([]);
    }
    resize(options) {
        return this;
    }
    crop(rect) {
        return this;
    }
    getAspectRatio() {
        return 1;
    }
}
export const nativeImage = {
    createEmpty: MockNativeImage.createEmpty,
    createFromPath: MockNativeImage.createFromPath,
    createFromBuffer: MockNativeImage.createFromBuffer,
    createFromDataURL: MockNativeImage.createFromDataURL,
};
// =============================================================================
// Mock: globalShortcut
// =============================================================================
/**
 * Mock globalShortcut module.
 */
const registeredShortcuts = new Map();
export const globalShortcut = {
    register: vi.fn((accelerator, callback) => {
        registeredShortcuts.set(accelerator, callback);
        return true;
    }),
    registerAll: vi.fn((accelerators, callback) => {
        accelerators.forEach(acc => registeredShortcuts.set(acc, callback));
    }),
    isRegistered: vi.fn((accelerator) => registeredShortcuts.has(accelerator)),
    unregister: vi.fn((accelerator) => {
        registeredShortcuts.delete(accelerator);
    }),
    unregisterAll: vi.fn(() => {
        registeredShortcuts.clear();
    }),
};
// =============================================================================
// Mock: Notification
// =============================================================================
/**
 * Mock Notification implementation.
 */
export class MockNotification extends EventEmitter {
    title;
    body;
    static isSupported() {
        return true;
    }
    constructor(options) {
        super();
        this.title = options?.title || '';
        this.body = options?.body || '';
    }
    show() {
        this.emit('show');
    }
    close() {
        this.emit('close');
    }
}
export const Notification = MockNotification;
// =============================================================================
// Mock: session
// =============================================================================
/**
 * Mock session module.
 */
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
    // Returns the same default session mock for simplicity
    }),
};
// =============================================================================
// Mock: powerMonitor
// =============================================================================
/**
 * Mock powerMonitor module.
 */
class MockPowerMonitor extends EventEmitter {
    getSystemIdleState = vi.fn().mockReturnValue('active');
    getSystemIdleTime = vi.fn().mockReturnValue(0);
    isOnBatteryPower = vi.fn().mockReturnValue(false);
}
export const powerMonitor = new MockPowerMonitor();
// =============================================================================
// Mock: powerSaveBlocker
// =============================================================================
/**
 * Mock powerSaveBlocker module.
 */
let powerSaveBlockerId = 0;
const activeBlockers = new Set();
export const powerSaveBlocker = {
    start: vi.fn((type) => {
        const id = ++powerSaveBlockerId;
        activeBlockers.add(id);
        return id;
    }),
    stop: vi.fn((id) => {
        activeBlockers.delete(id);
    }),
    isStarted: vi.fn((id) => activeBlockers.has(id)),
};
// =============================================================================
// Mock: systemPreferences
// =============================================================================
/**
 * Mock systemPreferences module.
 */
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
// =============================================================================
// Mock: autoUpdater
// =============================================================================
/**
 * Mock autoUpdater module.
 */
class MockAutoUpdater extends EventEmitter {
    _feedURL = '';
    setFeedURL(options) {
        this._feedURL = options.url;
    }
    getFeedURL() {
        return this._feedURL;
    }
    checkForUpdates() {
        this.emit('checking-for-update');
    }
    quitAndInstall() {
        this.emit('before-quit-for-update');
        app.quit();
    }
}
export const autoUpdater = new MockAutoUpdater();
// =============================================================================
// Mock: contextBridge
// =============================================================================
/**
 * Mock contextBridge module.
 */
export const contextBridge = {
    exposeInMainWorld: vi.fn((apiKey, api) => {
        // In tests, we can store exposed APIs for verification
        globalThis[apiKey] = api;
    }),
};
// =============================================================================
// Mock: ipcRenderer
// =============================================================================
/**
 * Mock ipcRenderer module.
 */
class MockIpcRenderer extends EventEmitter {
    send(channel, ...args) {
        // Trigger any registered ipcMain listeners
        const listeners = mockState.ipcMainListeners.get(channel);
        if (listeners) {
            const event = { sender: this, reply: vi.fn() };
            listeners.forEach(listener => listener(event, ...args));
        }
    }
    sendSync(channel, ...args) {
        return undefined;
    }
    sendTo(webContentsId, channel, ...args) {
        // Mock: send to specific renderer
    }
    sendToHost(channel, ...args) {
        // Mock: send to host
    }
    async invoke(channel, ...args) {
        const handler = mockState.ipcMainHandlers.get(channel);
        if (handler) {
            const event = { sender: this };
            return handler(event, ...args);
        }
        throw new Error(`No handler registered for '${channel}'`);
    }
    postMessage(channel, message, transfer) {
        // Mock: post message
    }
}
export const ipcRenderer = new MockIpcRenderer();
// =============================================================================
// Default Export
// =============================================================================
/**
 * The complete mock Electron module.
 * This is what gets imported when tests import 'electron'.
 */
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
/**
 * Export mock state and reset function for test control.
 */
export const mockElectron = {
    state: mockState,
    reset: resetMockState,
};
// =============================================================================
// Mock Documentation
// =============================================================================
//
// This file provides comprehensive mocks for Electron's APIs:
//
// Main Process:
// - app: Application lifecycle and paths
// - BrowserWindow: Window creation and management
// - ipcMain: Main process IPC handlers
// - Menu/MenuItem: Application menus
// - Tray: System tray
// - dialog: Native dialogs
// - shell: OS integration
// - globalShortcut: Global keyboard shortcuts
// - autoUpdater: Application updates
// - session: Network session management
// - powerMonitor/powerSaveBlocker: Power management
// - systemPreferences: OS preferences
//
// Renderer Process:
// - ipcRenderer: Renderer process IPC
// - contextBridge: Secure API exposure
//
// Both:
// - clipboard: Clipboard access
// - nativeTheme: Theme detection
// - nativeImage: Image handling
// - Notification: Desktop notifications
// - screen: Display information
//
// Testing Usage:
//
//   import { app, BrowserWindow, mockElectron } from 'electron';
//
//   beforeEach(() => {
//     mockElectron.reset();
//   });
//
//   it('creates a window', () => {
//     const win = new BrowserWindow({ width: 800, height: 600 });
//     expect(mockElectron.state.windows).toHaveLength(1);
//   });
//
// =============================================================================
//
// Last Updated: 2026-02-10
// Maintained by: ZYNC Electron Team
//
// =============================================================================
//# sourceMappingURL=electron.js.map