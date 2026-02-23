/**
 * =============================================================================
 * Session Manager Service — ZYNC Desktop
 * =============================================================================
 *
 * Manages browser session configuration, cookie policies, proxy settings,
 * cache management, and download settings for the Electron session.
 *
 * @module electron/services/session-manager
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */
/** Session configuration */
export interface SessionConfig {
    /** User agent string override (null = default) */
    userAgent?: string | null;
    /** Proxy configuration */
    proxy?: ProxyConfig | null;
    /** Whether to persist session data between launches */
    persistent?: boolean;
    /** Partition name for isolated sessions */
    partition?: string | null;
    /** Cache size limit in bytes (0 = unlimited) */
    cacheSizeLimit?: number;
    /** Whether to enable spell checking */
    spellCheck?: boolean;
    /** Spell check languages */
    spellCheckLanguages?: string[];
}
/** Proxy configuration */
export interface ProxyConfig {
    /** Proxy mode: 'direct' | 'system' | 'fixed_servers' | 'pac_script' */
    mode: 'direct' | 'system' | 'fixed_servers' | 'pac_script';
    /** Proxy rules for fixed_servers mode (e.g., "http=proxy:8080;https=proxy:8443") */
    proxyRules?: string;
    /** Bypass rules (comma-separated list of hosts) */
    proxyBypassRules?: string;
    /** PAC script URL for pac_script mode */
    pacScript?: string;
}
/** Cache statistics */
export interface CacheStats {
    /** Cache size in bytes */
    size: number;
    /** Formatted size string */
    formattedSize: string;
}
/**
 * SessionManagerService manages the Electron session configuration,
 * including cookies, caching, and proxy settings.
 *
 * @example
 * ```typescript
 * const mgr = new SessionManagerService();
 * await mgr.initialize({
 *   spellCheck: true,
 *   spellCheckLanguages: ['en-US'],
 * });
 * ```
 */
export declare class SessionManagerService {
    /** The managed session */
    private ses;
    /** Configuration */
    private config;
    /** Logger instance */
    private log;
    /**
     * Create a new SessionManagerService.
     *
     * @param {SessionConfig} [config] - Session configuration
     */
    constructor(config?: SessionConfig);
    /**
     * Initialize the session with the configured options.
     */
    initialize(): Promise<void>;
    /**
     * Set the proxy configuration.
     *
     * @param {ProxyConfig} proxy - Proxy configuration
     */
    setProxy(proxy: ProxyConfig): Promise<void>;
    /**
     * Reset proxy to system defaults.
     */
    resetProxy(): Promise<void>;
    /**
     * Resolve the proxy for a given URL.
     *
     * @param {string} url - URL to resolve proxy for
     * @returns {Promise<string>} Proxy string
     */
    resolveProxy(url: string): Promise<string>;
    /**
     * Get all cookies, optionally filtered by domain.
     *
     * @param {string} [domain] - Filter by domain
     * @returns {Promise<Electron.Cookie[]>} Array of cookies
     */
    getCookies(domain?: string): Promise<Electron.Cookie[]>;
    /**
     * Set a cookie.
     *
     * @param {Electron.CookiesSetDetails} details - Cookie details
     */
    setCookie(details: Electron.CookiesSetDetails): Promise<void>;
    /**
     * Remove a specific cookie.
     *
     * @param {string} url - The URL associated with the cookie
     * @param {string} name - Cookie name
     */
    removeCookie(url: string, name: string): Promise<void>;
    /**
     * Clear all cookies.
     */
    clearCookies(): Promise<void>;
    /**
     * Get the current cache size.
     *
     * @returns {Promise<CacheStats>} Cache statistics
     */
    getCacheSize(): Promise<CacheStats>;
    /**
     * Clear the HTTP cache.
     */
    clearCache(): Promise<void>;
    /**
     * Clear all storage data (cache, cookies, localStorage, etc.).
     */
    clearAllData(): Promise<void>;
    /**
     * Clear specific types of storage.
     *
     * @param {string[]} storages - Storage types to clear
     */
    clearSpecificData(storages: Array<'cookies' | 'filesystem' | 'indexdb' | 'localstorage' | 'shadercache' | 'websql' | 'serviceworkers' | 'cachestorage'>): Promise<void>;
    /**
     * Enable or disable spell checking.
     *
     * @param {boolean} enabled - Whether to enable spell checking
     */
    setSpellCheckEnabled(enabled: boolean): void;
    /**
     * Set spell check languages.
     *
     * @param {string[]} languages - Language codes (e.g., ['en-US', 'fr'])
     */
    setSpellCheckLanguages(languages: string[]): void;
    /**
     * Get available spell check languages.
     *
     * @returns {string[]} Available language codes
     */
    getAvailableSpellCheckLanguages(): string[];
    /**
     * Get the current user agent string.
     *
     * @returns {string} User agent
     */
    getUserAgent(): string;
    /**
     * Set a custom user agent string.
     *
     * @param {string} userAgent - Custom user agent
     */
    setUserAgent(userAgent: string): void;
    /**
     * Get the default download path.
     *
     * @returns {string} Download directory path
     */
    getDownloadPath(): string;
    /**
     * Get the underlying Electron session.
     *
     * @returns {Electron.Session} The managed session
     */
    getSession(): Electron.Session;
    /**
     * Format bytes as a human-readable string.
     */
    private formatBytes;
    /**
     * Dispose of the service.
     */
    dispose(): void;
}
