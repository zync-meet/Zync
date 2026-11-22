/**
 * user_profile_security.test.js
 *
 * Regression tests for the unauthenticated profile/phone-verification routes:
 *   GET  /api/users/:uid          (was public — PII enumeration)
 *   PUT  /api/users/:uid          (was public — any-user record tampering)
 *   POST /api/users/verify-phone/request  (was public — set phone on any user)
 *   POST /api/users/verify-phone/confirm  (was public)
 *
 * All four must now require a token, and the profile/phone routes must
 * operate only on the authenticated user's own record.
 */
const request = require('supertest');
const express = require('express');

const createSelectLeanChain = (result) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(() => Promise.resolve({})),
  deleteOne: jest.fn(() => Promise.resolve({})),
  create: jest.fn(),
}));

jest.mock('../models/Team', () => ({
  findById: jest.fn(),
  find: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../models/Project', () => ({
  find: jest.fn(() => Promise.resolve([])),
}));

// Token format: `Bearer <uid>` → req.user = { uid: <uid> }
jest.mock('../middleware/authMiddleware', () => {
  return jest.fn((req, res, next) => {
    const header = req.headers.authorization || req.headers.Authorization;
    if (header && header.startsWith('Bearer ') && header.split(' ')[1]) {
      req.user = { uid: header.split(' ')[1], email: `${header.split(' ')[1]}@test.com` };
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  });
});

jest.mock('../utils/encryption', () => ({
  encrypt: jest.fn((v) => v),
  decrypt: jest.fn((v) => v),
}));
jest.mock('../utils/regexUtils', () => ({ escapeRegExp: jest.fn((v) => v) }));
jest.mock('../services/mailer', () => ({
  sendZyncEmail: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../services/sheetLogger', () => ({
  appendRow: jest.fn(() => Promise.resolve()),
}));
jest.mock('../utils/normalize', () => ({
  normalizeDoc: (doc) => doc,
  normalizeDocs: (docs) => docs,
}));
jest.mock('../utils/emailTemplates', () => ({
  getNewUserRegistrationTemplate: jest.fn(() => '<html></html>'),
  getPhoneVerificationEmailHtml: jest.fn(() => '<html></html>'),
  getChatRequestEmailHtml: jest.fn(() => '<html></html>'),
  getAccountDeletionCodeEmailHtml: jest.fn(() => '<html></html>'),
}));
jest.mock('../services/cloudinaryService', () => ({
  deleteCloudinaryAsset: jest.fn(() => Promise.resolve()),
}));
jest.mock('../services/geoService', () => ({
  resolveIp: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../services/haveIBeenPwnedService', () => ({
  checkPassword: jest.fn(() => Promise.resolve({ breached: false })),
}));

const mockUserModel = jest.requireMock('../models/User');
const userRoutes = require('../routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

const SELF_TOKEN = { Authorization: 'Bearer alice_uid' };
const OTHER_TOKEN = { Authorization: 'Bearer alice_uid' };

describe('user profile & phone-verification route security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication required', () => {
    test('GET /api/users/:uid without token → 401', async () => {
      const res = await request(app).get('/api/users/alice_uid');
      expect(res.status).toBe(401);
    });

    test('PUT /api/users/:uid without token → 401', async () => {
      const res = await request(app).put('/api/users/alice_uid').send({ displayName: 'hax' });
      expect(res.status).toBe(401);
    });

    test('POST /api/users/verify-phone/request without token → 401', async () => {
      const res = await request(app)
        .post('/api/users/verify-phone/request')
        .send({ uid: 'alice_uid', phoneNumber: '+15550001111' });
      expect(res.status).toBe(401);
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    test('POST /api/users/verify-phone/confirm without token → 401', async () => {
      const res = await request(app)
        .post('/api/users/verify-phone/confirm')
        .send({ uid: 'alice_uid', code: '123456' });
      expect(res.status).toBe(401);
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });
  });

  describe('ownership enforced', () => {
    test('GET another user\'s profile → 403', async () => {
      const res = await request(app).get('/api/users/mallory_uid').set(OTHER_TOKEN);
      expect(res.status).toBe(403);
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    test('PUT another user\'s profile → 403 (no DB write)', async () => {
      const res = await request(app)
        .put('/api/users/mallory_uid')
        .set(OTHER_TOKEN)
        .send({ email: 'attacker@evil.com', isPhoneVerified: true });
      expect(res.status).toBe(403);
      expect(mockUserModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });

    test('GET own profile → 200 with the user doc', async () => {
      const doc = { uid: 'alice_uid', displayName: 'Alice', email: 'alice@test.com' };
      mockUserModel.findOne.mockReturnValue(createSelectLeanChain(doc));

      const res = await request(app).get('/api/users/alice_uid').set(SELF_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.uid).toBe('alice_uid');
    });

    test('PUT own profile → 200 and updates only own record', async () => {
      const doc = { uid: 'alice_uid', displayName: 'Alice New' };
      mockUserModel.findOneAndUpdate.mockResolvedValue(doc);

      const res = await request(app)
        .put('/api/users/alice_uid')
        .set(SELF_TOKEN)
        .send({ displayName: 'Alice New' });

      expect(res.status).toBe(200);
      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      const [filter] = mockUserModel.findOneAndUpdate.mock.calls[0];
      expect(filter).toEqual({ uid: 'alice_uid' });
    });
  });

  describe('phone verification operates on the authenticated user only', () => {
    test('verify-phone/request ignores body uid, uses token uid', async () => {
      const userDoc = { uid: 'alice_uid', email: 'alice@test.com' };
      mockUserModel.findOne.mockReturnValue(createSelectLeanChain(userDoc));

      const res = await request(app)
        .post('/api/users/verify-phone/request')
        .set(SELF_TOKEN)
        .send({ uid: 'mallory_uid', phoneNumber: '+15550001111' });

      expect(res.status).toBe(200);
      // The DB lookup must target the token's uid, not the body's uid.
      const [filter] = mockUserModel.findOne.mock.calls[0];
      expect(filter).toEqual({ uid: 'alice_uid' });
      const updateCalls = mockUserModel.updateOne.mock.calls;
      expect(updateCalls.length).toBeGreaterThan(0);
      expect(updateCalls[0][0]).toEqual({ uid: 'alice_uid' });
    });

    test('verify-phone/confirm targets the token uid, not the body uid', async () => {
      const userDoc = {
        uid: 'alice_uid',
        phoneVerificationCode: '123456',
        phoneVerificationCodeExpires: new Date(Date.now() + 60 * 60 * 1000),
      };
      mockUserModel.findOne.mockReturnValue(createSelectLeanChain(userDoc));

      const res = await request(app)
        .post('/api/users/verify-phone/confirm')
        .set(SELF_TOKEN)
        .send({ uid: 'mallory_uid', code: '123456' });

      expect(res.status).toBe(200);
      const [filter] = mockUserModel.findOne.mock.calls[0];
      expect(filter).toEqual({ uid: 'alice_uid' });
    });
  });
});
