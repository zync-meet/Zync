import { session, app } from 'electron';
import * as path from 'path';
import { logger } from '../utils/logger.js';


export interface SessionConfig {

    userAgent?: string | null;

    proxy?: ProxyConfig | null;

    persistent?: boolean;

    partition?: string | null;

    cacheSizeLimit?: number;

    spellCheck?: boolean;

    spellCheckLanguages?: string[];
}


export interface ProxyConfig {

    mode: 'direct' | 'system' | 'fixed_servers' | 'pac_script';

    proxyRules?: string;

    proxyBypassRules?: string;

    pacScript?: string;
}


export interface CacheStats {

    size: number;

    formattedSize: string;
}


export class SessionManagerService {

    private ses: Electron.Session;


    private config: SessionConfig;


    private log = logger;


    constructor(config: SessionConfig = {}) {
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
        } else {
            this.ses = session.defaultSession;
        }
    }


    async initialize(): Promise<void> {

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


    async setProxy(proxy: ProxyConfig): Promise<void> {
        try {
            await this.ses.setProxy({
                mode: proxy.mode,
                proxyRules: proxy.proxyRules,
                proxyBypassRules: proxy.proxyBypassRules,
                pacScript: proxy.pacScript,
            });
            this.log.info(`Proxy set to: ${proxy.mode}`);
        } catch (err) {
            this.log.error('Failed to set proxy:', err);
            throw err;
        }
    }


    async resetProxy(): Promise<void> {
        await this.ses.setProxy({ mode: 'system' });
        this.log.info('Proxy reset to system');
    }


    async resolveProxy(url: string): Promise<string> {
        return this.ses.resolveProxy(url);
    }


    async getCookies(domain?: string): Promise<Electron.Cookie[]> {
        const filter: Electron.CookiesGetFilter = {};
        if (domain) {
            filter.domain = domain;
        }
        return this.ses.cookies.get(filter);
    }


    async setCookie(details: Electron.CookiesSetDetails): Promise<void> {
        await this.ses.cookies.set(details);
    }


    async removeCookie(url: string, name: string): Promise<void> {
        await this.ses.cookies.remove(url, name);
    }


    async clearCookies(): Promise<void> {
        await this.ses.clearStorageData({ storages: ['cookies'] });
        this.log.info('All cookies cleared');
    }


    async getCacheSize(): Promise<CacheStats> {
        const size = await this.ses.getCacheSize();
        return {
            size,
            formattedSize: this.formatBytes(size),
        };
    }


    async clearCache(): Promise<void> {
        await this.ses.clearCache();
        this.log.info('HTTP cache cleared');
    }


    async clearAllData(): Promise<void> {
        await this.ses.clearStorageData();
        this.log.info('All session storage data cleared');
    }


    async clearSpecificData(
        storages: Array<'cookies' | 'filesystem' | 'indexdb' | 'localstorage' | 'shadercache' | 'websql' | 'serviceworkers' | 'cachestorage'>,
    ): Promise<void> {
        await this.ses.clearStorageData({ storages });
        this.log.info(`Cleared storage: ${storages.join(', ')}`);
    }


    setSpellCheckEnabled(enabled: boolean): void {
        this.ses.setSpellCheckerEnabled(enabled);
        this.log.info(`Spell check ${enabled ? 'enabled' : 'disabled'}`);
    }


    setSpellCheckLanguages(languages: string[]): void {
        this.ses.setSpellCheckerLanguages(languages);
        this.log.info(`Spell check languages: ${languages.join(', ')}`);
    }


    getAvailableSpellCheckLanguages(): string[] {
        return this.ses.availableSpellCheckerLanguages;
    }


    getUserAgent(): string {
        return this.ses.getUserAgent();
    }


    setUserAgent(userAgent: string): void {
        this.ses.setUserAgent(userAgent);
        this.log.info('User agent updated');
    }


    getDownloadPath(): string {
        return app.getPath('downloads');
    }


    getSession(): Electron.Session {
        return this.ses;
    }


    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }


    dispose(): void {
        this.log.info('Session manager disposed');
    }
}
