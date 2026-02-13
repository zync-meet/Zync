/**
 * =============================================================================
 * Content Security Policy Configuration — ZYNC Desktop Application
 * =============================================================================
 */

/**
 * CSP directives for the main renderer window.
 */
export const CONTENT_SECURITY_POLICY: Record<string, string[]> = {
    /** Scripts: allow Google and GitHub for OAuth/Firebase */
    'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com', 'https://www.googleapis.com'],

    /** Styles: self and inline styles */
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
        'https://api.github.com',
        'https://github.com',
    ],

    /** Frames: allow Google and GitHub for login popups/redirects */
    'frame-src': ["'self'", 'https://*.firebaseapp.com', 'https://*.google.com', 'https://github.com'],

    /** Media: self */
    'media-src': ["'self'", 'blob:'],

    /** Default: self */
    'default-src': ["'self'"],

    /** Object/embed: none */
    'object-src': ["'none'"],

    /** Base URI: self only */
    'base-uri': ["'self'"],

    /** Form actions: self only */
    'form-action': ["'self'"],

    /** Frame ancestors: none */
    'frame-ancestors': ["'none'"],
};

/**
 * Builds a CSP header string from the directives object.
 */
export function buildCSPString(): string {
    return Object.entries(CONTENT_SECURITY_POLICY)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}

/**
 * CSP for development mode.
 */
export const DEV_CONTENT_SECURITY_POLICY: Record<string, string[]> = {
    ...CONTENT_SECURITY_POLICY,
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://apis.google.com', 'https://www.googleapis.com'],
    'connect-src': [
        ...CONTENT_SECURITY_POLICY['connect-src'],
        'ws://localhost:*',
        'http://localhost:8081',
        'http://localhost:5000',
    ],
};

/**
 * Builds the development CSP header string.
 */
export function buildDevCSPString(): string {
    return Object.entries(DEV_CONTENT_SECURITY_POLICY)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}
