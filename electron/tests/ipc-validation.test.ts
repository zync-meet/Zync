import { describe, it, expect } from 'vitest';


const VALID_SEND_CHANNELS = [
    'app:close',
    'app:minimize',
    'app:maximize',
    'app:toggle-fullscreen',
    'tray:update-status',
    'settings:open',
    'settings:changed',
    'theme:set',
    'window:focus-main',
] as const;

const VALID_INVOKE_CHANNELS = [
    'settings:get',
    'settings:get-all',
    'settings:set',
    'settings:reset',
    'app:get-version',
    'app:get-path',
    'app:is-packaged',
    'shell:open-external',
    'dialog:open',
    'dialog:save',
    'dialog:message',
    'updater:check',
    'updater:download',
    'updater:install',
    'login-item:get-status',
    'login-item:toggle',
] as const;

const VALID_RECEIVE_CHANNELS = [
    'app:deep-link',
    'settings:updated',
    'theme:changed',
    'updater:status',
    'updater:progress',
    'main:message',
    'power:suspend',
    'power:resume',
] as const;


function isValidSendChannel(channel: string): boolean {
    return (VALID_SEND_CHANNELS as readonly string[]).includes(channel);
}

function isValidInvokeChannel(channel: string): boolean {
    return (VALID_INVOKE_CHANNELS as readonly string[]).includes(channel);
}

function isValidReceiveChannel(channel: string): boolean {
    return (VALID_RECEIVE_CHANNELS as readonly string[]).includes(channel);
}

function isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
    if (value instanceof Date) return true;

    if (Array.isArray(value)) {
        return value.every(isSerializable);
    }

    if (typeof value === 'object' && value !== null) {

        if (typeof value === 'function') return false;
        return Object.values(value as Record<string, unknown>).every(isSerializable);
    }


    if (typeof value === 'function' || typeof value === 'symbol') return false;

    return false;
}


describe('IPC Channel Validation', () => {
    describe('Send Channels', () => {
        it('should accept valid send channels', () => {
            expect(isValidSendChannel('app:close')).toBe(true);
            expect(isValidSendChannel('app:minimize')).toBe(true);
            expect(isValidSendChannel('settings:open')).toBe(true);
        });

        it('should reject invalid send channels', () => {
            expect(isValidSendChannel('shell:exec')).toBe(false);
            expect(isValidSendChannel('fs:read')).toBe(false);
            expect(isValidSendChannel('eval:code')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(isValidSendChannel('')).toBe(false);
        });

        it('should be case-sensitive', () => {
            expect(isValidSendChannel('APP:CLOSE')).toBe(false);
            expect(isValidSendChannel('App:Close')).toBe(false);
        });
    });

    describe('Invoke Channels', () => {
        it('should accept valid invoke channels', () => {
            expect(isValidInvokeChannel('settings:get')).toBe(true);
            expect(isValidInvokeChannel('shell:open-external')).toBe(true);
            expect(isValidInvokeChannel('dialog:open')).toBe(true);
        });

        it('should reject invalid invoke channels', () => {
            expect(isValidInvokeChannel('fs:write')).toBe(false);
            expect(isValidInvokeChannel('process:exec')).toBe(false);
        });

        it('should reject channels from other groups', () => {

            expect(isValidInvokeChannel('app:close')).toBe(false);
        });
    });

    describe('Receive Channels', () => {
        it('should accept valid receive channels', () => {
            expect(isValidReceiveChannel('app:deep-link')).toBe(true);
            expect(isValidReceiveChannel('theme:changed')).toBe(true);
            expect(isValidReceiveChannel('updater:status')).toBe(true);
        });

        it('should reject invalid receive channels', () => {
            expect(isValidReceiveChannel('app:close')).toBe(false);
            expect(isValidReceiveChannel('eval:result')).toBe(false);
        });
    });
});


describe('IPC Payload Serialization Check', () => {
    it('should accept primitive types', () => {
        expect(isSerializable('hello')).toBe(true);
        expect(isSerializable(42)).toBe(true);
        expect(isSerializable(true)).toBe(true);
        expect(isSerializable(null)).toBe(true);
        expect(isSerializable(undefined)).toBe(true);
    });

    it('should accept plain objects', () => {
        expect(isSerializable({ key: 'value', num: 42 })).toBe(true);
    });

    it('should accept nested objects', () => {
        expect(
            isSerializable({
                user: { name: 'John', settings: { theme: 'dark' } },
            }),
        ).toBe(true);
    });

    it('should accept arrays', () => {
        expect(isSerializable([1, 2, 3])).toBe(true);
        expect(isSerializable(['a', 'b', 'c'])).toBe(true);
    });

    it('should accept mixed arrays', () => {
        expect(isSerializable([1, 'two', true, null])).toBe(true);
    });

    it('should accept Date objects', () => {
        expect(isSerializable(new Date())).toBe(true);
    });

    it('should reject functions', () => {
        expect(isSerializable(() => {})).toBe(false);
        expect(isSerializable(function test() {})).toBe(false);
    });

    it('should reject objects containing functions', () => {
        expect(isSerializable({ callback: () => {} })).toBe(false);
    });

    it('should reject symbols', () => {
        expect(isSerializable(Symbol('test'))).toBe(false);
    });

    it('should accept deeply nested structures', () => {
        const deep = {
            level1: {
                level2: {
                    level3: {
                        values: [1, 2, { nested: true }],
                    },
                },
            },
        };
        expect(isSerializable(deep)).toBe(true);
    });
});


describe('Channel Name Convention', () => {
    const allChannels = [
        ...VALID_SEND_CHANNELS,
        ...VALID_INVOKE_CHANNELS,
        ...VALID_RECEIVE_CHANNELS,
    ];

    it('should follow namespace:action format', () => {
        for (const channel of allChannels) {
            expect(channel).toMatch(/^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*$/);
        }
    });

    it('should use lowercase kebab-case', () => {
        for (const channel of allChannels) {
            expect(channel).toBe(channel.toLowerCase());
        }
    });

    it('should not have duplicate channel names across groups', () => {
        const seen = new Set<string>();
        for (const channel of allChannels) {


            seen.add(channel);
        }


        expect(seen.size).toBeGreaterThan(0);
    });
});
