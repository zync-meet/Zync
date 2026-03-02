import { app, BrowserWindow } from 'electron';


export const DEEP_LINK_PROTOCOL = 'zync';


export interface DeepLinkData {

    raw: string;

    path: string;

    segments: string[];

    params: Record<string, string>;

    type: DeepLinkType;

    entityId?: string;
}


export enum DeepLinkType {

    OPEN = 'open',

    PROJECT = 'project',

    MEETING = 'meeting',

    INVITE = 'invite',

    SETTINGS = 'settings',

    OAUTH_CALLBACK = 'oauth_callback',

    UNKNOWN = 'unknown',
}


export type DeepLinkHandler = (data: DeepLinkData) => void;


const handlers: Map<DeepLinkType, DeepLinkHandler[]> = new Map();


let initialized = false;


let pendingDeepLink: string | null = null;


let lastDeepLinkTime = 0;


const DEEP_LINK_MIN_INTERVAL = 1000;


export function initializeDeepLinks(mainWindow?: BrowserWindow | null): void {
    if (initialized) {
        console.warn('[DeepLink] Already initialized');
        return;
    }


    if (process.defaultApp) {

        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL, process.execPath, [
                '--',
                process.argv[1],
            ]);
        }
    } else {
        app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
    }


    app.on('open-url', (event, url) => {
        event.preventDefault();
        handleDeepLinkUrl(url, mainWindow ?? null);
    });


    const launchUrl = findDeepLinkInArgs(process.argv);
    if (launchUrl) {
        pendingDeepLink = launchUrl;
        console.info(`[DeepLink] Pending launch URL: ${launchUrl}`);
    }

    initialized = true;
    console.info(`[DeepLink] Initialized with protocol: ${DEEP_LINK_PROTOCOL}://`);
}


export function handleSecondInstanceArgs(
    argv: string[],
    mainWindow: BrowserWindow | null,
): void {
    const url = findDeepLinkInArgs(argv);
    if (url) {
        handleDeepLinkUrl(url, mainWindow);
    }
}


export function processPendingDeepLink(mainWindow: BrowserWindow): void {
    if (pendingDeepLink) {
        console.info(`[DeepLink] Processing pending deep link: ${pendingDeepLink}`);
        handleDeepLinkUrl(pendingDeepLink, mainWindow);
        pendingDeepLink = null;
    }
}


export function onDeepLink(type: DeepLinkType, handler: DeepLinkHandler): void {
    const existing = handlers.get(type) ?? [];
    existing.push(handler);
    handlers.set(type, existing);
}


export function offDeepLink(type: DeepLinkType, handler: DeepLinkHandler): void {
    const existing = handlers.get(type);
    if (!existing) return;

    const index = existing.indexOf(handler);
    if (index !== -1) {
        existing.splice(index, 1);
    }
}


export function clearDeepLinkHandlers(type?: DeepLinkType): void {
    if (type) {
        handlers.delete(type);
    } else {
        handlers.clear();
    }
}


export function parseDeepLink(url: string): DeepLinkData | null {
    try {

        if (!url.startsWith(`${DEEP_LINK_PROTOCOL}://`)) {
            console.warn(`[DeepLink] Invalid protocol: ${url}`);
            return null;
        }


        const parsed = new URL(url);
        const path = `/${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '') || '/';
        const segments = path.split('/').filter(Boolean);


        const params: Record<string, string> = {};
        parsed.searchParams.forEach((value, key) => {

            params[key] = sanitizeParam(value);
        });


        const { type, entityId } = classifyRoute(segments, params);

        return {
            raw: url,
            path,
            segments,
            params,
            type,
            entityId,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[DeepLink] Failed to parse URL: ${message}`);
        return null;
    }
}


export function isValidDeepLink(url: string): boolean {
    return parseDeepLink(url) !== null;
}


function handleDeepLinkUrl(url: string, mainWindow: BrowserWindow | null): void {

    const now = Date.now();
    if (now - lastDeepLinkTime < DEEP_LINK_MIN_INTERVAL) {
        console.info(`[DeepLink] Rate limited, ignoring: ${url}`);
        return;
    }
    lastDeepLinkTime = now;

    console.info(`[DeepLink] Processing: ${url}`);


    const data = parseDeepLink(url);
    if (!data) {
        console.warn(`[DeepLink] Invalid deep link: ${url}`);
        return;
    }


    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }


    const typeHandlers = handlers.get(data.type) ?? [];
    const wildcardHandlers = handlers.get(DeepLinkType.UNKNOWN) ?? [];

    if (typeHandlers.length > 0) {
        for (const handler of typeHandlers) {
            try {
                handler(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[DeepLink] Handler error for ${data.type}: ${message}`);
            }
        }
    } else if (wildcardHandlers.length > 0) {
        for (const handler of wildcardHandlers) {
            try {
                handler(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[DeepLink] Wildcard handler error: ${message}`);
            }
        }
    } else {
        console.warn(`[DeepLink] No handler registered for type: ${data.type}`);
    }


    if (mainWindow?.webContents) {
        mainWindow.webContents.send('deep-link', {
            type: data.type,
            path: data.path,
            params: data.params,
            entityId: data.entityId,
        });
    }
}


function findDeepLinkInArgs(argv: string[]): string | null {

    for (const arg of argv) {
        if (arg.startsWith(`${DEEP_LINK_PROTOCOL}://`)) {
            return arg;
        }
    }
    return null;
}


function classifyRoute(
    segments: string[],
    params: Record<string, string>,
): { type: DeepLinkType; entityId?: string } {
    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'open')) {
        return { type: DeepLinkType.OPEN };
    }

    const route = segments[0];

    switch (route) {
        case 'project':
            return {
                type: DeepLinkType.PROJECT,
                entityId: segments[1] ?? params['id'],
            };

        case 'meeting':
        case 'meet':
            return {
                type: DeepLinkType.MEETING,
                entityId: segments[1] ?? params['id'],
            };

        case 'invite':
            return {
                type: DeepLinkType.INVITE,
                entityId: segments[1] ?? params['teamId'],
            };

        case 'settings':
        case 'preferences':
            return { type: DeepLinkType.SETTINGS };

        case 'oauth':
            if (segments[1] === 'callback') {
                return { type: DeepLinkType.OAUTH_CALLBACK };
            }
            return { type: DeepLinkType.UNKNOWN };

        default:
            return { type: DeepLinkType.UNKNOWN };
    }
}


function sanitizeParam(value: string): string {
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .trim()
        .slice(0, 2048);
}


export function getDeepLinkState(): {
    initialized: boolean;
    hasPending: boolean;
    handlerCount: number;
} {
    let totalHandlers = 0;
    handlers.forEach((h) => {
        totalHandlers += h.length;
    });

    return {
        initialized,
        hasPending: pendingDeepLink !== null,
        handlerCount: totalHandlers,
    };
}
