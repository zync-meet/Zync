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
import { EventEmitter } from 'node:events';
/**
 * Internal state for tracking mock behavior across tests.
 */
export interface MockElectronState {
    /**
     * All BrowserWindow instances created during tests.
     */
    windows: MockBrowserWindow[];
    /**
     * All Tray instances created during tests.
     */
    trays: MockTray[];
    /**
     * All Menu instances created during tests.
     */
    menus: MockMenu[];
    /**
     * Current application menu.
     */
    applicationMenu: MockMenu | null;
    /**
     * Registered IPC handlers (main process).
     */
    ipcMainHandlers: Map<string, (...args: unknown[]) => unknown>;
    /**
     * Registered IPC listeners (main process).
     */
    ipcMainListeners: Map<string, Set<(...args: unknown[]) => void>>;
    /**
     * Whether the app.whenReady() promise has been resolved.
     */
    isReady: boolean;
    /**
     * App path overrides for testing.
     */
    pathOverrides: Map<string, string>;
    /**
     * Last dialog response (for controlling dialog mock behavior).
     */
    dialogResponse: unknown;
}
/**
 * The mock state singleton.
 */
export declare const mockState: MockElectronState;
/**
 * Reset the mock state between tests.
 */
export declare function resetMockState(): void;
/**
 * Mock implementation of Electron's app module.
 */
declare class MockApp extends EventEmitter {
    private _name;
    private _version;
    private _isPackaged;
    private _isQuitting;
    get name(): string;
    set name(value: string);
    getVersion(): string;
    getName(): string;
    setName(name: string): void;
    get isPackaged(): boolean;
    quit(): void;
    exit(exitCode?: number): void;
    relaunch(options?: {
        args?: string[];
        execPath?: string;
    }): void;
    isReady(): boolean;
    whenReady(): Promise<void>;
    focus(options?: {
        steal?: boolean;
    }): void;
    hide(): void;
    show(): void;
    getPath(name: string): string;
    setPath(name: string, path: string): void;
    getAppPath(): string;
    getLocale(): string;
    getLocaleCountryCode(): string;
    getSystemLocale(): string;
    setBadgeCount(count: number): boolean;
    getBadgeCount(): number;
    dock: {
        bounce: any;
        cancelBounce: any;
        setBadge: any;
        getBadge: any;
        hide: any;
        show: any;
        isVisible: any;
        setMenu: any;
        getMenu: any;
        setIcon: any;
    };
    setLoginItemSettings: any;
    getLoginItemSettings: any;
    requestSingleInstanceLock: any;
    hasSingleInstanceLock: any;
    releaseSingleInstanceLock: any;
    commandLine: {
        appendSwitch: any;
        appendArgument: any;
        hasSwitch: any;
        getSwitchValue: any;
    };
    setUserTasks: any;
    setJumpList: any;
    getJumpListSettings: any;
    setAboutPanelOptions: any;
    showAboutPanel: any;
    setAccessibilitySupportEnabled: any;
    isAccessibilitySupportEnabled: any;
    setAsDefaultProtocolClient: any;
    removeAsDefaultProtocolClient: any;
    isDefaultProtocolClient: any;
    enableSandbox: any;
}
export declare const app: MockApp;
/**
 * Mock WebContents implementation.
 */
export declare class MockWebContents extends EventEmitter {
    id: number;
    private _url;
    constructor(id: number);
    loadURL(url: string): Promise<void>;
    loadFile(filePath: string): Promise<void>;
    getURL(): string;
    getTitle(): string;
    send(channel: string, ...args: unknown[]): void;
    openDevTools: any;
    closeDevTools: any;
    isDevToolsOpened: any;
    toggleDevTools: any;
    reload: any;
    reloadIgnoringCache: any;
    canGoBack: any;
    canGoForward: any;
    goBack: any;
    goForward: any;
    setZoomFactor: any;
    getZoomFactor: any;
    setZoomLevel: any;
    getZoomLevel: any;
    setAudioMuted: any;
    isAudioMuted: any;
    copy: any;
    cut: any;
    paste: any;
    selectAll: any;
    undo: any;
    redo: any;
    print: any;
    printToPDF: any;
    executeJavaScript: any;
    insertCSS: any;
    session: {
        clearCache: any;
        clearStorageData: any;
    };
}
/**
 * Mock BrowserWindow implementation.
 */
