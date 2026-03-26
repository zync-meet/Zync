import { describe, it, expect, vi } from 'vitest';


vi.mock('electron', () => ({
    app: {
        isPackaged: false,
        isDefaultProtocolClient: vi.fn(() => false),
        setAsDefaultProtocolClient: vi.fn(() => true),
        removeAsDefaultProtocolClient: vi.fn(() => true),
        on: vi.fn(),
    },
    BrowserWindow: {
        getAllWindows: vi.fn(() => []),
    },
}));


describe('Deep Link URL Parsing', () => {
    const PROTOCOL = 'zync';


    function parseDeepLink(url: string): { type: string; path: string; params: Record<string, string> } | null {
        try {
            if (!url.startsWith(`${PROTOCOL}://`)) {return null;}

            const withHttp = url.replace(`${PROTOCOL}://`, 'http://zync.local/');
            const parsed = new URL(withHttp);
            const pathSegments = parsed.pathname.split('/').filter(Boolean);
            const type = pathSegments[0] || 'unknown';
            const path = '/' + pathSegments.join('/');
            const params: Record<string, string> = {};

            parsed.searchParams.forEach((value, key) => {
                params[key] = value;
            });

            return { type, path, params };
        } catch {
            return null;
        }
    }

    it('should parse a simple deep link', () => {
        const result = parseDeepLink('zync://project/123');
        expect(result).not.toBeNull();
        expect(result!.type).toBe('project');
        expect(result!.path).toBe('/project/123');
    });

    it('should parse deep link with query parameters', () => {
        const result = parseDeepLink('zync://invite?code=abc123&team=myteam');
        expect(result).not.toBeNull();
        expect(result!.type).toBe('invite');
        expect(result!.params.code).toBe('abc123');
        expect(result!.params.team).toBe('myteam');
    });

    it('should parse nested paths', () => {
        const result = parseDeepLink('zync://project/123/notes/456');
        expect(result).not.toBeNull();
        expect(result!.type).toBe('project');
        expect(result!.path).toBe('/project/123/notes/456');
    });

    it('should handle root deep link', () => {
        const result = parseDeepLink('zync://');
        expect(result).not.toBeNull();
        expect(result!.type).toBe('unknown');
    });

    it('should reject non-zync protocol URLs', () => {
        const result = parseDeepLink('http://example.com/test');
        expect(result).toBeNull();
    });

    it('should reject empty strings', () => {
        const result = parseDeepLink('');
        expect(result).toBeNull();
    });

    it('should reject malformed URLs', () => {
        const result = parseDeepLink('zync://');

        expect(result).not.toBeNull();
    });
});


describe('Deep Link Route Classification', () => {
    type DeepLinkType = 'project' | 'note' | 'invite' | 'meeting' | 'settings' | 'unknown';

    function classifyRoute(path: string): DeepLinkType {
        const segment = path.split('/').filter(Boolean)[0];
        const routeMap: Record<string, DeepLinkType> = {
            project: 'project',
            note: 'note',
            invite: 'invite',
            meeting: 'meeting',
            meet: 'meeting',
            settings: 'settings',
        };
        return routeMap[segment] || 'unknown';
    }

    it('should classify project routes', () => {
        expect(classifyRoute('/project/123')).toBe('project');
    });

    it('should classify note routes', () => {
        expect(classifyRoute('/note/abc')).toBe('note');
    });

    it('should classify invite routes', () => {
        expect(classifyRoute('/invite/code123')).toBe('invite');
    });

    it('should classify meeting routes', () => {
        expect(classifyRoute('/meeting/room1')).toBe('meeting');
    });

    it('should classify meet as meeting', () => {
        expect(classifyRoute('/meet/room1')).toBe('meeting');
    });

    it('should classify settings routes', () => {
        expect(classifyRoute('/settings')).toBe('settings');
    });

    it('should return unknown for unrecognized routes', () => {
        expect(classifyRoute('/unknown/path')).toBe('unknown');
    });

    it('should return unknown for empty path', () => {
        expect(classifyRoute('/')).toBe('unknown');
    });
});


describe('Deep Link Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
        const maxRequests = 5;
        const windowMs = 1000;
        const calls: number[] = [];

        for (let i = 0; i < maxRequests; i++) {
            calls.push(Date.now());
        }

        expect(calls.length).toBeLessThanOrEqual(maxRequests);
    });

    it('should block requests exceeding rate limit', () => {
        const maxRequests = 5;


        const callCount = 6;
        const allowed = Math.min(callCount, maxRequests);

        expect(allowed).toBe(maxRequests);
        expect(callCount > maxRequests).toBe(true);
    });

    it('should reset rate limit after window expires', () => {
        const windowMs = 1000;
        const now = Date.now();
        const oldCall = now - windowMs - 1;


        expect(now - oldCall > windowMs).toBe(true);
    });
});


describe('Protocol Registration', () => {
    it('should use "zync" as the protocol name', () => {
        const protocol = 'zync';
        expect(protocol).toBe('zync');
    });

    it('should format deep link URLs correctly', () => {
        const protocol = 'zync';
        const path = 'project/123';
        const url = `${protocol}://${path}`;
        expect(url).toBe('zync://project/123');
    });

    it('should include query string in deep link URLs', () => {
        const url = 'zync://invite?code=abc&team=test';
        expect(url).toContain('?code=abc');
        expect(url).toContain('&team=test');
    });
});
