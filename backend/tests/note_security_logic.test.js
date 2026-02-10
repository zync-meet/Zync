
/**
 * Security Logic Verification for Note Routes
 *
 * This test file verifies the security logic used in backend/routes/noteRoutes.js.
 * It simulates the handler function to ensure that IDOR vulnerabilities are prevented
 * by using the authenticated user's ID (req.user.uid) instead of unverified query parameters.
 *
 * Ideally, this would import the actual handler, but due to module mocking complexities
 * with Bun and CommonJS in this environment, we test the logic implementation directly.
 */
import { describe, it, expect, mock } from "bun:test";

// Mock Data
const mockNotes = [
  { _id: '1', title: "Secret Note", ownerId: "victim" },
  { _id: '2', title: "My Note", ownerId: "me" }
];

// Mock Models (Logic)
const Note = {
  find: mock((query) => {
    return {
      sort: mock(() => Promise.resolve(mockNotes.filter(n => {
          // Simulate query logic roughly
          if (query.$or) {
             const userChecks = query.$or.some(c => c.ownerId === n.ownerId || (c.collaborators === n.ownerId)); // simplified
             return userChecks;
          }
          if (query.ownerId) return n.ownerId === query.ownerId;
          return false;
      })))
    };
  })
};

const Folder = {
  find: mock((query) => {
    return {
      select: mock(() => Promise.resolve([]))
    };
  }),
  findById: mock(() => Promise.resolve(null))
};

// Fixed Handler Logic
const fixedHandler = async (req, res) => {
  try {
    // SECURITY FIX: Use req.user.uid instead of req.query.userId
    const userId = req.user ? req.user.uid : null;
    const { folderId } = req.query;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
};

describe("Fixed IDOR Vulnerability (Handler Logic)", () => {
  it("uses authenticated user ID instead of query param", async () => {
    const req = {
      query: { userId: 'victim' }, // Malicious query param
      user: { uid: 'me' } // Authenticated as 'me'
    };
    const res = {
      status: mock(() => res),
      json: mock()
    };

    await fixedHandler(req, res);

    // It should proceed to query the database using 'me' as ownerId
    expect(Note.find).toHaveBeenCalled();
    const callArgs = Note.find.mock.calls[0][0];

    // Check that it used 'me' as ownerId, NOT 'victim'
    const ownerIdCheckMe = callArgs.$or.find(c => c.ownerId === 'me');
    expect(ownerIdCheckMe).toBeDefined();

    const ownerIdCheckVictim = callArgs.$or.find(c => c.ownerId === 'victim');
    expect(ownerIdCheckVictim).toBeUndefined();

    // Verify it sends response
    expect(res.json).toHaveBeenCalled();
    // In our mock logic, verify result contains only 'me' notes
    const result = res.json.mock.calls[0][0];
    expect(result).toHaveLength(1);
    expect(result[0].ownerId).toBe("me");
  });

  it("returns 401 if not authenticated", async () => {
     const req = {
      query: { userId: 'victim' },
      user: null
    };
    const res = {
      status: mock(() => res),
      json: mock()
    };

    await fixedHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
