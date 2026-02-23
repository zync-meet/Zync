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
import { session, app } from 'electron';
import { logger } from '../utils/logger.js';
// =============================================================================
// Session Manager Service
// =============================================================================
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
export class SessionManagerService {
    /** The managed session */
    ses;
    /** Configuration */
    config;
    /** Logger instance */
    log = logger;
    /**
     * Create a new SessionManagerService.
     *
     * @param {SessionConfig} [config] - Session configuration
     */
    constructor(config = {}) {
        this.config = {
            persistent: true,
            spellCheck: true,
            spellCheckLanguages: ['en-US'],
            cacheSizeLimit: 0,
            ...config,
        };
        // Use partition-based or default session
        if (config.partition) {
            this.ses = session.fromPartition(config.partition, {
                cache: this.config.persistent !== false,
            });
        }
        else {
            this.ses = session.defaultSession;
        }
    }
    // =========================================================================
    // Initialization
    // =========================================================================
    /**
     * Initialize the session with the configured options.
     */
    async initialize() {
        // Set user agent if specified
        if (this.config.userAgent) {
            this.ses.setUserAgent(this.config.userAgent);
        }
        // Configure proxy
        if (this.config.proxy) {
            await this.setProxy(this.config.proxy);
        }
        // Configure spell checking
        if (this.config.spellCheck !== undefined) {
            this.ses.setSpellCheckerEnabled(this.config.spellCheck);
        }
        if (this.config.spellCheckLanguages) {
            this.ses.setSpellCheckerLanguages(this.config.spellCheckLanguages);
        }
        this.log.info('Session manager initialized');
    }
    // =========================================================================
    // Proxy Management
    // =========================================================================
    /**
     * Set the proxy configuration.
     *
     * @param {ProxyConfig} proxy - Proxy configuration
     */
    async setProxy(proxy) {
        try {
            await this.ses.setProxy({
                mode: proxy.mode,
                proxyRules: proxy.proxyRules,
                proxyBypassRules: proxy.proxyBypassRules,
                pacScript: proxy.pacScript,
            });
            this.log.info(`Proxy set to: ${proxy.mode}`);
        }
        catch (err) {
            this.log.error('Failed to set proxy:', err);
            throw err;
        }
    }
    /**
     * Reset proxy to system defaults.
     */
    async resetProxy() {
        await this.ses.setProxy({ mode: 'system' });
        this.log.info('Proxy reset to system');
    }
    /**
     * Resolve the proxy for a given URL.
     *
     * @param {string} url - URL to resolve proxy for
     * @returns {Promise<string>} Proxy string
     */
    async resolveProxy(url) {
        return this.ses.resolveProxy(url);
    }
    // =========================================================================
    // Cookie Management
    // =========================================================================
    /**
     * Get all cookies, optionally filtered by domain.
     *
     * @param {string} [domain] - Filter by domain
     * @returns {Promise<Electron.Cookie[]>} Array of cookies
     */
    async getCookies(domain) {
        const filter = {};
        if (domain) {
            filter.domain = domain;
        }
        return this.ses.cookies.get(filter);
    }
    /**
     * Set a cookie.
     *
     * @param {Electron.CookiesSetDetails} details - Cookie details
     */
    async setCookie(details) {
        await this.ses.cookies.set(details);
    }
    /**
     * Remove a specific cookie.
     *
     * @param {string} url - The URL associated with the cookie
     * @param {string} name - Cookie name
     */
    async removeCookie(url, name) {
        await this.ses.cookies.remove(url, name);
    }
    /**
     * Clear all cookies.
     */
    async clearCookies() {
        await this.ses.clearStorageData({ storages: ['cookies'] });
        this.log.info('All cookies cleared');
    }
    // =========================================================================
    // Cache Management
    // =========================================================================
    /**
     * Get the current cache size.
     *
     * @returns {Promise<CacheStats>} Cache statistics
     */
    async getCacheSize() {
        const size = await this.ses.getCacheSize();
        return {
            size,
            formattedSize: this.formatBytes(size),
        };
    }
    /**
     * Clear the HTTP cache.
     */
    async clearCache() {
        await this.ses.clearCache();
        this.log.info('HTTP cache cleared');
    }
    /**
     * Clear all storage data (cache, cookies, localStorage, etc.).
     */
    async clearAllData() {
        await this.ses.clearStorageData();
        this.log.info('All session storage data cleared');
    }
    /**
     * Clear specific types of storage.
     *
     * @param {string[]} storages - Storage types to clear
     */
    async clearSpecificData(storages) {
        await this.ses.clearStorageData({ storages });
        this.log.info(`Cleared storage: ${storages.join(', ')}`);
    }
    // =========================================================================
    // Spell Check
    // =========================================================================
    /**
     * Enable or disable spell checking.
     *
     * @param {boolean} enabled - Whether to enable spell checking
     */
    setSpellCheckEnabled(enabled) {
        this.ses.setSpellCheckerEnabled(enabled);
        this.log.info(`Spell check ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * Set spell check languages.
     *
     * @param {string[]} languages - Language codes (e.g., ['en-US', 'fr'])
     */
    setSpellCheckLanguages(languages) {
        this.ses.setSpellCheckerLanguages(languages);
        this.log.info(`Spell check languages: ${languages.join(', ')}`);
    }
    /**
     * Get available spell check languages.
     *
     * @returns {string[]} Available language codes
     */
    getAvailableSpellCheckLanguages() {
        return this.ses.availableSpellCheckerLanguages;
    }
    // =========================================================================
    // User Agent
    // =========================================================================
    /**
     * Get the current user agent string.
     *
     * @returns {string} User agent
     */
    getUserAgent() {
        return this.ses.getUserAgent();
    }
    /**
     * Set a custom user agent string.
     *
     * @param {string} userAgent - Custom user agent
     */
    setUserAgent(userAgent) {
        this.ses.setUserAgent(userAgent);
        this.log.info('User agent updated');
    }
    // =========================================================================
    // Download Path
    // =========================================================================
    /**
     * Get the default download path.
     *
     * @returns {string} Download directory path
     */
    getDownloadPath() {
        return app.getPath('downloads');
    }
    // =========================================================================
    // Utility
    // =========================================================================
    /**
     * Get the underlying Electron session.
     *
     * @returns {Electron.Session} The managed session
     */
    getSession() {
        return this.ses;
    }
    /**
     * Format bytes as a human-readable string.
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
    /**
     * Dispose of the service.
     */
    dispose() {
        this.log.info('Session manager disposed');
    }
}
//# sourceMappingURL=session-manager.js.map