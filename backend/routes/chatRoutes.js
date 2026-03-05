const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const verifyToken = require('../middleware/authMiddleware');

// Middleware: reject early if DB not connected
const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database not available' });
  next();
};

/**
 * GET /api/chat/history/:chatId
 * Paginated chat history. Query params: ?cursor=<messageId>&limit=50
 */
router.get('/history/:chatId', verifyToken, requireDb, async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const cursor = req.query.cursor; // last message _id for pagination

    // Verify the requesting user is part of this chat
    const parts = chatId.split('_');
    if (!parts.includes(req.user.uid)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const filter = { chatId };
    if (cursor) {
      filter._id = { $gt: new mongoose.Types.ObjectId(cursor) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    // Normalize _id → id for frontend
    const result = messages.map(m => ({ ...m, id: String(m._id) }));
    res.json(result);
  } catch (error) {
    console.error('[ChatRoutes] history error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/conversations
 * Returns the latest message per conversation for the current user.
 */
router.get('/conversations', verifyToken, requireDb, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Fetch recent messages where user is involved, sorted newest-first
    const recentMessages = await Message.find({
      $or: [{ senderId: uid }, { receiverId: uid }]
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Deduplicate by chatId, keeping the newest message per chat
    const seen = new Set();
    const conversations = [];
    for (const m of recentMessages) {
      if (!seen.has(m.chatId)) {
        seen.add(m.chatId);
        conversations.push({ ...m, id: String(m._id) });
      }
      if (conversations.length >= 100) break;
    }

    res.json(conversations);
  } catch (error) {
    console.error('[ChatRoutes] conversations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/unread-count
 * Returns total unread count for the current user.
 */
router.get('/unread-count', verifyToken, requireDb, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.uid,
      seen: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
