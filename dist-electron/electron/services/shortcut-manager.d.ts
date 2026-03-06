import { BrowserWindow } from 'electron';
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
export declare const DEFAULT_SHORTCUTS: {
    readonly TOGGLE_WINDOW: "CommandOrControl+Shift+Z";
    readonly OPEN_SETTINGS: "CommandOrControl+,";
    readonly QUICK_NOTE: "CommandOrControl+Shift+N";
    readonly CAPTURE_SCREEN: "CommandOrControl+Shift+4";
    readonly TOGGLE_FOCUS: "CommandOrControl+Shift+F";
};
export declare class ShortcutManagerService {
    private mainWindow;
    private shortcuts;
    private log;
    constructor(mainWindow?: BrowserWindow | null);
    register(accelerator: string, description: string, handler: () => void): ShortcutRegistrationResult;
    unregister(accelerator: string): boolean;
    unregisterAll(): void;
    disable(accelerator: string): boolean;
    enable(accelerator: string): boolean;
    isRegistered(accelerator: string): boolean;
    getAll(): ShortcutEntry[];
    get(accelerator: string): ShortcutEntry | undefined;
    registerDefaults(): void;
    setMainWindow(window: BrowserWindow | null): void;
    dispose(): void;
}
