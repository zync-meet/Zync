/**
 * @fileoverview cors.js
 * @module cors
 *
 * Centralized CORS configuration for the main Zync backend.
 *
 * Rejected origins produce a marked error (code: 'CORS_REJECTED',
 * status: 403) instead of a plain Error. The shared error handler
 * (middleware/errorHandler.js) recognizes the marker and responds 403
 * with a warn-level log — a disallowed origin is a client-side policy
 * condition, not a server fault, and must not show up as a 500.
 */

/**
 * Builds the `cors` middleware options.
 *
 * @param {object} params
 * @param {string[]} params.allowedOrigins Origins explicitly allowed in
 *   production (FRONTEND_URL, ALLOWED_ORIGINS, dev ports).
 * @param {boolean} params.isProduction When false (local dev / emulator
 *   runs), any http://localhost:<port> or http://127.0.0.1:<port> origin
 *   is additionally allowed.
 * @returns {object} options to pass to `cors()`
 */
function createCorsOptions({ allowedOrigins, isProduction }) {
  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      // Any localhost port is allowed only outside production (local dev / emulator runs).
      const isLocalDevOrigin =
        !isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (allowedOrigins.indexOf(origin) !== -1 || isLocalDevOrigin) {
        callback(null, true);
      } else {
        // A browser from a disallowed origin is a client-side policy
        // condition, not a server fault. Mark the error so the error
        // handler can report 403 and log at warn instead of a 500 at error.
        const err = new Error('Not allowed by CORS');
        err.status = 403;
        err.code = 'CORS_REJECTED';
        callback(err);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
  };
}

module.exports = { createCorsOptions };
