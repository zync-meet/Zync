import { session, WebContents } from 'electron';
import { WEB_APP_URL, DEV_SERVER_URL } from './constants.js';


const ALWAYS_ALLOWED_PERMISSIONS = new Set<string>([
    'clipboard-read',
    'clipboard-sanitized-write',
    'notifications',
    'fullscreen',
    'pointerLock',
    'idle-detection',
]);


const ORIGIN_VALIDATED_PERMISSIONS = new Set<string>([
    'media',
    'mediaKeySystem',
    'geolocation',
    'midi',
    'display-capture',
    'window-management',
]);


const ALWAYS_DENIED_PERMISSIONS = new Set<string>([
    'openExternal',
    'serial',
    'hid',
    'usb',
    'bluetooth',
    'storage-access',
]);


const TRUSTED_ORIGINS = new Set<string>([
    new URL(WEB_APP_URL).origin,
    new URL(DEV_SERVER_URL).origin,
    'file://',
]);


function isTrustedOrigin(origin: string): boolean {
    if (!origin) {return false;}

    for (const trusted of TRUSTED_ORIGINS) {
        if (origin === trusted || origin.startsWith(trusted)) {
            return true;
        }
    }

    return false;
}


function handlePermissionRequest(
    _webContents: WebContents,
    permission: string,
    callback: (granted: boolean) => void,
    details: { requestingUrl?: string; isMainFrame?: boolean; externalURL?: string },
): void {
    const requestUrl = details.requestingUrl || '';
    let origin = '';

    try {
        origin = new URL(requestUrl).origin;
    } catch {
        origin = requestUrl;
    }


    if (ALWAYS_ALLOWED_PERMISSIONS.has(permission)) {
        console.info(`[Permissions] Granted '${permission}' (always allowed)`);
        callback(true);
        return;
    }


    if (ALWAYS_DENIED_PERMISSIONS.has(permission)) {
        console.warn(`[Permissions] Denied '${permission}' (always denied)`);
        callback(false);
        return;
    }


    if (ORIGIN_VALIDATED_PERMISSIONS.has(permission)) {
        const trusted = isTrustedOrigin(origin);
        if (trusted) {
            console.info(`[Permissions] Granted '${permission}' for trusted origin: ${origin}`);
            callback(true);
        } else {
            console.warn(`[Permissions] Denied '${permission}' for untrusted origin: ${origin}`);
            callback(false);
        }
        return;
    }


    console.warn(`[Permissions] Denied unknown permission '${permission}' from: ${origin}`);
    callback(false);
}


function handlePermissionCheck(
    _webContents: WebContents | null,
    permission: string,
    requestingOrigin: string,
): boolean {

    if (ALWAYS_ALLOWED_PERMISSIONS.has(permission)) {
        return true;
    }


    if (ALWAYS_DENIED_PERMISSIONS.has(permission)) {
        return false;
    }


    if (ORIGIN_VALIDATED_PERMISSIONS.has(permission)) {
        return isTrustedOrigin(requestingOrigin);
    }


    return false;
}


export function setupPermissionHandlers(): void {
    const defaultSession = session.defaultSession;


    defaultSession.setPermissionRequestHandler(handlePermissionRequest);


    defaultSession.setPermissionCheckHandler(handlePermissionCheck);

    console.info('[Permissions] Permission handlers registered');
    console.info(`[Permissions] Always allowed: ${[...ALWAYS_ALLOWED_PERMISSIONS].join(', ')}`);
    console.info(`[Permissions] Origin-validated: ${[...ORIGIN_VALIDATED_PERMISSIONS].join(', ')}`);
    console.info(`[Permissions] Always denied: ${[...ALWAYS_DENIED_PERMISSIONS].join(', ')}`);
}


export function getPermissionConfig(): {
    alwaysAllowed: string[];
    originValidated: string[];
    alwaysDenied: string[];
    trustedOrigins: string[];
} {
    return {
        alwaysAllowed: [...ALWAYS_ALLOWED_PERMISSIONS],
        originValidated: [...ORIGIN_VALIDATED_PERMISSIONS],
        alwaysDenied: [...ALWAYS_DENIED_PERMISSIONS],
        trustedOrigins: [...TRUSTED_ORIGINS],
    };
}