export declare class MockBrowserWindow extends EventEmitter {
    private static _windowIdCounter;
    readonly id: number;
    readonly webContents: MockWebContents;
    private _bounds;
    private _title;
    private _isVisible;
    private _isMinimized;
    private _isMaximized;
    private _isFullScreen;
    private _isFocused;
    private _isDestroyed;
    private _options;
    constructor(options?: Electron.BrowserWindowConstructorOptions);
    static getAllWindows(): MockBrowserWindow[];
    static getFocusedWindow(): MockBrowserWindow | null;
    static fromId(id: number): MockBrowserWindow | null;
    static fromWebContents(webContents: MockWebContents): MockBrowserWindow | null;
    show(): void;
    hide(): void;
    close(): void;
    destroy(): void;
    focus(): void;
    blur(): void;
    isFocused(): boolean;
    isDestroyed(): boolean;
    isVisible(): boolean;
    minimize(): void;
    restore(): void;
    isMinimized(): boolean;
    maximize(): void;
    unmaximize(): void;
    isMaximized(): boolean;
    setFullScreen(flag: boolean): void;
    isFullScreen(): boolean;
    setBounds(bounds: Partial<Electron.Rectangle>): void;
    getBounds(): Electron.Rectangle;
    setSize(width: number, height: number): void;
    getSize(): [number, number];
    setPosition(x: number, y: number): void;
    getPosition(): [number, number];
    center(): void;
    setTitle(title: string): void;
    getTitle(): string;
    setAlwaysOnTop: any;
    isAlwaysOnTop: any;
    setResizable: any;
    isResizable: any;
    setMovable: any;
    isMovable: any;
    setMinimizable: any;
    isMinimizable: any;
    setMaximizable: any;
    isMaximizable: any;
    setClosable: any;
    isClosable: any;
    setSkipTaskbar: any;
    setMenu: any;
    setAutoHideMenuBar: any;
    isMenuBarAutoHide: any;
    setMenuBarVisibility: any;
    isMenuBarVisible: any;
    setProgressBar: any;
    setOverlayIcon: any;
    setHasShadow: any;
    hasShadow: any;
    setOpacity: any;
    getOpacity: any;
    setBackgroundColor: any;
    getBackgroundColor: any;
    flashFrame: any;
    setIcon: any;
    loadURL(url: string): Promise<void>;
    loadFile(filePath: string): Promise<void>;
}
export declare const BrowserWindow: typeof Electron.BrowserWindow;
/**
 * Mock ipcMain implementation.
 */
declare class MockIpcMain extends EventEmitter {
    handle(channel: string, listener: (...args: unknown[]) => unknown): void;
    handleOnce(channel: string, listener: (...args: unknown[]) => unknown): void;
    removeHandler(channel: string): void;
    on(channel: string, listener: (...args: unknown[]) => void): this;
    once(channel: string, listener: (...args: unknown[]) => void): this;
    removeListener(channel: string, listener: (...args: unknown[]) => void): this;
    removeAllListeners(channel?: string): this;
}
export declare const ipcMain: MockIpcMain;
/**
 * Mock MenuItem implementation.
 */
