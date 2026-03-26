import { app, BrowserWindow, shell } from 'electron';
import { WEB_APP_URL, DEV_SERVER_URL } from './constants.js';


const ALLOWED_NAVIGATION_ORIGINS: string[] = [
    new URL(WEB_APP_URL).origin,
    new URL(DEV_SERVER_URL).origin,
    'https://accounts.google.com',
    'https://github.com',
    'https://zync-7c9b0.firebaseapp.com',
    'https://zync-it.vercel.app',
];


const ALLOWED_POPUP_ORIGINS: string[] = [
    'https://accounts.google.com',
    'https://github.com',
    'https://zync-7c9b0.firebaseapp.com',
    new URL(DEV_SERVER_URL).origin,
];


const BLOCKED_PROTOCOLS: string[] = [
    'javascript:',
    'vbscript:',
    'data:',
    'blob:',
];


function isAllowedNavigation(url: string): boolean {

    if (url.startsWith('file://')) {return true;}


    for (const protocol of BLOCKED_PROTOCOLS) {
        if (url.startsWith(protocol)) {return false;}
    }


    if (!app.isPackaged && url.includes('localhost')) {return true;}


    try {
        const urlOrigin = new URL(url).origin;
        return ALLOWED_NAVIGATION_ORIGINS.includes(urlOrigin);
    } catch {
        return false;
    }
}


function isAllowedPopup(url: string): boolean {
    try {
        const urlOrigin = new URL(url).origin;
        return ALLOWED_POPUP_ORIGINS.includes(urlOrigin);
    } catch {
        return false;
    }
}


export function hardenWindow(window: BrowserWindow): void {
    const webContents = window.webContents;


    webContents.on('will-navigate', (event, navigationUrl) => {
        if (!isAllowedNavigation(navigationUrl)) {
            console.warn(`[Security] Blocked navigation to: ${navigationUrl}`);
            event.preventDefault();


            try {
                const parsed = new URL(navigationUrl);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                    shell.openExternal(navigationUrl).catch((err) => {
                        console.error(`[Security] Failed to open blocked URL externally: ${err.message}`);
                    });
                }
            } catch (error) {
                console.warn(`[Security] Silent fail during URL parsing for external open: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });


    webContents.setWindowOpenHandler(({ url }) => {

        if (isAllowedPopup(url)) {
            console.info(`[Security] Allowed popup for OAuth: ${url}`);
            return { action: 'allow' };
        }


        console.info(`[Security] Blocked popup, opening externally: ${url}`);
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                shell.openExternal(url).catch((err) => {
                    console.error(`[Security] Failed to open popup URL externally: ${err.message}`);
                });
            }
        } catch (error) {
            console.warn(`[Security] Silent fail during URL parsing for popup: ${error instanceof Error ? error.message : String(error)}`);
        }

        return { action: 'deny' };
    });


    webContents.on('will-attach-webview', (event) => {

        console.warn('[Security] Blocked webview creation attempt');
        event.preventDefault();
    });

    console.info('[Security] Window security hardening applied');
}


export function applyGlobalSecurity(): void {


    app.on('web-contents-created', (_event, contents) => {

        contents.on('will-navigate', (event, url) => {
            if (!isAllowedNavigation(url)) {
                event.preventDefault();
                console.warn(`[Security] Blocked navigation (global) to: ${url}`);
            }
        });


        contents.setWindowOpenHandler(({ url }: { url: string }) => {
            if (isAllowedPopup(url)) {
                return { action: 'allow' as const };
            }


            try {
                const parsed = new URL(url);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                    shell.openExternal(url).catch(() => { });
                }
            } catch (error) {
                // Ignore parsing errors for unknown/invalid protocols
            }

            return { action: 'deny' as const };
        });
    });

    console.info('[Security] Global security policies applied');
}


export function validateIPCPayload(
    payload: unknown,
    maxSize: number = 10 * 1024 * 1024,
): { valid: boolean; reason?: string } {

    const serialized = JSON.stringify(payload);
    if (serialized.length > maxSize) {
        return { valid: false, reason: `Payload exceeds maximum size of ${maxSize} bytes` };
    }


    if (typeof payload === 'string') {
        if (payload.includes('..') && (payload.includes('/') || payload.includes('\\'))) {
            return { valid: false, reason: 'Potential path traversal detected' };
        }
    }


    if (typeof payload === 'object' && payload !== null) {
        const checkStrings = (obj: Record<string, unknown>): boolean => {
            for (const value of Object.values(obj)) {
                if (typeof value === 'string') {
                    if (value.includes('..') && (value.includes('/') || value.includes('\\'))) {
                        return false;
                    }
                } else if (typeof value === 'object' && value !== null) {
                    if (!checkStrings(value as Record<string, unknown>)) {return false;}
                }
            }
            return true;
        };

        if (!checkStrings(payload as Record<string, unknown>)) {
            return { valid: false, reason: 'Potential path traversal detected in object property' };
        }
    }

    return { valid: true };
}


export function getSecurityConfig(): {
    allowedNavigationOrigins: string[];
    allowedPopupOrigins: string[];
    blockedProtocols: string[];
    isDev: boolean;
} {
    return {
        allowedNavigationOrigins: [...ALLOWED_NAVIGATION_ORIGINS],
        allowedPopupOrigins: [...ALLOWED_POPUP_ORIGINS],
        blockedProtocols: [...BLOCKED_PROTOCOLS],
        isDev: !app.isPackaged,
    };
}
