/**
 * note_sharing.test.js
 *
 * Regression tests for note-level sharing:
 *   POST /api/notes/:id/share    (invite by email, owner-only)
 *   POST /api/notes/:id/unshare  (remove access, owner-only)
 *   PUT  /api/notes/:id          (permissions map, owner-only)
 *   GET  /api/notes/:id          (viewer/editor access via permissions)
 *
 * The frontend previously sent `{ permissions }` to PUT /api/notes/:id and
 * the backend silently dropped the field (it only accepted title/content/
 * folderId) — "remove collaborator" reported success while changing nothing.
 * These tests pin the contract.
 */
const request = require('supertest');
const express = require('express');

// --- Mutable note document shared by the mocks ----------------------------
const noteDoc = {
  _id: 'note-1',
  ownerId: 'owner_uid',
  title: 'Shared Plan',
  content: { blocks: [] },
  folderId: null,
  projectId: null,
  sharedWith: [],
  permissions: {},
};

const resetNoteDoc = (overrides = {}) => {
  noteDoc.ownerId = 'owner_uid';
  noteDoc.title = 'Shared Plan';
  noteDoc.content = { blocks: [] };
  noteDoc.folderId = null;
  noteDoc.projectId = null;
  noteDoc.sharedWith = [];
  noteDoc.permissions = {};
  Object.assign(noteDoc, overrides);
};

const mockNoteModel = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(() => ({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) })),
  create: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteMany: jest.fn(),
};
const mockFolderModel = {
  find: jest.fn(() => Promise.resolve([])),
  findById: jest.fn(() => Promise.resolve(null)),
};
const mockUserModel = {
  findOne: jest.fn(),
};

jest.mock('../models/Note', () => mockNoteModel);
jest.mock('../models/Folder', () => mockFolderModel);
jest.mock('../models/User', () => mockUserModel);

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

jest.mock('../services/mailer', () => ({
  sendZyncEmail: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../utils/normalize', () => ({
  normalizeDoc: (doc) => doc,
  normalizeDocs: (docs) => docs,
}));
jest.mock('../utils/emailTemplates', () => ({
  getNoteSharedEmailHtml: jest.fn(() => '<html></html>'),
}));

const mockSendZyncEmail = jest.requireMock('../services/mailer').sendZyncEmail;
const noteRoutes = require('../routes/noteRoutes');

const app = express();
app.use(express.json());
app.use('/api/notes', noteRoutes);

const OWNER = { Authorization: 'Bearer owner_uid' };
const EDITOR = { Authorization: 'Bearer editor_uid' };
const VIEWER = { Authorization: 'Bearer viewer_uid' };
const STRANGER = { Authorization: 'Bearer stranger_uid' };

// findById → { lean: async () => cloned noteDoc }
const wireFindById = () => {
  mockNoteModel.findById.mockImplementation(() => ({
    lean: async () => ({
      ...noteDoc,
      sharedWith: [...noteDoc.sharedWith],
      permissions: { ...noteDoc.permissions },
    }),
  }));
  // findByIdAndUpdate applies $set to the shared doc (so a subsequent
  // re-fetch reflects the update), then returns a clone.
  mockNoteModel.findByIdAndUpdate.mockImplementation(async (_id, update) => {
    if (update && update.$set) Object.assign(noteDoc, update.$set);
    return {
      ...noteDoc,
      sharedWith: [...noteDoc.sharedWith],
      permissions: { ...noteDoc.permissions },
    };
  });
};