export declare class MockMenuItem {
    id?: string;
    label?: string;
    type?: Electron.MenuItemConstructorOptions['type'];
    role?: Electron.MenuItemConstructorOptions['role'];
    accelerator?: string;
    icon?: unknown;
    sublabel?: string;
    toolTip?: string;
    enabled: boolean;
    visible: boolean;
    checked: boolean;
    registerAccelerator: boolean;
    submenu?: MockMenu;
    click?: (menuItem: MockMenuItem, browserWindow: MockBrowserWindow | undefined, event: Electron.KeyboardEvent) => void;
    constructor(options: Electron.MenuItemConstructorOptions);
}
/**
 * Mock Menu implementation.
 */
export declare class MockMenu {
    items: MockMenuItem[];
    constructor();
    append(menuItem: MockMenuItem): void;
    insert(pos: number, menuItem: MockMenuItem): void;
    getMenuItemById(id: string): MockMenuItem | null;
    popup(options?: Electron.PopupOptions): void;
    closePopup(browserWindow?: MockBrowserWindow): void;
    static setApplicationMenu(menu: MockMenu | null): void;
    static getApplicationMenu(): MockMenu | null;
    static buildFromTemplate(template: Electron.MenuItemConstructorOptions[]): MockMenu;
}
export declare const Menu: typeof Electron.Menu;
export declare const MenuItem: typeof Electron.MenuItem;
/**
 * Mock Tray implementation.
 */
export declare class MockTray extends EventEmitter {
    private _icon;
    private _title;
    private _tooltip;
    private _contextMenu;
    private _isDestroyed;
    constructor(icon: unknown);
    setImage(icon: unknown): void;
    setTitle(title: string): void;
    getTitle(): string;
    setToolTip(toolTip: string): void;
    setContextMenu(menu: MockMenu | null): void;
    getBounds(): Electron.Rectangle;
    destroy(): void;
    isDestroyed(): boolean;
    popUpContextMenu(menu?: MockMenu, position?: Electron.Point): void;
    setIgnoreDoubleClickEvents: any;
    getIgnoreDoubleClickEvents: any;
    displayBalloon: any;
    removeBalloon: any;
    focus: any;
}
export declare const Tray: typeof Electron.Tray;
/**
 * Mock dialog module.
 */
export declare const dialog: {
    showOpenDialog: any;
    showOpenDialogSync: any;
    showSaveDialog: any;
    showSaveDialogSync: any;
    showMessageBox: any;
    showMessageBoxSync: any;
    showErrorBox: any;
    showCertificateTrustDialog: any;
};
/**
 * Mock shell module.
 */
export declare const shell: {
    openExternal: any;
    openPath: any;
    showItemInFolder: any;
    moveItemToTrash: any;
    beep: any;
    readShortcutLink: any;
    writeShortcutLink: any;
};
/**
 * Mock screen module.
 */
export declare const screen: {
    getCursorScreenPoint: any;
    getPrimaryDisplay: any;
    getAllDisplays: any;
    getDisplayMatching: any;
    getDisplayNearestPoint: any;
    on: any;
    once: any;
    removeListener: any;
    removeAllListeners: any;
};
export declare const clipboard: {
    readText: any;
    writeText: any;
    readHTML: any;
    writeHTML: any;
    readImage: any;
    writeImage: any;
    readRTF: any;
    writeRTF: any;
    readBookmark: any;
    writeBookmark: any;
    clear: any;
    availableFormats: any;
};
/**
 * Mock nativeTheme module.
 */
declare class MockNativeTheme extends EventEmitter {
    private _themeSource;
    get themeSource(): 'system' | 'light' | 'dark';
    set themeSource(value: 'system' | 'light' | 'dark');
    get shouldUseDarkColors(): boolean;
    get shouldUseHighContrastColors(): boolean;
    get shouldUseInvertedColorScheme(): boolean;
}
export declare const nativeTheme: MockNativeTheme;
/**
 * Mock NativeImage implementation.
 */
