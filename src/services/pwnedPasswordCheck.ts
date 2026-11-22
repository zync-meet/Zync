/**
 * pwnedPasswordCheck.ts
 *
 * Client-side "Have I Been Pwned" k-anonymity password check for signup.
 *
 * WHY client-side: the previous implementation called a PUBLIC backend
 * endpoint (POST /api/users/check-breached-password) that received the
 * plaintext password from any unauthenticated caller and triggered an
 * outbound HTTP request per call. The check now runs in the browser
 * against HIBP's CORS-enabled Pwned Passwords API, where ONLY the first
 * 5 characters of the password's SHA-1 hash ever leave this device
 * (k-anonymity) and the plaintext password is never transmitted to
 * any server we operate.
 *
 * Failure semantics: fail open. Any error (network, HIBP down, timeout,
 * non-secure context without WebCrypto) returns "not compromised" — a
 * third-party availability hiccup must never block account creation.
 */

export interface PwnedPasswordResult {
  isCompromised: boolean;
  count: number;
}

const PWNED_PASSWORDS_BASE = 'https://api.pwnedpasswords.com/range/';
const REQUEST_TIMEOUT_MS = 5000;

/** SHA-1 of `text` as an uppercase hex string (via WebCrypto). */
export async function sha1HexUpper(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Pure: locate `suffix` (the last 27 chars of a SHA-1 hash) inside a
 * HIBP /range/ response body, which is "SUFFIX:COUNT" lines.
 * Exported for unit testing.
 */
export function matchPwnedRange(
  rangeBody: string,
  suffix: string
): PwnedPasswordResult {
  for (const line of rangeBody.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const idx = trimmed.indexOf(':');
    if (idx === -1) {
      continue;
    }
    if (trimmed.slice(0, idx) === suffix) {
      return { isCompromised: true, count: parseInt(trimmed.slice(idx + 1), 10) };
    }
  }
  return { isCompromised: false, count: 0 };
}

/**
 * Checks `password` against the HIBP pwned-passwords list using
 * k-anonymity (only the 5-char SHA-1 prefix is sent). Never throws.
 */
export async function checkPwnedPassword(
  password: string
): Promise<PwnedPasswordResult> {
  const FAIL_OPEN: PwnedPasswordResult = { isCompromised: false, count: 0 };
  if (!password || typeof crypto === 'undefined' || !crypto.subtle) {
    return FAIL_OPEN;
  }
  try {
    const sha1 = await sha1HexUpper(password);
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${PWNED_PASSWORDS_BASE}${prefix}`, {
        headers: { 'Add-Padding': 'true' },
        signal: controller.signal,
      });
      if (!res.ok) {
        return FAIL_OPEN;
      }
      const body = await res.text();
      return matchPwnedRange(body, suffix);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return FAIL_OPEN;
  }
}
