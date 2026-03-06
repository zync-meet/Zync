import { session, app } from 'electron';
import { logger } from '../utils/logger.js';
export class SessionManagerService {
    ses;
    config;
    log = logger;
    constructor(config = {}) {
        this.config = {
            persistent: true,
            spellCheck: true,
            spellCheckLanguages: ['en-US'],
            cacheSizeLimit: 0,
            ...config,
        };
        if (config.partition) {
            this.ses = session.fromPartition(config.partition, {
                cache: this.config.persistent !== false,
            });
        }
        else {
            this.ses = session.defaultSession;
        }
    }
    async initialize() {
        if (this.config.userAgent) {
            this.ses.setUserAgent(this.config.userAgent);
        }
        if (this.config.proxy) {
            await this.setProxy(this.config.proxy);
        }
        if (this.config.spellCheck !== undefined) {
            this.ses.setSpellCheckerEnabled(this.config.spellCheck);
        }
        if (this.config.spellCheckLanguages) {
            this.ses.setSpellCheckerLanguages(this.config.spellCheckLanguages);
        }
        this.log.info('Session manager initialized');
    }
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
    async resetProxy() {
        await this.ses.setProxy({ mode: 'system' });
        this.log.info('Proxy reset to system');
    }
    async resolveProxy(url) {
        return this.ses.resolveProxy(url);
    }
    async getCookies(domain) {
        const filter = {};
        if (domain) {
            filter.domain = domain;
        }
        return this.ses.cookies.get(filter);
    }
    async setCookie(details) {
        await this.ses.cookies.set(details);
    }
    async removeCookie(url, name) {
        await this.ses.cookies.remove(url, name);
    }
    async clearCookies() {
        await this.ses.clearStorageData({ storages: ['cookies'] });
        this.log.info('All cookies cleared');
    }
    async getCacheSize() {
        const size = await this.ses.getCacheSize();
        return {
            size,
            formattedSize: this.formatBytes(size),
        };
    }
    async clearCache() {
        await this.ses.clearCache();
        this.log.info('HTTP cache cleared');
    }
    async clearAllData() {
        await this.ses.clearStorageData();
        this.log.info('All session storage data cleared');
    }
    async clearSpecificData(storages) {
        await this.ses.clearStorageData({ storages });
        this.log.info(`Cleared storage: ${storages.join(', ')}`);
    }
    setSpellCheckEnabled(enabled) {
        this.ses.setSpellCheckerEnabled(enabled);
        this.log.info(`Spell check ${enabled ? 'enabled' : 'disabled'}`);
    }
    setSpellCheckLanguages(languages) {
        this.ses.setSpellCheckerLanguages(languages);
        this.log.info(`Spell check languages: ${languages.join(', ')}`);
    }
    getAvailableSpellCheckLanguages() {
        return this.ses.availableSpellCheckerLanguages;
    }
    getUserAgent() {
        return this.ses.getUserAgent();
    }
    setUserAgent(userAgent) {
        this.ses.setUserAgent(userAgent);
        this.log.info('User agent updated');
    }
    getDownloadPath() {
        return app.getPath('downloads');
    }
    getSession() {
        return this.ses;
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
    dispose() {
        this.log.info('Session manager disposed');
    }
}
//# sourceMappingURL=session-manager.js.map