describe('note-level sharing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNoteDoc();
    wireFindById();
  });

  describe('POST /:id/share (invite by email)', () => {
    const invitee = { uid: 'invitee_uid', email: 'invitee@zync.dev' };

    test('owner invites a known user → permission set + email sent', async () => {
      mockUserModel.findOne.mockImplementation((query) => ({
        lean: async () => (query.email ? invitee : query.uid ? noteDoc && { uid: query.uid, displayName: 'Owner' } : null),
      }));

      const res = await request(app)
        .post('/api/notes/note-1/share')
        .set(OWNER)
        .send({ email: 'invitee@zync.dev' });

      expect(res.status).toBe(200);
      expect(res.body.permissions).toEqual({ invitee_uid: 'editor' });
      expect(mockSendZyncEmail).toHaveBeenCalledWith(
        'invitee@zync.dev',
        'You were invited to a shared note on Zync',
        '<html></html>',
        expect.stringContaining('Shared Plan')
      );
    });

    test('non-owner cannot share → 403', async () => {
      const res = await request(app)
        .post('/api/notes/note-1/share')
        .set(STRANGER)
        .send({ email: 'invitee@zync.dev' });
      expect(res.status).toBe(403);
      expect(mockNoteModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('unknown email → 404 with a helpful message', async () => {
      mockUserModel.findOne.mockImplementation(() => ({ lean: async () => null }));
      const res = await request(app)
        .post('/api/notes/note-1/share')
        .set(OWNER)
        .send({ email: 'nobody@zync.dev' });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/No Zync user/i);
      expect(mockSendZyncEmail).not.toHaveBeenCalled();
    });

    test('inviting the note owner → 400', async () => {
      mockUserModel.findOne.mockImplementation(() => ({
        lean: async () => ({ uid: 'owner_uid', email: 'owner@zync.dev' }),
      }));
      const res = await request(app)
        .post('/api/notes/note-1/share')
        .set(OWNER)
        .send({ email: 'owner@zync.dev' });
      expect(res.status).toBe(400);
    });

    test('invalid email → 400', async () => {
      const res = await request(app)
        .post('/api/notes/note-1/share')
        .set(OWNER)
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    test('email matching is case-insensitive', async () => {
      mockUserModel.findOne.mockImplementation((query) => {
        if (query.email) {
          expect(query.email.$regex).toBe('^Invitee@zync\\.dev$');
          expect(query.email.$options).toBe('i');
        }
        return { lean: async () => invitee };
      });
      const res = await request(app)
        .post('/api/notes/note-1/share')
        .set(OWNER)
        .send({ email: 'Invitee@zync.dev' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /:id/unshare', () => {
    test('owner removes a collaborator → permission gone', async () => {
      resetNoteDoc({ permissions: { invitee_uid: 'editor' } });
      const res = await request(app)
        .post('/api/notes/note-1/unshare')
        .set(OWNER)
        .send({ userId: 'invitee_uid' });
      expect(res.status).toBe(200);
      expect(res.body.permissions).toEqual({});
    });

    test('non-owner cannot unshare → 403', async () => {
      resetNoteDoc({ permissions: { invitee_uid: 'editor' } });
      const res = await request(app)
        .post('/api/notes/note-1/unshare')
        .set(STRANGER)
        .send({ userId: 'invitee_uid' });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /:id with permissions', () => {
    test('owner updates the permissions map → applied', async () => {
      const res = await request(app)
        .put('/api/notes/note-1')
        .set(OWNER)
        .send({ permissions: { editor_uid: 'editor', viewer_uid: 'viewer', bad_uid: 'hacker' } });
      expect(res.status).toBe(200);
      // invalid role values are filtered out
      expect(res.body.permissions).toEqual({
        editor_uid: 'editor',
        viewer_uid: 'viewer',
      });
    });

    test('editor (sharedWith) cannot change permissions → 403', async () => {
      resetNoteDoc({ sharedWith: ['editor_uid'] });
      const res = await request(app)
        .put('/api/notes/note-1')
        .set(EDITOR)
        .send({ permissions: { stranger_uid: 'editor' } });
      expect(res.status).toBe(403);
    });

    test('editor can still update content', async () => {
      resetNoteDoc({ sharedWith: ['editor_uid'] });
      const res = await request(app)
        .put('/api/notes/note-1')
        .set(EDITOR)
        .send({ title: 'Edited by editor' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Edited by editor');
    });

    test('viewer cannot update content → 200 but no content change', async () => {
      resetNoteDoc({ permissions: { viewer_uid: 'viewer' } });
      const res = await request(app)
        .put('/api/notes/note-1')
        .set(VIEWER)
        .send({ title: 'Hack attempt' });
      expect(res.status).toBe(200);
      // the title must be unchanged — viewer edits are ignored
      expect(res.body.title).toBe('Shared Plan');
    });
  });

  describe('GET /:id access via permissions', () => {
    test('viewer with a permissions entry can read the note', async () => {
      resetNoteDoc({ permissions: { viewer_uid: 'viewer' } });
      const res = await request(app).get('/api/notes/note-1').set(VIEWER);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe('note-1');
    });

    test('legacy sharedWith user can read the note', async () => {
      resetNoteDoc({ sharedWith: ['editor_uid'] });
      const res = await request(app).get('/api/notes/note-1').set(EDITOR);
      expect(res.status).toBe(200);
    });

    test('unrelated user is still denied → 403', async () => {
      const res = await request(app).get('/api/notes/note-1').set(STRANGER);
      expect(res.status).toBe(403);
    });
  });
});
