const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Folder = require('../models/Folder');
const verifyToken = require('../middleware/authMiddleware');

// --- Folders ---

// Create a new folder
router.post('/folders', verifyToken, async (req, res) => {
  try {
    const { name, ownerId, parentId, type, projectId, color } = req.body;
    
    // Ensure the authenticated user is the owner
    if (ownerId && ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized: Cannot create folder for another user' });
    }
    // If ownerId not provided, default to authenticated user?
    // Current code required ownerId. Let's strictly enforce it matches or use req.user.uid.
    const finalOwnerId = ownerId || req.user.uid;

    const folder = new Folder({
      name,
      ownerId: finalOwnerId,
      parentId: parentId || null,
      type: type || 'personal',
      projectId: projectId || null,
      color
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all folders for a user
router.get('/folders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    // We ignore req.query.userId to prevent IDOR

    // Fetch personal folders (owner) AND shared folders (collaborator)
    const folders = await Folder.find({
      $or: [
        { ownerId: userId },
        { collaborators: userId }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share a folder
router.post('/folders/:id/share', verifyToken, async (req, res) => {
  try {
    const { collaboratorIds } = req.body; // Array of UIDs
    const { id } = req.params;

    // Check ownership
    const folderToCheck = await Folder.findById(id);
    if (!folderToCheck) return res.status(404).json({ error: 'Folder not found' });

    if (folderToCheck.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized: Only owner can share folder' });
    }

    const folder = await Folder.findByIdAndUpdate(
      id,
      { $addToSet: { collaborators: { $each: collaboratorIds } } },
      { new: true }
    );

    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Notes ---

// Create a new note
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, ownerId, folderId, projectId, tags } = req.body;

    // Enforce ownerId matches authenticated user
    if (ownerId && ownerId !== req.user.uid) {
       return res.status(403).json({ error: 'Unauthorized: Cannot create note for another user' });
    }
    const finalOwnerId = ownerId || req.user.uid;

    const note = new Note({
      title: title || 'Untitled',
      content: content || {},
      ownerId: finalOwnerId,
      folderId: folderId || null,
      projectId: projectId || null,
      tags: tags || []
    });

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notes for a user (optionally filtered by folder)
router.get('/', verifyToken, async (req, res) => {
  try {
    // SECURITY FIX: Use req.user.uid instead of req.query.userId
    const userId = req.user.uid;
    const { folderId } = req.query;
    
    // Validate folderId is a string if provided
    if (folderId && typeof folderId !== 'string') {
      return res.status(400).json({ error: 'Invalid Folder ID format' });
    }

    let query = {};

    if (folderId) {
      // If asking for a specific folder, ensure user has access to it
      const folder = await Folder.findById(folderId);
      if (folder) {
         const isOwner = folder.ownerId === userId;
         const isCollaborator = folder.collaborators && folder.collaborators.includes(userId);
         
         if (isOwner || isCollaborator) {
            query = { folderId };
         } else {
             return res.status(403).json({ error: 'Access denied to this folder' });
         }
      } else {
          // Folder not found or looking for root notes?
          // If folderId is provided but not found, return empty or error.
           return res.status(404).json({ error: 'Folder not found' });
      }
    } else {
        // Fetch ALL accessible notes (Root + Personal Folders + Shared Folders + Shared Notes)
        
        // 1. Get IDs of folders shared with this user
        const sharedFolders = await Folder.find({ collaborators: userId }).select('_id');
        const sharedFolderIds = sharedFolders.map(f => f._id);
        
        query = {
            $or: [
                { ownerId: userId },                  // 1. Created by me
                { folderId: { $in: sharedFolderIds } }, // 2. In a folder shared with me
                { collaborators: userId },            // 3. Directly shared with me
                { isShared: true, projectId: { $ne: null } } // 4. (Optional) Project notes if we impl project permissions
            ]
        };
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single note by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Check access: Owner or Collaborator or Shared
    // (Assuming shared notes logic should exist, but sticking to basic ownership for now based on context)
    // Note schema has `isShared`, `collaborators`

    const isOwner = note.ownerId === req.user.uid;
    const isCollaborator = note.collaborators && note.collaborators.includes(req.user.uid);
    // If note is in a folder, check folder permissions?
    // The main list query checks folder permissions. Here we check note permissions.
    // Ideally we should also check folder permissions if note inherits them.
    // But let's check basic note access first.

    if (!isOwner && !isCollaborator && !note.isShared) {
        // If it's in a shared folder, user should have access?
        if (note.folderId) {
             const folder = await Folder.findById(note.folderId);
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
    const { title, content, folderId, isPinned, tags } = req.body;
    
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Only owner can update? Or collaborators?
    // Let's assume owner and collaborators can update content
    const isOwner = note.ownerId === req.user.uid;
    const isCollaborator = note.collaborators && note.collaborators.includes(req.user.uid);

    if (!isOwner && !isCollaborator) {
         return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { 
        ...(title && { title }),
        ...(content && { content }),
        ...(folderId !== undefined && { folderId }),
        ...(isPinned !== undefined && { isPinned }),
        ...(tags && { tags })
      },
      { new: true }
    );

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a note
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Only owner can delete
    if (note.ownerId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized: Only owner can delete note' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
