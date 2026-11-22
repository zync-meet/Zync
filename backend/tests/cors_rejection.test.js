/**
 * cors_rejection.test.js
 *
 * Regression tests for CORS rejection handling.
 *
 * A request from a disallowed origin used to flow into the generic error
 * handler as a plain Error → HTTP 500 + console.error(stack). That
 * mis-classified a normal client-side policy condition as a server fault:
 * every scan / disallowed origin inflated 5xx metrics and flooded error
 * logs. Rejections must now be 403 with a warn-level log, and genuine
 * server errors must still be 500.
 */
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { createCorsOptions } = require('../config/cors');
const errorHandler = require('../middleware/errorHandler');

const ALLOWED = ['https://app.example.com', 'https://frontend.example.com'];

function buildApp({ isProduction = false } = {}) {
  const app = express();
  app.use(cors(createCorsOptions({ allowedOrigins: ALLOWED, isProduction })));
  app.get('/api/ping', (req, res) => res.json({ ok: true }));
  app.get('/api/boom', () => {
    throw new Error('kaboom: internal details');
  });
  app.use(errorHandler);
  return app;
}

describe('CORS rejection handling', () => {
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('allows a configured production origin with CORS headers', async () => {
    const app = buildApp({ isProduction: true });
    const res = await request(app)
      .get('/api/ping')
      .set('Origin', 'https://app.example.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://app.example.com');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('responds 403 (not 500) to a disallowed origin', async () => {
    const app = buildApp({ isProduction: true });
    const res = await request(app)
      .get('/api/ping')
      .set('Origin', 'https://evil.example.net');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Not allowed by CORS' });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('logs disallowed-origin rejections at warn, not error', async () => {
    const app = buildApp({ isProduction: true });
    await request(app).get('/api/ping').set('Origin', 'https://evil.example.net');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[CORS] Rejected origin'));
    expect(warnSpy.mock.calls[0][0]).toContain('https://evil.example.net');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('responds 403 to a disallowed preflight (OPTIONS) request', async () => {
    const app = buildApp({ isProduction: true });
    const res = await request(app)
      .options('/api/ping')
      .set('Origin', 'https://evil.example.net')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(403);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('allows any localhost origin outside production (dev/emulator)', async () => {
    const app = buildApp({ isProduction: false });
    const res = await request(app)
      .get('/api/ping')
      .set('Origin', 'http://localhost:9999');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:9999');
  });

  it('rejects localhost origins in production (403, not 500)', async () => {
    const app = buildApp({ isProduction: true });
    const res = await request(app)
      .get('/api/ping')
      .set('Origin', 'http://localhost:9999');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Not allowed by CORS' });
  });

  it('still allows requests with no Origin header (non-browser clients)', async () => {
    const app = buildApp({ isProduction: true });
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('genuine server errors are still 500 (unaffected by the CORS change)', async () => {
    const app = buildApp({ isProduction: true });
    const res = await request(app)
      .get('/api/boom')
      .set('Origin', 'https://app.example.com');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
