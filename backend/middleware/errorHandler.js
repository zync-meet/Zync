/**
 * @fileoverview errorHandler.js
 * @module errorHandler
 *
 * Shared Express error-handling middleware for the main Zync backend.
 * Registered last in index.js so it catches anything bubbled via next(err).
 *
 * Behaviour:
 * - CORS policy rejections (err.code === 'CORS_REJECTED', produced by
 *   config/cors.js) → 403 + warn-level log. These are client-side
 *   conditions (a disallowed origin) and must not count as server 5xx.
 * - Everything else → 500 + error-level log with the stack.
 */

/**
 * @param {import('express').ErrorRequestHandler}
 */
function errorHandler(err, req, res, next) {
  // CORS policy rejections are not server errors: a request from a
  // disallowed origin (or an unauthenticated/absent origin) is expected,
  // and in production can come from scanners or other apps. Report 403
  // and log at warn so they don't inflate 5xx metrics or flood error logs.
  if (err && err.code === 'CORS_REJECTED') {
    console.warn(
      `[CORS] Rejected origin: ${req.headers.origin || '(none)'} for ${req.method} ${req.path}`
    );
    return res.status(err.status || 403).json({ message: 'Not allowed by CORS' });
  }

  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

module.exports = errorHandler;
