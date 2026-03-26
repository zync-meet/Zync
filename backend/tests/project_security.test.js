// import { describe, it, expect, mock, beforeAll, beforeEach } from "bun:test";
import express from "express";
import request from "supertest";
import path from "path";


process.env.GEMINI_API_KEY_SECONDARY = "mock-key";
process.env.ENCRYPTION_KEY = "mock-encryption-key";


jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: () => Promise.resolve({ response: { text: () => "{}" } })
      };
    }
  }
}));

jest.mock("../middleware/authMiddleware.js", () => {
  const mockTracker = jest.fn((req, res, next) => {
    req.user = { uid: "authenticated-user" };
    next();
  });
  return mockTracker;
});

// Since we need to access it in the tests, we should export it or get it from the mock.
// Actually, it's easier to just use jest.requireMock() in the tests.
import mockAuthMiddlewareTracker from "../middleware/authMiddleware.js";

jest.mock("../services/mailer.js", () => ({
  sendZyncEmail: jest.fn(() => Promise.resolve())
}));

jest.mock("../utils/regexUtils.js", () => ({
  escapeRegExp: jest.fn((str) => str)
}));





const mockPrisma = {
  user: {
    findUnique: jest.fn(() => Promise.resolve({ id: 'user-id', uid: 'authenticated-user' }))
  },
  project: {
    findUnique: jest.fn(() => Promise.resolve({ id: 'project-id', ownerId: 'user-id', team: [], steps: [] })),
    create: jest.fn(() => Promise.resolve({ id: 'new-project-id' })),
    update: jest.fn(() => Promise.resolve({ id: 'project-id' })),
    delete: jest.fn(() => Promise.resolve({ id: 'project-id' })),
    findMany: jest.fn(() => Promise.resolve([]))
  },
  step: {
    findUnique: jest.fn(() => Promise.resolve({ id: 'step-id' })),
    create: jest.fn(() => Promise.resolve({ id: 'new-step-id' })),
    createMany: jest.fn(() => Promise.resolve({ count: 1 }))
  },
  projectTask: {
    findUnique: jest.fn(() => Promise.resolve({ id: 'task-id', stepId: 's1' })),
    create: jest.fn(() => Promise.resolve({ id: 'new-task-id' })),
    update: jest.fn(() => Promise.resolve({ id: 'task-id' })),
    delete: jest.fn(() => Promise.resolve({ id: 'task-id' }))
  }
};

jest.mock("../lib/prisma.js", () => mockPrisma);


import projectRoutes from "../routes/projectRoutes";

describe("Project Routes Security", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get = (key) => {
      if (key === 'io') return { emit: jest.fn() };
      return undefined;
    };
    app.use("/projects", projectRoutes);
  });

  beforeEach(() => {
    mockAuthMiddlewareTracker.mockClear();
  });

  it("POST /projects (Create Project) should require auth", async () => {
    await request(app)
      .post("/projects")
      .send({ name: "Test", description: "Desc" });

    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/generate should require auth", async () => {
    await request(app)
      .post("/projects/generate")
      .send({ name: "Test", description: "Desc" });

    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("GET /projects should require auth", async () => {
    await request(app).get("/projects");
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:id/team should require auth", async () => {
    await request(app).post("/projects/123/team").send({ userId: "user2" });
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("GET /projects/:id should require auth", async () => {
    await request(app).get("/projects/123");
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("DELETE /projects/:id should require auth", async () => {
    await request(app).delete("/projects/123");
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("PATCH /projects/:id should require auth", async () => {
    await request(app).patch("/projects/123").send({ name: "New Name" });
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:projectId/steps/:stepId/tasks should require auth", async () => {
    await request(app)
      .post("/projects/123/steps/s1/tasks")
      .send({ title: "Task" });
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("PUT /projects/:projectId/steps/:stepId/tasks/:taskId should require auth", async () => {
    await request(app)
      .put("/projects/123/steps/s1/tasks/t1")
      .send({ status: "Done" });
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:projectId/quick-task should require auth", async () => {
    await request(app)
      .post("/projects/123/quick-task")
      .send({ title: "Quick Task" });
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:id/analyze-architecture should require auth", async () => {
    await request(app)
      .post("/projects/123/analyze-architecture")
      .send({});
    expect(mockAuthMiddlewareTracker).toHaveBeenCalled();
  });

});
