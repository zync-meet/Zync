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
export declare const CONTENT_SECURITY_POLICY: Record<string, string[]>;
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
export declare function buildCSPString(): string;
/**
 * CSP for development mode (more permissive for hot-reload).
 *
 * In development, Vite's dev server needs additional permissions
 * for WebSocket connections and eval (for hot module replacement).
 */
export declare const DEV_CONTENT_SECURITY_POLICY: Record<string, string[]>;
/**
 * Builds the development CSP header string.
 * @returns {string} Dev CSP header value
 */
export declare function buildDevCSPString(): string;
