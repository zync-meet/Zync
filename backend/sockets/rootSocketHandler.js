/**
 * rootSocketHandler.js
 *
 * The default (root) Socket.IO namespace is used by ProjectDetails for
 * `projectUpdate` / `taskUpdated` broadcasts — which include full project
 * objects. The namespace previously accepted anonymous connections, so any
 * client could eavesdrop on every project update in the system.
 *
 * This handler requires a valid Firebase ID token in the handshake
 * (`auth: { token }`) and disconnects everyone else.
 */
const { verifySocketHandshake } = require('./socketAuth');

module.exports = (io) => {
  io.on('connection', async (socket) => {
    const uid = await verifySocketHandshake(socket);
    if (!uid) {
      console.warn(`[RootSocket] ❌ Unauthenticated connection rejected (${socket.id})`);
      socket.disconnect();
      return;
    }
    // No additional root-namespace events are handled — the client only
    // receives io.emit() broadcasts.
  });
};