export declare class MockNativeImage {
    private _isEmpty;
    static createEmpty(): MockNativeImage;
    static createFromPath(path: string): MockNativeImage;
    static createFromBuffer(buffer: Buffer): MockNativeImage;
    static createFromDataURL(dataURL: string): MockNativeImage;
    isEmpty(): boolean;
    getSize(): {
        width: number;
        height: number;
    };
    toDataURL(): string;
    toPNG(): Buffer;
    toJPEG(quality: number): Buffer;
    toBitmap(): Buffer;
    resize(options: {
        width?: number;
        height?: number;
    }): MockNativeImage;
    crop(rect: Electron.Rectangle): MockNativeImage;
    getAspectRatio(): number;
}
export declare const nativeImage: {
    createEmpty: typeof MockNativeImage.createEmpty;
    createFromPath: typeof MockNativeImage.createFromPath;
    createFromBuffer: typeof MockNativeImage.createFromBuffer;
    createFromDataURL: typeof MockNativeImage.createFromDataURL;
};
export declare const globalShortcut: {
    register: any;
    registerAll: any;
    isRegistered: any;
    unregister: any;
    unregisterAll: any;
};
/**
 * Mock Notification implementation.
 */
export declare class MockNotification extends EventEmitter {
    title: string;
    body: string;
    static isSupported(): boolean;
    constructor(options?: Electron.NotificationConstructorOptions);
    show(): void;
    close(): void;
}
export declare const Notification: typeof Electron.Notification;
/**
 * Mock session module.
 */
export declare const session: {
    defaultSession: {
        clearCache: any;
        clearStorageData: any;
        setProxy: any;
        resolveProxy: any;
        getCacheSize: any;
        getUserAgent: any;
        setUserAgent: any;
        webRequest: {
            onBeforeRequest: any;
            onBeforeSendHeaders: any;
            onSendHeaders: any;
            onHeadersReceived: any;
            onResponseStarted: any;
            onBeforeRedirect: any;
            onCompleted: any;
            onErrorOccurred: any;
        };
        protocol: {
            registerFileProtocol: any;
            registerHttpProtocol: any;
            registerStringProtocol: any;
            registerBufferProtocol: any;
            unregisterProtocol: any;
            isProtocolRegistered: any;
        };
        cookies: {
            get: any;
            set: any;
            remove: any;
            flushStore: any;
        };
    };
    fromPartition: any;
};
/**
 * Mock powerMonitor module.
 */
declare class MockPowerMonitor extends EventEmitter {
    getSystemIdleState: any;
    getSystemIdleTime: any;
    isOnBatteryPower: any;
}
export declare const powerMonitor: MockPowerMonitor;
export declare const powerSaveBlocker: {
    start: any;
    stop: any;
    isStarted: any;
};
/**
 * Mock systemPreferences module.
 */
export declare const systemPreferences: {
    isDarkMode: any;
    isAeroGlassEnabled: any;
    getAccentColor: any;
    getColor: any;
    getSystemColor: any;
    isHighContrastColorScheme: any;
    getAnimationSettings: any;
    askForMediaAccess: any;
    getMediaAccessStatus: any;
    isTrustedAccessibilityClient: any;
    on: any;
    once: any;
    removeListener: any;
};
/**
 * Mock autoUpdater module.
 */
declare class MockAutoUpdater extends EventEmitter {
    private _feedURL;
    setFeedURL(options: {
        url: string;
    }): void;
    getFeedURL(): string;
    checkForUpdates(): void;
    quitAndInstall(): void;
}
export declare const autoUpdater: MockAutoUpdater;
/**
 * Mock contextBridge module.
 */
export declare const contextBridge: {
    exposeInMainWorld: any;
};
/**
 * Mock ipcRenderer module.
 */
declare class MockIpcRenderer extends EventEmitter {
    send(channel: string, ...args: unknown[]): void;
    sendSync(channel: string, ...args: unknown[]): unknown;
    sendTo(webContentsId: number, channel: string, ...args: unknown[]): void;
    sendToHost(channel: string, ...args: unknown[]): void;
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    postMessage(channel: string, message: unknown, transfer?: MessagePort[]): void;
}
export declare const ipcRenderer: MockIpcRenderer;
/**
 * The complete mock Electron module.
 * This is what gets imported when tests import 'electron'.
 */
