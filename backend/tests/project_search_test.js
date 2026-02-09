
import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock dependencies
// Correctly mock Project.find to return a Promise that resolves to an array of projects
const mockProjectFind = mock(() => Promise.resolve([
  {
    _id: "p1",
    name: "Project 1",
    ownerId: "user1",
    steps: [
      {
        title: "Step 1",
        tasks: [
          { id: "t1", title: "Fix bug", status: "Pending" }
        ]
      }
    ]
  }
]));

// Mock the Project model
const Project = {
  find: mockProjectFind
};

// Define the handler logic we want to test (this mimics the secure implementation)
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
    const projects = await Project.find({
      $or: [
        { ownerId: userId },
        { team: userId },
        { 'steps.tasks.assignedTo': userId }
      ]
    });

    const results = [];
    const regex = new RegExp(query, 'i');

    projects.forEach(project => {
      project.steps.forEach(step => {
        step.tasks.forEach(task => {
          if (regex.test(task.title)) {
            results.push({
              id: task.id,
              title: task.title,
              projectId: project._id,
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
    mockProjectFind.mockClear();
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

    // Verify Project.find was called with correct query
    expect(mockProjectFind).toHaveBeenCalled();
    // Bun's mock.calls returns array of args per call. First call, first arg.
    const callArgs = mockProjectFind.mock.calls[0][0];

    // Check for $or condition with user ID
    expect(callArgs).toEqual({
      $or: [
        { ownerId: "user123" },
        { team: "user123" },
        { 'steps.tasks.assignedTo': "user123" }
      ]
    });
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
