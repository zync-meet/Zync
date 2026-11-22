/**
 * socketAuth.js
 *
 * Socket.IO handshake authentication.
 *
 * All socket namespaces previously identified users by a client-supplied
 * `userId` handshake query parameter with NO verification — anyone could
 * connect as any uid (send chat messages as a victim, spoof presence, edit
 * shared notes/tasks).
 *
 * Fix: clients must send a Firebase ID token in the Socket.IO `auth` field
 * (`{ token }` — it is NOT placed in the query string, so it does not leak
 * into URLs/logs). This module verifies the token with firebase-admin and
 * returns the authenticated uid; identity is taken from the token, never
 * from the query.
 *
 * Works with the Firebase Auth emulator (FIREBASE_AUTH_EMULATOR_HOST) in
 * local dev, where firebase-admin verifies emulator tokens automatically.
 */
const { getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestoreAdmin } = require('../services/firebaseAdmin');

let initWarned = false;

/**
 * Ensure a firebase-admin app exists (mirrors middleware/authMiddleware.js).
 * Without a service account we still initialize a bare app so that
 * verifyIdToken() talks to the Auth emulator when FIREBASE_AUTH_EMULATOR_HOST
 * is set; in production the service account credential is used instead.
 */
function ensureAdminApp() {
  if (getApps().length) return;
  getFirestoreAdmin(); // attempts full init with GCP_SERVICE_ACCOUNT_KEY
  if (!getApps().length) {
    try {
      initializeApp({
        projectId:
          process.env.GCLOUD_PROJECT ||
          process.env.VITE_FIREBASE_PROJECT_ID ||
          'demo-zync',
      });
    } catch (error) {
      if (!initWarned) {
        console.warn(
          '[socketAuth] Firebase Admin could not be initialized — socket authentication will reject all connections:',
          error.message
        );
        initWarned = true;
      }
    }
  }
}

/**
 * Verify the socket handshake.
 * @returns {Promise<string|null>} the authenticated uid, or null when the
 *   handshake is missing/invalid — callers MUST disconnect in that case.
 */
async function verifySocketHandshake(socket) {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return null;

  ensureAdminApp();

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid || null;
  } catch (error) {
    // Do not log the token itself.
    return null;
  }
}

module.exports = { verifySocketHandshake, ensureAdminApp };