declare const _default: {
    app: MockApp;
    BrowserWindow: typeof Electron.BrowserWindow;
    ipcMain: MockIpcMain;
    ipcRenderer: MockIpcRenderer;
    Menu: typeof Electron.Menu;
    MenuItem: typeof Electron.MenuItem;
    Tray: typeof Electron.Tray;
    dialog: {
        showOpenDialog: any;
        showOpenDialogSync: any;
        showSaveDialog: any;
        showSaveDialogSync: any;
        showMessageBox: any;
        showMessageBoxSync: any;
        showErrorBox: any;
        showCertificateTrustDialog: any;
    };
    shell: {
        openExternal: any;
        openPath: any;
        showItemInFolder: any;
        moveItemToTrash: any;
        beep: any;
        readShortcutLink: any;
        writeShortcutLink: any;
    };
    screen: {
        getCursorScreenPoint: any;
        getPrimaryDisplay: any;
        getAllDisplays: any;
        getDisplayMatching: any;
        getDisplayNearestPoint: any;
        on: any;
        once: any;
        removeListener: any;
        removeAllListeners: any;
    };
    clipboard: {
        readText: any;
        writeText: any;
        readHTML: any;
        writeHTML: any;
        readImage: any;
        writeImage: any;
        readRTF: any;
        writeRTF: any;
        readBookmark: any;
        writeBookmark: any;
        clear: any;
        availableFormats: any;
    };
    nativeTheme: MockNativeTheme;
    nativeImage: {
        createEmpty: typeof MockNativeImage.createEmpty;
        createFromPath: typeof MockNativeImage.createFromPath;
        createFromBuffer: typeof MockNativeImage.createFromBuffer;
        createFromDataURL: typeof MockNativeImage.createFromDataURL;
    };
    globalShortcut: {
        register: any;
        registerAll: any;
        isRegistered: any;
        unregister: any;
        unregisterAll: any;
    };
    Notification: typeof Electron.Notification;
    session: {
        defaultSession: {
            clearCache: any;
            clearStorageData: any;
            setProxy: any;
            resolveProxy: any;
            getCacheSize: any;
            getUserAgent: any;
            setUserAgent: any;
            webRequest: {
                onBeforeRequest: any;
                onBeforeSendHeaders: any;
                onSendHeaders: any;
                onHeadersReceived: any;
                onResponseStarted: any;
                onBeforeRedirect: any;
                onCompleted: any;
                onErrorOccurred: any;
            };
            protocol: {
                registerFileProtocol: any;
                registerHttpProtocol: any;
                registerStringProtocol: any;
                registerBufferProtocol: any;
                unregisterProtocol: any;
                isProtocolRegistered: any;
            };
            cookies: {
                get: any;
                set: any;
                remove: any;
                flushStore: any;
            };
        };
        fromPartition: any;
    };
    powerMonitor: MockPowerMonitor;
    powerSaveBlocker: {
        start: any;
        stop: any;
        isStarted: any;
    };
    systemPreferences: {
        isDarkMode: any;
        isAeroGlassEnabled: any;
        getAccentColor: any;
        getColor: any;
        getSystemColor: any;
        isHighContrastColorScheme: any;
        getAnimationSettings: any;
        askForMediaAccess: any;
        getMediaAccessStatus: any;
        isTrustedAccessibilityClient: any;
        on: any;
        once: any;
        removeListener: any;
    };
    autoUpdater: MockAutoUpdater;
    contextBridge: {
        exposeInMainWorld: any;
    };
};
export default _default;
/**
 * Export mock state and reset function for test control.
 */
export declare const mockElectron: {
    state: MockElectronState;
    reset: typeof resetMockState;
};
