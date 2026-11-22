/**
 * upload_download.test.js
 *
 * Regression tests for the generic upload download path.
 *
 * POST /api/upload used to return `/uploads/<file>` — a URL no route served,
 * so every chat attachment 404'd — and files were never cleaned up (unbounded
 * disk growth). Files are now served via authenticated GET /api/upload/files/:filename
 * with a 24h TTL cleanup.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const request = require('supertest');
const express = require('express');

jest.mock('../middleware/authMiddleware', () => {
  return jest.fn((req, res, next) => {
    const header = req.headers.authorization || req.headers.Authorization;
    if (header && header.startsWith('Bearer ') && header.split(' ')[1]) {
      req.user = { uid: header.split(' ')[1], email: 't@t.com' };
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  });
});

jest.mock('../models/User', () => ({
  findOne: jest.fn(() => Promise.resolve(null)),
  updateOne: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../models/Team', () => ({
  findById: jest.fn(() => Promise.resolve(null)),
  updateOne: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../services/cloudinaryService', () => ({
  deleteCloudinaryAsset: jest.fn(() => Promise.resolve()),
  uploadProfilePhoto: jest.fn(),
  uploadImageBuffer: jest.fn(),
}));
jest.mock('../utils/redisClient', () => ({
  isAvailable: () => false,
  getRedisClient: () => null,
}));
jest.mock('../utils/imageOptimizer', () => ({
  optimizeImage: jest.fn(() => Promise.resolve(Buffer.from(''))),
}));

const uploadRoutes = require('../routes/uploadRoutes');

const app = express();
app.use('/api/upload', uploadRoutes);

const uploadDir = path.join(__dirname, '../uploads');
const AUTH = { Authorization: 'Bearer test_uid' };

const newFilename = (ext = 'png') =>
  `${crypto.randomBytes(16).toString('hex')}.${ext}`;

describe('GET /api/upload/files/:filename (authenticated download)', () => {
  const files = [];

  afterEach(() => {
    for (const f of files.splice(0)) {
      try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* ignore */ }
    }
  });

  test('without token → 401', async () => {
    const res = await request(app).get('/api/upload/files/doesnotmatter.png');
    expect(res.status).toBe(401);
  });

  test('serves an existing file with its content type', async () => {
    const filename = newFilename('png');
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from('fake-png-bytes'));
    files.push(filename);

    const res = await request(app).get(`/api/upload/files/${filename}`).set(AUTH);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(res.body.toString('binary')).toBe('fake-png-bytes');
  });

  test('missing file → 404', async () => {
    const filename = newFilename('png');
    const res = await request(app).get(`/api/upload/files/${filename}`).set(AUTH);
    expect(res.status).toBe(404);
  });

  test('path traversal / non-allowlisted names → 400', async () => {
    expect((await request(app).get('/api/upload/files/..%2F.env').set(AUTH)).status).toBe(400);
    expect((await request(app).get('/api/upload/files/evil.html').set(AUTH)).status).toBe(400);
    expect((await request(app).get(`/api/upload/files/${'x'.repeat(33)}.png`).set(AUTH)).status).toBe(400);
  });

  test('legacy /uploads/ URLs are not served (404 at app level)', async () => {
    // The old public path must not exist on this router.
    const filename = newFilename('png');
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from('x'));
    files.push(filename);
    const res = await request(app).get(`/uploads/${filename}`);
    expect(res.status).toBe(404);
  });
});
