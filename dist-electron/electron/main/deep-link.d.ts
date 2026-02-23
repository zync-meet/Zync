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
import { BrowserWindow } from 'electron';
/**
 * The custom protocol scheme for ZYNC deep links.
 *
 * @constant {string}
 */
export declare const DEEP_LINK_PROTOCOL = "zync";
/**
 * Parsed deep link data.
 *
 * @interface DeepLinkData
 */
export interface DeepLinkData {
    /** The raw URL string */
    raw: string;
    /** The route path (e.g., '/project/abc123') */
    path: string;
    /** Parsed route segments */
    segments: string[];
    /** Query parameters */
    params: Record<string, string>;
    /** The matched route type */
    type: DeepLinkType;
    /** Extracted entity ID (if applicable) */
    entityId?: string;
}
/**
 * Recognized deep link route types.
 *
 * @enum {string}
 */
export declare enum DeepLinkType {
    /** Focus/launch the application */
    OPEN = "open",
    /** Open a specific project */
    PROJECT = "project",
    /** Join a meeting */
    MEETING = "meeting",
    /** Accept a team invitation */
    INVITE = "invite",
    /** Open settings window */
    SETTINGS = "settings",
    /** OAuth callback */
    OAUTH_CALLBACK = "oauth_callback",
    /** Unknown / unrecognized route */
    UNKNOWN = "unknown"
}
/**
 * Deep link event handler callback type.
 *
 * @callback DeepLinkHandler
 * @param {DeepLinkData} data - The parsed deep link data
 */
export type DeepLinkHandler = (data: DeepLinkData) => void;
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
export declare function initializeDeepLinks(mainWindow?: BrowserWindow | null): void;
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
export declare function handleSecondInstanceArgs(argv: string[], mainWindow: BrowserWindow | null): void;
/**
 * Processes any pending deep link that was received before the app was ready.
 *
 * Should be called after the main window is created and loaded.
 *
 * @param {BrowserWindow} mainWindow - The main browser window
 */
export declare function processPendingDeepLink(mainWindow: BrowserWindow): void;
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
export declare function onDeepLink(type: DeepLinkType, handler: DeepLinkHandler): void;
/**
 * Removes a specific handler for a deep link type.
 *
 * @param {DeepLinkType} type - The deep link type
 * @param {DeepLinkHandler} handler - The handler to remove
 */
export declare function offDeepLink(type: DeepLinkType, handler: DeepLinkHandler): void;
/**
 * Removes all handlers for a specific deep link type or all types.
 *
 * @param {DeepLinkType} [type] - Specific type to clear, or all if omitted
 */
export declare function clearDeepLinkHandlers(type?: DeepLinkType): void;
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
export declare function parseDeepLink(url: string): DeepLinkData | null;
/**
 * Validates if a URL is a valid ZYNC deep link.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid
 */
export declare function isValidDeepLink(url: string): boolean;
/**
 * Gets the initialization state of the deep link handler.
 *
 * @returns {{ initialized: boolean; hasPending: boolean; handlerCount: number }}
 */
export declare function getDeepLinkState(): {
    initialized: boolean;
    hasPending: boolean;
    handlerCount: number;
};
