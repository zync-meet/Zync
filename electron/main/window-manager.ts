import {
    BrowserWindow,
    BrowserWindowConstructorOptions,
    screen,
} from 'electron';


export type WindowType = 'main' | 'settings' | 'splash' | 'about' | 'overlay';


interface WindowEntry {

    window: BrowserWindow;


    type: WindowType;


    createdAt: number;


    persistent: boolean;
}


export interface ManagedWindowOptions extends BrowserWindowConstructorOptions {

    type: WindowType;


    persistent?: boolean;


    loadURL?: string;


    loadFile?: string;


    center?: boolean;


    showOnReady?: boolean;
}


const windowRegistry = new Map<number, WindowEntry>();


export function createManagedWindow(options: ManagedWindowOptions): BrowserWindow {
    const {
        type,
        persistent = false,
        loadURL: url,
        loadFile: file,
        center: shouldCenter = false,
        showOnReady = false,
        ...windowOptions
    } = options;


    const window = new BrowserWindow({
        show: false,
        ...windowOptions,
    });


    const entry: WindowEntry = {
        window,
        type,
        createdAt: Date.now(),
        persistent,
    };

    windowRegistry.set(window.id, entry);
    console.log(`[WINDOW-MANAGER] Created ${type} window (id=${window.id})`);


    if (shouldCenter) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        const bounds = window.getBounds();

        window.setPosition(
            Math.round((screenWidth - bounds.width) / 2),
            Math.round((screenHeight - bounds.height) / 2),
        );
    }


    if (showOnReady) {
        window.once('ready-to-show', () => {
            window.show();
        });
    }


    if (persistent) {
        window.on('close', (event) => {

            if (!(window as any).__forceClose) {
                event.preventDefault();
                window.hide();
            }
        });
    }


    window.on('closed', () => {
        windowRegistry.delete(window.id);
        console.log(`[WINDOW-MANAGER] Removed ${type} window (id=${window.id}) from registry`);
    });


    if (url) {
        window.loadURL(url).catch((err) => {
            console.error(`[WINDOW-MANAGER] Failed to load URL for ${type} window:`, err);
        });
    } else if (file) {
        window.loadFile(file).catch((err) => {
            console.error(`[WINDOW-MANAGER] Failed to load file for ${type} window:`, err);
        });
    }

    return window;
}


export function getAllWindows(): WindowEntry[] {
    return Array.from(windowRegistry.values());
}


export function getWindowsByType(type: WindowType): WindowEntry[] {
    return Array.from(windowRegistry.values()).filter((entry) => entry.type === type);
}


export function getWindowByType(type: WindowType): WindowEntry | null {
    for (const entry of windowRegistry.values()) {
        if (entry.type === type) return entry;
    }
    return null;
}


export function getWindowById(id: number): WindowEntry | null {
    return windowRegistry.get(id) ?? null;
}


export function hasWindowOfType(type: WindowType): boolean {
    for (const entry of windowRegistry.values()) {
        if (entry.type === type && !entry.window.isDestroyed()) return true;
    }
    return false;
}


export function getWindowCount(): number {
    return windowRegistry.size;
}


export function focusWindow(type: WindowType): boolean {
    const entry = getWindowByType(type);
    if (!entry || entry.window.isDestroyed()) return false;

    if (!entry.window.isVisible()) {
        entry.window.show();
    }

    if (entry.window.isMinimized()) {
        entry.window.restore();
    }

    entry.window.focus();
    return true;
}


export function closeWindowsByType(type: WindowType): number {
    let count = 0;

    for (const entry of windowRegistry.values()) {
        if (entry.type === type && !entry.window.isDestroyed()) {

            (entry.window as any).__forceClose = true;
            entry.window.close();
            count++;
        }
    }

    return count;
}


export function closeAllExcept(exceptTypes: WindowType[] = []): number {
    let count = 0;

    for (const entry of windowRegistry.values()) {
        if (!exceptTypes.includes(entry.type) && !entry.window.isDestroyed()) {
            (entry.window as any).__forceClose = true;
            entry.window.close();
            count++;
        }
    }

    return count;
}


export function broadcastToType(type: WindowType, channel: string, ...args: unknown[]): void {
    for (const entry of windowRegistry.values()) {
        if (entry.type === type && !entry.window.isDestroyed()) {
            entry.window.webContents.send(channel, ...args);
        }
    }
}


export function broadcastToAll(channel: string, ...args: unknown[]): void {
    for (const entry of windowRegistry.values()) {
        if (!entry.window.isDestroyed()) {
            entry.window.webContents.send(channel, ...args);
        }
    }
}


export function destroyAllWindows(): void {
    for (const entry of windowRegistry.values()) {
        if (!entry.window.isDestroyed()) {
            (entry.window as any).__forceClose = true;
            entry.window.destroy();
        }
    }

    windowRegistry.clear();
    console.log('[WINDOW-MANAGER] All windows destroyed');
}
