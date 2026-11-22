/**
 * socket_auth.test.js
 *
 * Regression tests for Socket.IO handshake authentication.
 *
 * All socket namespaces previously identified users by a client-supplied
 * `userId` handshake query parameter with NO verification — anyone could
 * connect as any uid (send chat messages as a victim, spoof presence,
 * edit shared notes, eavesdrop on project broadcasts).
 *
 * These tests assert that every namespace:
 *   - disconnects sockets with no token
 *   - disconnects sockets with an invalid token
 *   - accepts sockets with a valid token and derives identity from it
 *     (ignoring any spoofed `query.userId`)
 */

// --- Firebase Admin mocks -------------------------------------------------
// NOTE: name must start with `mock` — jest.mock factories are hoisted and
// may only reference out-of-scope variables with that prefix.
const mockVerifyIdToken = jest.fn(async (token) => {
  if (token === 'valid_token') return { uid: 'authed_uid' };
  throw new Error('invalid token');
});

jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
}));
jest.mock('firebase-admin/app', () => ({
  getApps: () => [{}], // pretend the admin app is already initialized
  initializeApp: jest.fn(),
}));
jest.mock('../services/firebaseAdmin', () => ({
  getFirestoreAdmin: jest.fn(),
}));

const { verifySocketHandshake } = require('../sockets/socketAuth');
const verifyIdTokenMock = mockVerifyIdToken;

// --- Fake Socket.IO infrastructure ----------------------------------------
const makeFakeSocket = (token, query = { userId: 'spoofed_uid' }) => ({
  id: 'sock-1',
  handshake: {
    auth: token ? { token } : undefined,
    query,
  },
  disconnect: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  emit: jest.fn(),
  // distinct room object per call so emitted events can be inspected
  to: jest.fn(() => ({ emit: jest.fn() })),
  broadcast: { emit: jest.fn() },
  on: jest.fn(),
  rooms: new Set(),
});

const makeFakeIo = () => {
  const namespaces = {};
  const io = {
    of: (name) => {
      if (!namespaces[name]) {
        namespaces[name] = {
          _handlers: {},
          on: (evt, cb) => {
            namespaces[name]._handlers[evt] = cb;
          },
          // distinct room object per call so emitted events can be inspected
          to: jest.fn(() => ({ emit: jest.fn() })),
          emit: jest.fn(),
        };
      }
      return namespaces[name];
    },
    _rootHandlers: {},
    on: (evt, cb) => {
      io._rootHandlers[evt] = cb;
    },
  };
  return io;
};

const connectionHandler = (ns) => ns._handlers['connection'];

describe('verifySocketHandshake', () => {
  beforeEach(() => verifyIdTokenMock.mockClear());

  test('no token → null', async () => {
    const uid = await verifySocketHandshake(makeFakeSocket(undefined));
    expect(uid).toBeNull();
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  test('invalid token → null', async () => {
    const uid = await verifySocketHandshake(makeFakeSocket('bad_token'));
    expect(uid).toBeNull();
  });

  test('valid token → verified uid', async () => {
    const uid = await verifySocketHandshake(makeFakeSocket('valid_token'));
    expect(uid).toBe('authed_uid');
  });
});

describe('namespace connection handlers', () => {
  beforeEach(() => verifyIdTokenMock.mockClear());

  test.each([
    ['chat', '../sockets/chatSocketHandler'],
    ['presence', '../sockets/presenceSocketHandler'],
    ['notes', '../sockets/noteSocketHandler'],
    ['tasks', '../sockets/taskSocketHandler'],
  ])('%s namespace rejects unauthenticated connections', async (name, handlerPath) => {
    const handler = require(handlerPath);
    const io = makeFakeIo();
    handler(io);

    // No token
    const noAuth = makeFakeSocket(undefined);
    await connectionHandler(io.of(`/${name}`))(noAuth);
    expect(noAuth.disconnect).toHaveBeenCalled();
    expect(verifyIdTokenMock).not.toHaveBeenCalled();

    // Invalid token
    const badToken = makeFakeSocket('bad_token');
    await connectionHandler(io.of(`/${name}`))(badToken);
    expect(badToken.disconnect).toHaveBeenCalled();
  });

  test.each([
    ['chat', '../sockets/chatSocketHandler'],
    ['presence', '../sockets/presenceSocketHandler'],
    ['notes', '../sockets/noteSocketHandler'],
    ['tasks', '../sockets/taskSocketHandler'],
  ])('%s namespace accepts a valid token', async (name, handlerPath) => {
    const handler = require(handlerPath);
    const io = makeFakeIo();
    handler(io);

    const good = makeFakeSocket('valid_token');
    await connectionHandler(io.of(`/${name}`))(good);
    expect(good.disconnect).not.toHaveBeenCalled();
  });
});

describe('notes namespace identity comes from the token, not the payload', () => {
  beforeEach(() => verifyIdTokenMock.mockClear());

  test('join_note registers the verified uid even when the client spoofs userId', async () => {
    const handler = require('../sockets/noteSocketHandler');
    const io = makeFakeIo();
    handler(io);

    const socket = makeFakeSocket('valid_token');
    await connectionHandler(io.of('/notes'))(socket);
    expect(socket.disconnect).not.toHaveBeenCalled();

    // Grab the registered join_note callback and invoke it with a spoofed
    // userId — the server must key presence by the verified uid instead.
    const joinNoteCall = socket.on.mock.calls.find((c) => c[0] === 'join_note');
    expect(joinNoteCall).toBeDefined();
    joinNoteCall[1]({
      noteId: 'note-1',
      userId: 'spoofed_uid',
      userName: 'Impostor',
      userAvatar: null,
      userColor: '#ff0000',
    });

    // broadcastPresence emits presence_update to the note room
    const toMock = io.of('/notes').to;
    const noteCallIndex = toMock.mock.calls.findIndex((c) => c[0] === 'note-1');
    expect(noteCallIndex).toBeGreaterThanOrEqual(0);
    const roomEmit = toMock.mock.results[noteCallIndex].value.emit;
    const [event, userList] = roomEmit.mock.calls[0];
    expect(event).toBe('presence_update');
    expect(userList).toHaveLength(1);
    expect(userList[0].id).toBe('authed_uid');
  });
});

describe('root namespace (project broadcasts) is authenticated', () => {
  test('anonymous root connection is disconnected', async () => {
    const handler = require('../sockets/rootSocketHandler');
    const io = makeFakeIo();
    handler(io);

    const anon = makeFakeSocket(undefined);
    await io._rootHandlers['connection'](anon);
    expect(anon.disconnect).toHaveBeenCalled();

    const good = makeFakeSocket('valid_token');
    await io._rootHandlers['connection'](good);
    expect(good.disconnect).not.toHaveBeenCalled();
  });
});
