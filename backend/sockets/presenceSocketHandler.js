const prisma = require('../lib/prisma');

// In-memory presence cache — presence is ephemeral so we don't persist it in DB
const onlineUsers = new Map(); // Map<uid, { status, lastSeen }>

module.exports = (io) => {
    const presenceNamespace = io.of('/presence');

    presenceNamespace.on('connection', async (socket) => {
        const { userId } = socket.handshake.query;

        if (!userId) {
            socket.disconnect();
            return;
        }

        socket.join(userId);

        // Update in-memory presence
        const now = new Date();
        onlineUsers.set(userId, { status: 'online', lastSeen: now });

        // Send initial state of ALL online users to this new client
        const initialStatus = [];
        for (const [uid, data] of onlineUsers.entries()) {
            if (uid !== userId) {
                initialStatus.push({ uid, ...data });
            }
        }
        socket.emit('initial-status', initialStatus);

        // Broadcast to everyone
        socket.broadcast.emit('user-status-changed', {
            userId,
            status: 'online',
            lastSeen: now
        });

        socket.on('disconnect', async () => {
            const now = new Date();
            onlineUsers.set(userId, { status: 'offline', lastSeen: now });

            socket.broadcast.emit('user-status-changed', {
                userId,
                status: 'offline',
                lastSeen: now
            });

            // Clean up after a delay in case of reconnect
            setTimeout(() => {
                const entry = onlineUsers.get(userId);
                if (entry && entry.status === 'offline') {
                    onlineUsers.delete(userId);
                }
            }, 30000);
        });

        // Handle explicit status updates (e.g. set to 'away')
        socket.on('update-status', async (newStatus) => {
            const now = new Date();
            onlineUsers.set(userId, { status: newStatus, lastSeen: now });

            socket.broadcast.emit('user-status-changed', {
                userId,
                status: newStatus,
                lastSeen: now
            });
        });
    });
};
