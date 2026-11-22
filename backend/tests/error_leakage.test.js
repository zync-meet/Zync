/**
 * error_leakage.test.js
 *
 * Regression tests for internal error detail leaking to clients.
 *
 * ~44 catch blocks used to echo the raw `error.message` in 500
 * responses. Mongo/Redis/Firebase error messages can expose internal
 * detail (DB hosts, collection/index names, file paths, third-party
 * error text) — a direct information-disclosure channel. All 500s now
 * go through utils/errorResponses.sendInternalError, which sends a
 * generic message and logs the stack server-side (detail in dev only).
 */
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const express = require('express');
const { sendInternalError } = require('../utils/errorResponses');
const errorHandler = require('../middleware/errorHandler');

function mockRes() {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
  };
  return res;
}

describe('sendInternalError (utils/errorResponses)', () => {
  const prevNodeEnv = process.env.NODE_ENV;
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    logSpy.mockRestore();
    process.env.NODE_ENV = prevNodeEnv;
  });

  it('production: sends a generic 500 body without the raw error message', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    const err = new Error('MongoServerError: collection "users" has no index on uid');
    sendInternalError(res, err, 'Server error');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('MongoServerError');
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('users');
  });

  it('development: includes the raw message to aid local debugging', () => {
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    const err = new Error('something broke internally');
    sendInternalError(res, err, 'Server error');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'something broke internally',
    });
  });

  it('logs the error stack server-side', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    const err = new Error('kaboom');
    sendInternalError(res, err);
    expect(logSpy).toHaveBeenCalled();
    expect(String(logSpy.mock.calls[0][0])).toContain('kaboom');
  });

  it('merges extra safe fields the client relies on', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    sendInternalError(res, new Error('x'), 'Internal Server Error', { ok: false });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
      ok: false,
    });
  });

  it('defaults to "Internal Server Error" when no fallback is given', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    sendInternalError(res, new Error('x'));
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });

  it('does not throw when the error is missing', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();
    expect(() => sendInternalError(res, undefined)).not.toThrow();
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});

describe('shared error handler', () => {
  const prevNodeEnv = process.env.NODE_ENV;
  let logSpy;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    logSpy.mockRestore();
    process.env.NODE_ENV = prevNodeEnv;
  });

  it('responds 500 with a generic body when a route throws', async () => {
    const app = express();
    app.get('/boom', () => {
      throw new Error('secret internal detail: mongodb+srv://user:pass@host/db');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    const bodyStr = JSON.stringify(res.body);
    expect(res.body.message).toBe('Internal Server Error');
    expect(bodyStr).not.toContain('secret internal detail');
    expect(bodyStr).not.toContain('mongodb+srv');
  });
});

describe('leak sweep (regression guard)', () => {
  it('no 500 response body may reference raw error message/stack', () => {
    const base = path.join(__dirname, '..');
    const dirs = ['routes', 'controllers', 'services'];
    const files = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith('.js')) files.push(p);
      }
    };
    for (const d of dirs) walk(path.join(base, d));

    const status500 = /status\(500\)/g;
    const offenders = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(status500)) {
        const window = src.slice(m.index, m.index + 220);
        if (/[eE]rror\.message|err\.message|[eE]rror\.stack/.test(window)) {
          const line = src.slice(0, m.index).split('\n').length;
          offenders.push(`${path.relative(base, f)}:${line}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
