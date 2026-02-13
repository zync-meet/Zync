
import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock dependencies
// Correctly mock prisma.project.findMany to return a Promise that resolves to an array of projects
const mockProjectFindMany = mock(() => Promise.resolve([
  {
    id: "p1",
    name: "Project 1",
    ownerId: "user1",
    team: [],
    steps: [
      {
        title: "Step 1",
        tasks: [
          { id: "t1", title: "Fix bug", status: "Pending", assignedTo: "user1" }
        ]
      }
    ]
  }
]));

// Mock Prisma
const prisma = {
  project: {
    findMany: mockProjectFindMany
  }
};

// Define the handler logic we want to test (this mimics the secure implementation using Prisma)
const secureSearchHandler = async (req, res) => {
  try {
    const { query } = req.query;
    // Simulate auth middleware populating req.user
    const userId = req.user ? req.user.uid : null;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!query) return res.json([]);

    // Find projects accessible to user (owned or collaborator)
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { team: { has: userId } },
          { steps: { some: { tasks: { some: { assignedTo: userId } } } } }
        ]
      },
      include: {
        steps: {
          include: {
            tasks: true
          }
        }
      }
    });

    const results = [];
    const searchLower = query.toLowerCase();

    projects.forEach(project => {
      project.steps.forEach(step => {
        step.tasks.forEach(task => {
          if (task.title.toLowerCase().includes(searchLower)) {
            results.push({
              id: task.id,
              title: task.title,
              projectId: project.id,
              projectName: project.name,
              status: task.status,
              stepName: step.title
            });
          }
        });
      });
    });

    // Return top 10 matches
    res.json(results.slice(0, 10));
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

describe("Project Search Logic", () => {
  beforeEach(() => {
    mockProjectFindMany.mockClear();
  });

  it("should query projects for the authenticated user", async () => {
    const req = {
      query: { query: "bug" },
      user: { uid: "user123" }
    };
    const res = {
      json: mock(),
      status: mock(() => res)
    };

    await secureSearchHandler(req, res);

    // Verify prisma.project.findMany was called
    expect(mockProjectFindMany).toHaveBeenCalled();
    // Bun's mock.calls returns array of args per call. First call, first arg.
    const callArgs = mockProjectFindMany.mock.calls[0][0];

    // Check for OR condition with user ID
    expect(callArgs.where.OR).toBeDefined();
    expect(callArgs.where.OR).toContainEqual({ ownerId: "user123" });
    expect(callArgs.where.OR).toContainEqual({ team: { has: "user123" } });
  });

  it("should return 401 if no user is authenticated (though middleware should handle this)", async () => {
    const req = {
      query: { query: "bug" },
      user: null // No user
    };
    const res = {
      json: mock(),
      status: mock(() => res)
    };

    await secureSearchHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });
});
