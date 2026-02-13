/**
 * =============================================================================
 * Content Security Policy Configuration — ZYNC Desktop Application
 * =============================================================================
 */
/**
 * CSP directives for the main renderer window.
 */
export declare const CONTENT_SECURITY_POLICY: Record<string, string[]>;
/**
 * Builds a CSP header string from the directives object.
 */
export declare function buildCSPString(): string;
/**
 * CSP for development mode.
 */
export declare const DEV_CONTENT_SECURITY_POLICY: Record<string, string[]>;
/**
 * Builds the development CSP header string.
 */
export declare function buildDevCSPString(): string;
