/**
 * =============================================================================
 * Content Security Policy Configuration — ZYNC Desktop Application
 * =============================================================================
 *
 * Defines the Content Security Policy (CSP) headers for the Electron
 * application. CSP limits what resources the renderer process can load,
 * mitigating XSS and data injection attacks.
 *
 * @module electron/config/csp
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

/**
 * CSP directives for the main renderer window.
 *
 * These directives control which sources are allowed for different
 * resource types. The policy is intentionally strict, only allowing
 * resources from trusted origins.
 */
export const CONTENT_SECURITY_POLICY: Record<string, string[]> = {
    /** Scripts: only from self and trusted CDNs */
    'script-src': ["'self'", "'unsafe-inline'"],

    /** Styles: self and inline styles (required by many UI frameworks) */
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],

    /** Fonts: self and Google Fonts */
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],

    /** Images: self, data URIs, and HTTPS sources */
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],

    /** Connections: self and API endpoints */
    'connect-src': [
        "'self'",
        'https://*.firebaseio.com',
        'https://*.googleapis.com',
        'https://*.firebase.google.com',
        'wss://*.firebaseio.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
    ],

    /** Media: self */
    'media-src': ["'self'", 'blob:'],

    /** Default: self */
    'default-src': ["'self'"],

    /** Object/embed: none (block Flash, Java applets, etc.) */
    'object-src': ["'none'"],

    /** Base URI: self only */
    'base-uri': ["'self'"],

    /** Form actions: self only */
    'form-action': ["'self'"],

    /** Frame ancestors: none (prevent clickjacking) */
    'frame-ancestors': ["'none'"],
};

/**
 * Builds a CSP header string from the directives object.
 *
 * @returns {string} Complete CSP header value
 *
 * @example
 * ```typescript
 * const csp = buildCSPString();
 * // => "script-src 'self' 'unsafe-inline'; style-src 'self' ..."
 * ```
 */
export function buildCSPString(): string {
    return Object.entries(CONTENT_SECURITY_POLICY)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}

/**
 * CSP for development mode (more permissive for hot-reload).
 *
 * In development, Vite's dev server needs additional permissions
 * for WebSocket connections and eval (for hot module replacement).
 */
export const DEV_CONTENT_SECURITY_POLICY: Record<string, string[]> = {
    ...CONTENT_SECURITY_POLICY,
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'connect-src': [
        ...CONTENT_SECURITY_POLICY['connect-src'],
        'ws://localhost:*',
        'http://localhost:*',
    ],
};

/**
 * Builds the development CSP header string.
 * @returns {string} Dev CSP header value
 */
export function buildDevCSPString(): string {
    return Object.entries(DEV_CONTENT_SECURITY_POLICY)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}
