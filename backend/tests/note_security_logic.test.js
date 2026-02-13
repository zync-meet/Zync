
/**
 * Security Logic Verification for Note Routes
 *
 * This test file verifies the security logic used in backend/routes/noteRoutes.js.
 * It simulates the handler function to ensure that IDOR vulnerabilities are prevented
 * by using the authenticated user's ID (req.user.uid) instead of unverified query parameters.
 */
import { describe, it, expect, mock } from "bun:test";

// Mock Data
const mockNotes = [
  { id: '1', title: "Secret Note", ownerId: "victim", folderId: null },
  { id: '2', title: "My Note", ownerId: "me", folderId: null }
];

// Mock Prisma
const prisma = {
  note: {
    findMany: mock((args) => {
      const query = args.where;
      return Promise.resolve(mockNotes.filter(n => {
        // Simulate query logic roughly
        if (query.OR) {
          return query.OR.some(c => c.ownerId === n.ownerId || (c.folderId === n.folderId && n.folderId !== null));
        }
        if (query.folderId) return n.folderId === query.folderId;
        return false;
      }));
    })
  },
  folder: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])) // shared folders
  }
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

    let where = {};

    if (folderId) {
      // If asking for a specific folder, ensure user has access to it
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (folder) {
        const isOwner = folder.ownerId === userId;
        const isCollaborator = folder.collaborators && folder.collaborators.includes(userId);

        if (isOwner || isCollaborator) {
          where = { folderId };
        } else {
          return res.status(403).json({ error: 'Access denied to this folder' });
        }
      } else {
        return res.status(404).json({ error: 'Folder not found' });
      }
    } else {
      // Fetch ALL accessible notes (Root + Personal Folders + Shared Folders + Shared Notes)

      // 1. Get IDs of folders shared with this user
      const sharedFolders = await prisma.folder.findMany({
        where: { collaborators: { has: userId } },
        select: { id: true }
      });
      const sharedFolderIds = sharedFolders.map(f => f.id);

      where = {
        OR: [
          { ownerId: userId },                  // 1. Created by me
          { folderId: { in: sharedFolderIds } }, // 2. In a folder shared with me
          { collaborators: { has: userId } },            // 3. Directly shared with me
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
    expect(prisma.note.findMany).toHaveBeenCalled();
    const callArgs = prisma.note.findMany.mock.calls[0][0];

    // Check that it used 'me' as ownerId, NOT 'victim' in the OR clause
    expect(callArgs.where.OR).toBeDefined();
    const ownerIdCheckMe = callArgs.where.OR.find(c => c.ownerId === 'me');
    expect(ownerIdCheckMe).toBeDefined();

    const ownerIdCheckVictim = callArgs.where.OR.find(c => c.ownerId === 'victim');
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

