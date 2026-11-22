/**
 * @fileoverview csp.js
 * @module csp
 *
 * Centralized helmet / Content-Security-Policy configuration for the
 * main Zync backend. Keeping the policy in its own module makes it
 * unit-testable (tests/csp.test.js) and prevents the policy from
 * drifting between deployment paths.
 *
 * SECURITY NOTES
 * --------------
 * - `script-src` intentionally contains NO 'unsafe-eval' and NO
 *   'unsafe-inline'. The production frontend is a Vite build whose
 *   index.html has zero inline <script> tags and whose bundle does not
 *   call eval() — both relaxations were only ever needed by dev
 *   tooling and are the single biggest XSS amplifier in a CSP, so they
 *   are banned from the served policy.
 * - `style-src` keeps 'unsafe-inline' as a documented, accepted risk:
 *   the React app renders `style={{...}}` attributes throughout the UI
 *   and removing it breaks the frontend. Style-only inline is far less
 *   dangerous than script-only inline.
 * - If a future dependency requires eval() or an inline script, prefer
 *   a per-script hash or a nonced Vite transform over re-adding a
 *   global 'unsafe-*' keyword.
 */

const helmet = require('helmet');

const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    'blob:',
    'https://apis.google.com',
    'https://www.googleapis.com',
    'https://www.gstatic.com',
    'https://www.google.com',
  ],
  'connect-src': [
    "'self'",
    'https://github.com',
    'https://api.github.com',
    'http://localhost:*',
    'ws://localhost:*',
    'wss://*.glitch.me',
    'https://*.googleapis.com',
    'https://www.google.com',
    'https://www.gstatic.com',
    'https://*.firebaseio.com',
    'https://*.firebase.google.com',
    // Client-side HIBP k-anonymity password check (signup): only a
    // 5-char SHA-1 prefix is sent, never the password itself.
    'https://api.pwnedpasswords.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://avatars.githubusercontent.com',
    'https://*.githubusercontent.com',
    'https://*.googleusercontent.com',
    'https://*.google.com',
    'blob:',
    'https://ui-avatars.com',
    'https://res.cloudinary.com',
  ],
  'style-src': [
    // Documented exception: React inline style attributes (see header).
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  'worker-src': ["'self'", 'blob:'],
  'frame-src': [
    "'self'",
    'https://github.com',
    'https://*.firebaseapp.com',
    'https://*.google.com',
  ],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
};

/**
 * Builds the helmet middleware with the hardened CSP for the main
 * backend. Exported as a factory (rather than a pre-built middleware)
 * so tests can construct it in isolation.
 *
 * @returns {import('express').RequestHandler}
 */
function createSecurityMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: CSP_DIRECTIVES,
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

module.exports = { createSecurityMiddleware, CSP_DIRECTIVES };
