import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  checkPwnedPassword,
  matchPwnedRange,
  sha1HexUpper,
} from './pwnedPasswordCheck';

// jsdom does not implement WebCrypto.subtle — use Node's for the tests.
beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
});

describe('matchPwnedRange (pure parsing)', () => {
  it('finds a matching suffix and parses the count', () => {
    const body = [
      '000000000000000000000000A:3',
      'ABCDEF0123456789ABCDEF012:1234',
      'ZZZZZZZZZZZZZZZZZZZZZZZZZ:99',
    ].join('\n');
    expect(matchPwnedRange(body, 'ABCDEF0123456789ABCDEF012')).toEqual({
      isCompromised: true,
      count: 1234,
    });
  });

  it('returns not compromised when the suffix is absent', () => {
    expect(matchPwnedRange('AAAA:1\nBBBB:2', 'FFFF')).toEqual({
      isCompromised: false,
      count: 0,
    });
  });

  it('ignores malformed lines', () => {
    const body = 'garbage\n\nNO_COLON_LINE\nABCD:5';
    expect(matchPwnedRange(body, 'ABCD')).toEqual({ isCompromised: true, count: 5 });
    expect(matchPwnedRange(body, 'XXXX')).toEqual({ isCompromised: false, count: 0 });
  });
});

describe('sha1HexUpper', () => {
  it('computes the uppercase SHA-1 hex digest', async () => {
    // Known vector: SHA-1("test") = a94a8fe5ccb19ba61c4c0873d391e987982fbbd3
    await expect(sha1HexUpper('test')).resolves.toBe(
      'A94A8FE5CCB19BA61C4C0873D391E987982FBBD3'
    );
  });
});

describe('checkPwnedPassword (k-anonymity, fail-open)', () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('never sends the plaintext password — only the 5-char SHA-1 prefix', async () => {
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response('', { status: 200 })
    );
    globalThis.fetch = fetchMock as any;

    await checkPwnedPassword('some-long-password-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^https:\/\/api\.pwnedpasswords\.com\/range\/[0-9A-F]{5}$/);
    expect(url).not.toContain('some-long-password-123');
    expect(JSON.stringify(init ?? {})).not.toContain('some-long-password-123');
  });

  it('reports the password as compromised when the range contains its suffix', async () => {
    const sha1 = await sha1HexUpper('pwned123');
    const suffix = sha1.slice(5);
    globalThis.fetch = vi.fn(async () => new Response(`DEAD:1\n${suffix}:4242`, { status: 200 })) as any;

    await expect(checkPwnedPassword('pwned123')).resolves.toEqual({
      isCompromised: true,
      count: 4242,
    });
  });

  it('reports not compromised when the suffix is absent from the range', async () => {
    const sha1 = await sha1HexUpper('safepass');
    globalThis.fetch = vi.fn(async () => new Response('DEADBEEF:7', { status: 200 })) as any;

    await expect(checkPwnedPassword('safepass')).resolves.toEqual({
      isCompromised: false,
      count: 0,
    });
  });

  it('fails open on network errors (never blocks signup)', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('failed to fetch');
    }) as any;
    await expect(checkPwnedPassword('anything')).resolves.toEqual({
      isCompromised: false,
      count: 0,
    });
  });

  it('fails open when the API responds with an error status', async () => {
    globalThis.fetch = vi.fn(async () => new Response('too many requests', { status: 429 })) as any;
    await expect(checkPwnedPassword('anything')).resolves.toEqual({
      isCompromised: false,
      count: 0,
    });
  });

  it('fails open for empty passwords without calling fetch', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
    await expect(checkPwnedPassword('')).resolves.toEqual({
      isCompromised: false,
      count: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
