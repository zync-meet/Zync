import { globalShortcut, BrowserWindow, app } from 'electron';
import { logger } from '../utils/logger.js';


export interface ShortcutEntry {

    accelerator: string;

    description: string;

    handler: () => void;

    registered: boolean;

    enabled: boolean;
}


export interface ShortcutRegistrationResult {

    success: boolean;

    error?: string;
}


export const DEFAULT_SHORTCUTS = {

    TOGGLE_WINDOW: 'CommandOrControl+Shift+Z',

    OPEN_SETTINGS: 'CommandOrControl+,',

    QUICK_NOTE: 'CommandOrControl+Shift+N',

    CAPTURE_SCREEN: 'CommandOrControl+Shift+4',

    TOGGLE_FOCUS: 'CommandOrControl+Shift+F',
} as const;


export class ShortcutManagerService {

    private mainWindow: BrowserWindow | null;


    private shortcuts: Map<string, ShortcutEntry> = new Map();


    private log = logger;


    constructor(mainWindow: BrowserWindow | null = null) {
        this.mainWindow = mainWindow;
    }


    register(
        accelerator: string,
        description: string,
        handler: () => void,
    ): ShortcutRegistrationResult {

        if (this.shortcuts.has(accelerator)) {
            return { success: false, error: `Shortcut already registered: ${accelerator}` };
        }

        try {
            const success = globalShortcut.register(accelerator, handler);

            if (!success) {
                this.log.error(`Failed to register shortcut: ${accelerator}`);
                return { success: false, error: 'Registration failed (may conflict with OS shortcut)' };
            }

            this.shortcuts.set(accelerator, {
                accelerator,
                description,
                handler,
                registered: true,
                enabled: true,
            });

            this.log.info(`Shortcut registered: ${accelerator} → ${description}`);
            return { success: true };
        } catch (err) {
            this.log.error(`Error registering shortcut ${accelerator}:`, err);
            return { success: false, error: String(err) };
        }
    }


    unregister(accelerator: string): boolean {
        const entry = this.shortcuts.get(accelerator);
        if (!entry) return false;

        globalShortcut.unregister(accelerator);
        this.shortcuts.delete(accelerator);
        this.log.info(`Shortcut unregistered: ${accelerator}`);
        return true;
    }


    unregisterAll(): void {
        globalShortcut.unregisterAll();
        this.shortcuts.clear();
        this.log.info('All shortcuts unregistered');
    }


    disable(accelerator: string): boolean {
        const entry = this.shortcuts.get(accelerator);
        if (!entry || !entry.enabled) return false;

        globalShortcut.unregister(accelerator);
        entry.registered = false;
        entry.enabled = false;
        this.log.info(`Shortcut disabled: ${accelerator}`);
        return true;
    }


    enable(accelerator: string): boolean {
        const entry = this.shortcuts.get(accelerator);
        if (!entry || entry.enabled) return false;

        const success = globalShortcut.register(accelerator, entry.handler);
        if (success) {
            entry.registered = true;
            entry.enabled = true;
            this.log.info(`Shortcut re-enabled: ${accelerator}`);
        }
        return success;
    }


    isRegistered(accelerator: string): boolean {
        return globalShortcut.isRegistered(accelerator);
    }


    getAll(): ShortcutEntry[] {
        return Array.from(this.shortcuts.values()).map((e) => ({
            ...e,
            handler: e.handler,
        }));
    }


    get(accelerator: string): ShortcutEntry | undefined {
        return this.shortcuts.get(accelerator);
    }


    registerDefaults(): void {

        this.register(DEFAULT_SHORTCUTS.TOGGLE_WINDOW, 'Toggle ZYNC Window', () => {
            if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
            if (this.mainWindow.isVisible()) {
                this.mainWindow.hide();
            } else {
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        });

        this.log.info('Default shortcuts registered');
    }


    setMainWindow(window: BrowserWindow | null): void {
        this.mainWindow = window;
    }


    dispose(): void {
        this.unregisterAll();
        this.mainWindow = null;
        this.log.info('Shortcut manager disposed');
    }
}
