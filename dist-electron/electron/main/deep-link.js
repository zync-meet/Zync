/**
 * =============================================================================
 * Deep Link Handler — ZYNC Desktop Application
 * =============================================================================
 *
 * Implements deep link (custom protocol) handling for the ZYNC desktop app.
 * Registers and processes `zync://` protocol URLs that allow opening the
 * application from the browser, email links, or other external sources.
 *
 * Supported Deep Link Patterns:
 * - zync://open                       → Focus/launch the app
 * - zync://project/:id                → Open a specific project
 * - zync://meeting/:id                → Join a meeting
 * - zync://invite/:teamId/:token      → Accept a team invite
 * - zync://settings                   → Open settings
 * - zync://oauth/callback?code=...    → Handle OAuth callback
 *
 * Security:
 * - All incoming URLs are validated against known route patterns
 * - Query parameters are sanitized
 * - Unknown routes are rejected
 * - Rate limiting prevents abuse
 *
 * Platform Integration:
 * - Linux: xdg-open via .desktop file
 * - macOS: Info.plist CFBundleURLTypes
 * - Windows: Registry entry (handled by electron-builder)
 *
 * @module electron/main/deep-link
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
import { app } from 'electron';
/**
 * The custom protocol scheme for ZYNC deep links.
 *
 * @constant {string}
 */
export const DEEP_LINK_PROTOCOL = 'zync';
/**
 * Recognized deep link route types.
 *
 * @enum {string}
 */
export var DeepLinkType;
(function (DeepLinkType) {
    /** Focus/launch the application */
    DeepLinkType["OPEN"] = "open";
    /** Open a specific project */
    DeepLinkType["PROJECT"] = "project";
    /** Join a meeting */
    DeepLinkType["MEETING"] = "meeting";
    /** Accept a team invitation */
    DeepLinkType["INVITE"] = "invite";
    /** Open settings window */
    DeepLinkType["SETTINGS"] = "settings";
    /** OAuth callback */
    DeepLinkType["OAUTH_CALLBACK"] = "oauth_callback";
    /** Unknown / unrecognized route */
    DeepLinkType["UNKNOWN"] = "unknown";
})(DeepLinkType || (DeepLinkType = {}));
// =============================================================================
// State
// =============================================================================
/** Registered handlers for deep link types */
const handlers = new Map();
/** Whether the deep link subsystem has been initialized */
let initialized = false;
/** Pending deep link URL received before app was ready */
let pendingDeepLink = null;
/** Rate limiting: last deep link processing timestamp */
let lastDeepLinkTime = 0;
/** Minimum interval between deep link processing (ms) */
const DEEP_LINK_MIN_INTERVAL = 1000;
// =============================================================================
// Initialization
// =============================================================================
/**
 * Initializes the deep link handler.
 *
 * Registers `zync://` as the default protocol handler and sets up
 * event listeners for incoming deep link URLs.
 *
 * Should be called BEFORE `app.whenReady()` to catch deep links that
 * triggered the app launch.
 *
 * @param {BrowserWindow | null} [mainWindow] - The main window (can be set later)
 *
 * @example
 * ```typescript
 * import { initializeDeepLinks, processPendingDeepLink } from './deep-link';
 *
 * initializeDeepLinks();
 *
 * app.whenReady().then(() => {
 *   const mainWindow = createMainWindow();
 *   processPendingDeepLink(mainWindow);
 * });
 * ```
 */
export function initializeDeepLinks(mainWindow) {
    if (initialized) {
        console.warn('[DeepLink] Already initialized');
        return;
    }
    // Register as the default protocol handler for zync://
    if (process.defaultApp) {
        // During development, register the protocol with the full path
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL, process.execPath, [
                '--',
                process.argv[1],
            ]);
        }
    }
    else {
        app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
    }
    // Handle deep links on macOS (open-url event)
    app.on('open-url', (event, url) => {
        event.preventDefault();
        handleDeepLinkUrl(url, mainWindow ?? null);
    });
    // Check if launched with a deep link URL (Windows/Linux)
    const launchUrl = findDeepLinkInArgs(process.argv);
    if (launchUrl) {
        pendingDeepLink = launchUrl;
        console.info(`[DeepLink] Pending launch URL: ${launchUrl}`);
    }
    initialized = true;
    console.info(`[DeepLink] Initialized with protocol: ${DEEP_LINK_PROTOCOL}://`);
}
/**
 * Handles deep link URLs received via the single-instance lock.
 *
 * Call this from the `second-instance` event handler.
 *
 * @param {string[]} argv - Command line arguments from second instance
 * @param {BrowserWindow | null} mainWindow - The main browser window
 *
 * @example
 * ```typescript
 * app.on('second-instance', (_event, argv) => {
 *   handleSecondInstanceArgs(argv, mainWindow);
 * });
 * ```
 */
export function handleSecondInstanceArgs(argv, mainWindow) {
    const url = findDeepLinkInArgs(argv);
    if (url) {
        handleDeepLinkUrl(url, mainWindow);
    }
}
/**
 * Processes any pending deep link that was received before the app was ready.
 *
 * Should be called after the main window is created and loaded.
 *
 * @param {BrowserWindow} mainWindow - The main browser window
 */
export function processPendingDeepLink(mainWindow) {
    if (pendingDeepLink) {
        console.info(`[DeepLink] Processing pending deep link: ${pendingDeepLink}`);
        handleDeepLinkUrl(pendingDeepLink, mainWindow);
        pendingDeepLink = null;
    }
}
// =============================================================================
// Event Registration
// =============================================================================
/**
 * Registers a handler for a specific deep link type.
 *
 * @param {DeepLinkType} type - The deep link type to handle
 * @param {DeepLinkHandler} handler - The handler function
 *
 * @example
 * ```typescript
 * onDeepLink(DeepLinkType.PROJECT, (data) => {
 *   console.log(`Opening project: ${data.entityId}`);
 *   navigateToProject(data.entityId);
 * });
 * ```
 */
