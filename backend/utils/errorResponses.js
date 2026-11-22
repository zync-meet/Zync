/**
 * @fileoverview errorResponses.js
 * @module errorResponses
 *
 * Centralized helper for 500 (internal server error) responses.
 *
 * Raw `error.message` must never be echoed to the client in production:
 * it can leak internal detail — database hosts, collection/index names,
 * file paths, third-party service error text. The message is included
 * only in development to aid local debugging. Every 500 is logged with
 * its stack so real failures remain diagnosable server-side.
 */

/**
 * Responds with a 500 whose body contains a safe, generic message.
 *
 * @param {import('express').Response} res
 * @param {Error} [error] The caught error (logged, never leaked in prod).
 * @param {string} [fallbackMessage] Generic client-facing message.
 * @param {object} [extra] Extra safe fields the client relies on
 *   (e.g. `{ ok: false }`), merged into the response body.
 * @returns {import('express').Response}
 */
function sendInternalError(res, error, fallbackMessage = 'Internal Server Error', extra = {}) {
  if (error && error.stack) {
    console.error(error.stack);
  } else if (error) {
    console.error(error);
  }
  const body = { message: fallbackMessage, ...extra };
  if (process.env.NODE_ENV === 'development' && error && error.message) {
    body.error = error.message;
  }
  return res.status(500).json(body);
}

module.exports = { sendInternalError };
