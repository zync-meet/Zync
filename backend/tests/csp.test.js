/**
 * csp.test.js
 *
 * Regression tests for the Content-Security-Policy.
 *
 * The production CSP used to allow `'unsafe-inline'` and `'unsafe-eval'`
 * in script-src — the two directives that most weaken a CSP against XSS
 * (an injected <script> would execute, and eval() could be used to run
 * arbitrary code). The Vite production build contains no inline scripts
 * and no eval, so both are banned here. This test fails loudly if either
 * keyword is ever re-added.
 */
const request = require('supertest');
const express = require('express');
const { createSecurityMiddleware, CSP_DIRECTIVES } = require('../config/csp');

describe('Content-Security-Policy (backend production CSP)', () => {
  it('does not allow unsafe-eval in script-src', () => {
    expect(CSP_DIRECTIVES['script-src']).not.toContain("'unsafe-eval'");
  });

  it('does not allow unsafe-inline in script-src', () => {
    expect(CSP_DIRECTIVES['script-src']).not.toContain("'unsafe-inline'");
  });

  it('keeps the documented style-src unsafe-inline exception', () => {
    // React renders style={{...}} attributes throughout the UI; removing
    // this breaks the frontend. Documented in config/csp.js.
    expect(CSP_DIRECTIVES['style-src']).toContain("'unsafe-inline'");
  });

  it('still permits the required external script origins', () => {
    const scriptSrc = CSP_DIRECTIVES['script-src'];
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).toContain('https://apis.google.com');
    expect(scriptSrc).toContain('https://www.gstatic.com');
  });

  describe('emitted header', () => {
    let app;
    beforeAll(() => {
      app = express();
      app.use(createSecurityMiddleware());
      app.get('/', (req, res) => res.json({ ok: true }));
    });

    it('sets a Content-Security-Policy header on responses', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('emits a script-src without unsafe-eval or unsafe-inline', async () => {
      const res = await request(app).get('/');
      const csp = res.headers['content-security-policy'];
      const scriptSrc = csp
        .split(';')
        .map((d) => d.trim())
        .find((d) => d.startsWith('script-src'));
      expect(scriptSrc).toBeDefined();
      expect(scriptSrc).not.toContain("'unsafe-eval'");
      expect(scriptSrc).not.toContain("'unsafe-inline'");
    });

    it('keeps helmet defaults (object-src none, frame-ancestors self)', async () => {
      const res = await request(app).get('/');
      const csp = res.headers['content-security-policy'];
      expect(csp).toContain("object-src 'none'");
      expect(csp).toMatch(/frame-ancestors 'self'/);
    });
  });
});