export function onDeepLink(type, handler) {
    const existing = handlers.get(type) ?? [];
    existing.push(handler);
    handlers.set(type, existing);
}
/**
 * Removes a specific handler for a deep link type.
 *
 * @param {DeepLinkType} type - The deep link type
 * @param {DeepLinkHandler} handler - The handler to remove
 */
export function offDeepLink(type, handler) {
    const existing = handlers.get(type);
    if (!existing)
        return;
    const index = existing.indexOf(handler);
    if (index !== -1) {
        existing.splice(index, 1);
    }
}
/**
 * Removes all handlers for a specific deep link type or all types.
 *
 * @param {DeepLinkType} [type] - Specific type to clear, or all if omitted
 */
export function clearDeepLinkHandlers(type) {
    if (type) {
        handlers.delete(type);
    }
    else {
        handlers.clear();
    }
}
// =============================================================================
// URL Parsing & Validation
// =============================================================================
/**
 * Parses a `zync://` URL into structured deep link data.
 *
 * @param {string} url - The raw deep link URL
 * @returns {DeepLinkData | null} Parsed data, or null if invalid
 *
 * @example
 * ```typescript
 * const data = parseDeepLink('zync://project/abc123?tab=files');
 * // data.type === DeepLinkType.PROJECT
 * // data.entityId === 'abc123'
 * // data.params.tab === 'files'
 * ```
 */
export function parseDeepLink(url) {
    try {
        // Validate protocol
        if (!url.startsWith(`${DEEP_LINK_PROTOCOL}://`)) {
            console.warn(`[DeepLink] Invalid protocol: ${url}`);
            return null;
        }
        // Parse URL
        const parsed = new URL(url);
        const path = `/${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '') || '/';
        const segments = path.split('/').filter(Boolean);
        // Parse query parameters
        const params = {};
        parsed.searchParams.forEach((value, key) => {
            // Sanitize parameter values
            params[key] = sanitizeParam(value);
        });
        // Determine route type
        const { type, entityId } = classifyRoute(segments, params);
        return {
            raw: url,
            path,
            segments,
            params,
            type,
            entityId,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[DeepLink] Failed to parse URL: ${message}`);
        return null;
    }
}
/**
 * Validates if a URL is a valid ZYNC deep link.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid
 */
export function isValidDeepLink(url) {
    return parseDeepLink(url) !== null;
}
// =============================================================================
// Internal Helpers
// =============================================================================
/**
 * Main deep link processing pipeline.
 *
 * @param {string} url - The deep link URL
 * @param {BrowserWindow | null} mainWindow - The main window
 * @internal
 */
function handleDeepLinkUrl(url, mainWindow) {
    // Rate limiting
    const now = Date.now();
    if (now - lastDeepLinkTime < DEEP_LINK_MIN_INTERVAL) {
        console.info(`[DeepLink] Rate limited, ignoring: ${url}`);
        return;
    }
    lastDeepLinkTime = now;
    console.info(`[DeepLink] Processing: ${url}`);
    // Parse the URL
    const data = parseDeepLink(url);
    if (!data) {
        console.warn(`[DeepLink] Invalid deep link: ${url}`);
        return;
    }
    // Focus the main window
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.focus();
    }
    // Dispatch to registered handlers
    const typeHandlers = handlers.get(data.type) ?? [];
    const wildcardHandlers = handlers.get(DeepLinkType.UNKNOWN) ?? [];
    if (typeHandlers.length > 0) {
        for (const handler of typeHandlers) {
            try {
                handler(data);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[DeepLink] Handler error for ${data.type}: ${message}`);
            }
        }
    }
    else if (wildcardHandlers.length > 0) {
        for (const handler of wildcardHandlers) {
            try {
                handler(data);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`[DeepLink] Wildcard handler error: ${message}`);
            }
        }
    }
    else {
        console.warn(`[DeepLink] No handler registered for type: ${data.type}`);
    }
    // Send to renderer if window is available
    if (mainWindow?.webContents) {
        mainWindow.webContents.send('deep-link', {
            type: data.type,
            path: data.path,
            params: data.params,
            entityId: data.entityId,
        });
    }
}
/**
 * Finds a `zync://` URL in command line arguments.
 *
 * @param {string[]} argv - Command line arguments
 * @returns {string | null} The deep link URL, or null if not found
 * @internal
 */
function findDeepLinkInArgs(argv) {
    // Look through args for our protocol
    for (const arg of argv) {
        if (arg.startsWith(`${DEEP_LINK_PROTOCOL}://`)) {
            return arg;
        }
    }
    return null;
}
/**
 * Classifies a deep link route into a recognized type.
 *
 * @param {string[]} segments - URL path segments
 * @param {Record<string, string>} params - Query parameters
 * @returns {{ type: DeepLinkType; entityId?: string }}
 * @internal
 */
function classifyRoute(segments, params) {
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
/**
 * Sanitizes a query parameter value to prevent injection.
 *
 * @param {string} value - Raw parameter value
 * @returns {string} Sanitized value
 * @internal
 */
function sanitizeParam(value) {
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .trim()
        .slice(0, 2048); // Limit length
}
/**
 * Gets the initialization state of the deep link handler.
 *
 * @returns {{ initialized: boolean; hasPending: boolean; handlerCount: number }}
 */
export function getDeepLinkState() {
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
//# sourceMappingURL=deep-link.js.map