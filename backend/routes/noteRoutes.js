const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');

// --- Folders ---

// Create a new folder
router.post('/folders', verifyToken, async (req, res) => {
  try {
    const { name, ownerId, parentId, type, projectId, color } = req.body;

    if (ownerId && ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized: Cannot create folder for another user' });
    }
    const finalOwnerId = ownerId || req.user.uid;

    const folder = await prisma.folder.create({
      data: {
        name,
        ownerId: finalOwnerId,
        parentId: parentId || null,
        type: type || 'personal',
        projectId: projectId || null,
        color: color || '#FFFFFF'
      }
    });

    res.status(201).json(folder);
  } catch (error) {
    // Unique constraint violation (same name in same parent for same owner)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A folder with this name already exists in this location' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all folders for a user
router.get('/folders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const folders = await prisma.folder.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { has: userId } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share a folder
router.post('/folders/:id/share', verifyToken, async (req, res) => {
  try {
    const { collaboratorIds } = req.body;
    const { id } = req.params;

    const folderToCheck = await prisma.folder.findUnique({ where: { id } });
    if (!folderToCheck) return res.status(404).json({ error: 'Folder not found' });

    if (folderToCheck.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized: Only owner can share folder' });
    }

    // Merge existing collaborators with new ones (no duplicates)
    const existing = folderToCheck.collaborators || [];
    const merged = [...new Set([...existing, ...collaboratorIds])];

    const folder = await prisma.folder.update({
      where: { id },
      data: { collaborators: merged }
    });

    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Notes ---

// Create a new note
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, ownerId, folderId, projectId } = req.body;

    if (ownerId && ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized: Cannot create note for another user' });
    }
    const finalOwnerId = ownerId || req.user.uid;

    const note = await prisma.note.create({
      data: {
        title: title || 'Untitled',
        content: content || {},
        ownerId: finalOwnerId,
        folderId: folderId || null,
        projectId: projectId || null
      }
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notes for a user (optionally filtered by folder)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { folderId } = req.query;

    if (folderId && typeof folderId !== 'string') {
      return res.status(400).json({ error: 'Invalid Folder ID format' });
    }

    let where = {};

    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      const isOwner = folder.ownerId === userId;
      const isCollaborator = folder.collaborators && folder.collaborators.includes(userId);
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ error: 'Access denied to this folder' });
      }
      where = { folderId };
    } else {
      // Get folder IDs shared with this user
      const sharedFolders = await prisma.folder.findMany({
        where: { collaborators: { has: userId } },
        select: { id: true }
      });
      const sharedFolderIds = sharedFolders.map(f => f.id);

      where = {
        OR: [
          { ownerId: userId },
          { folderId: { in: sharedFolderIds } },
          { sharedWith: { has: userId } }
        ]
      };
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single note by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const isOwner = note.ownerId === req.user.uid;
    const isShared = note.sharedWith && note.sharedWith.includes(req.user.uid);

    if (!isOwner && !isShared) {
      // Check folder permissions
      if (note.folderId) {
        const folder = await prisma.folder.findUnique({ where: { id: note.folderId } });
        if (folder && (folder.ownerId === req.user.uid || (folder.collaborators && folder.collaborators.includes(req.user.uid)))) {
          // Access granted via folder
        } else {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a note
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, content, folderId } = req.body;

    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const isOwner = note.ownerId === req.user.uid;
    const isShared = note.sharedWith && note.sharedWith.includes(req.user.uid);

    if (!isOwner && !isShared) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (folderId !== undefined) updateData.folderId = folderId;

    const updatedNote = await prisma.note.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a note
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized: Only owner can delete note' });
    }

    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
