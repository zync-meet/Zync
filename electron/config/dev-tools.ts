import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';


export interface DevToolsConfig {

    autoOpen: boolean;

    mode: 'right' | 'bottom' | 'undocked' | 'detach';

    reactDevTools: boolean;

    reduxDevTools: boolean;

    sourceMaps: boolean;

    showFPS: boolean;

    paintFlashing: boolean;

    logIPC: boolean;
}


export const DEFAULT_DEV_TOOLS_CONFIG: DevToolsConfig = {
    autoOpen: true,
    mode: 'right',
    reactDevTools: true,
    reduxDevTools: false,
    sourceMaps: true,
    showFPS: false,
    paintFlashing: false,
    logIPC: false,
};


const log = logger;
const isDev = !app.isPackaged;


export function configureDevTools(
    window: BrowserWindow,
    options: Partial<DevToolsConfig> = {},
): void {
    if (!isDev) {return;}

    const config = { ...DEFAULT_DEV_TOOLS_CONFIG, ...options };


    if (config.autoOpen) {
        window.webContents.openDevTools({ mode: config.mode });
    }


    window.webContents.on('before-input-event', (event, input) => {

        if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
            window.webContents.toggleDevTools();
        }


        if (input.control && input.shift && input.key === 'R') {
            window.webContents.reloadIgnoringCache();
        }
    });

    log.info(`DevTools configured for window (mode: ${config.mode})`);
}


export async function installReactDevTools(): Promise<boolean> {
    if (!isDev) {return false;}

    try {

        const installer = await import('electron-devtools-installer').catch(() => null);

        if (installer) {
            const { default: installExtension, REACT_DEVELOPER_TOOLS } = installer;
            await installExtension(REACT_DEVELOPER_TOOLS);
            log.info('React DevTools extension installed');
            return true;
        }

        log.info('electron-devtools-installer not available, skipping React DevTools');
        return false;
    } catch (err) {
        log.error('Failed to install React DevTools:', err);
        return false;
    }
}


export function openDevTools(
    window: BrowserWindow,
    mode: DevToolsConfig['mode'] = 'right',
): void {
    if (window.isDestroyed()) {return;}
    window.webContents.openDevTools({ mode });
}


export function closeDevTools(window: BrowserWindow): void {
    if (window.isDestroyed()) {return;}
    if (window.webContents.isDevToolsOpened()) {
        window.webContents.closeDevTools();
    }
}


export function toggleDevTools(window: BrowserWindow): void {
    if (window.isDestroyed()) {return;}
    window.webContents.toggleDevTools();
}


export function isDevToolsOpen(window: BrowserWindow): boolean {
    if (window.isDestroyed()) {return false;}
    return window.webContents.isDevToolsOpened();
}


export function logRegisteredHandlers(): void {
    if (!isDev) {return;}
    log.info('=== DevTools: IPC channel audit (manual check required) ===');
    log.info('Use electron-ipc-debug for runtime IPC logging');
}


export function enableCSPLogging(window: BrowserWindow): void {
    if (!isDev || window.isDestroyed()) {return;}

    window.webContents.on('console-message', (_event, level, message) => {
        if (message.includes('Content Security Policy') || message.includes('CSP')) {
            log.warn(`[CSP Violation] ${message}`);
        }
    });

    log.info('CSP violation logging enabled');
}
