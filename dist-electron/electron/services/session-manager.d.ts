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
export declare class SessionManagerService {
    private ses;
    private config;
    private log;
    constructor(config?: SessionConfig);
    initialize(): Promise<void>;
    setProxy(proxy: ProxyConfig): Promise<void>;
    resetProxy(): Promise<void>;
    resolveProxy(url: string): Promise<string>;
    getCookies(domain?: string): Promise<Electron.Cookie[]>;
    setCookie(details: Electron.CookiesSetDetails): Promise<void>;
    removeCookie(url: string, name: string): Promise<void>;
    clearCookies(): Promise<void>;
    getCacheSize(): Promise<CacheStats>;
    clearCache(): Promise<void>;
    clearAllData(): Promise<void>;
    clearSpecificData(storages: Array<'cookies' | 'filesystem' | 'indexdb' | 'localstorage' | 'shadercache' | 'websql' | 'serviceworkers' | 'cachestorage'>): Promise<void>;
    setSpellCheckEnabled(enabled: boolean): void;
    setSpellCheckLanguages(languages: string[]): void;
    getAvailableSpellCheckLanguages(): string[];
    getUserAgent(): string;
    setUserAgent(userAgent: string): void;
    getDownloadPath(): string;
    getSession(): Electron.Session;
    private formatBytes;
    dispose(): void;
}
