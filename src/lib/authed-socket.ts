/**
 * authed-socket.ts
 *
 * Creates Socket.IO connections authenticated with a Firebase ID token.
 *
 * The backend verifies the token in the handshake (`auth: { token }`) and
 * derives the user identity from it — the `userId` query parameter is no
 * longer trusted by the server. Every socket namespace must be created
 * through this helper so that:
 *
 *   1. The token is sent in the (non-URL) auth field, not the query string.
 *   2. The token is refreshed automatically before each reconnection
 *      attempt, since ID tokens expire after ~1 hour.
 *   3. No connection is attempted while logged out (the server would
 *      reject it anyway).
 */
import { io, type Socket } from 'socket.io-client';
import { auth } from '@/lib/firebase';

export interface AuthedSocketOptions {
  query?: Record<string, string>;
  transports?: ('websocket' | 'polling')[];
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * Create an authenticated Socket.IO connection.
 *
 * The socket is returned immediately (handlers can be attached right away);
 * the actual connect() happens once a valid ID token is available. If there
 * is no logged-in user, the socket stays disconnected.
 */
export function createAuthedSocket(url: string, options: AuthedSocketOptions = {}): Socket {
  const socket = io(url, {
    query: options.query,
    transports: options.transports ?? ['websocket', 'polling'],
    reconnection: options.reconnection ?? true,
    reconnectionAttempts: options.reconnectionAttempts ?? 5,
    reconnectionDelay: options.reconnectionDelay ?? 1000,
    // Defer the first connect until the token below is attached.
    autoConnect: false,
  });

  // Refresh the ID token before every (re)connect attempt — tokens expire
  // after ~1h and socket.io reconnection would otherwise resend a stale one.
  socket.io.on('reconnect_attempt', () => {
    const user = auth.currentUser;
    if (user) {
      user
        .getIdToken()
        .then((token) => {
          socket.auth = { token };
        })
        .catch(() => {
          /* keep previous token; server will reject if invalid */
        });
    }
  });

  const start = () => {
    const user = auth.currentUser;
    if (!user) return; // stay disconnected while logged out
    user
      .getIdToken()
      .then((token) => {
        if (!socket.active) return; // closed before we got a token
        socket.auth = { token };
        socket.connect();
      })
      .catch(() => {
        /* unable to fetch token — remain disconnected */
      });
  };

  start();
  return socket;
}
