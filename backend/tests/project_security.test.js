
import { describe, it, expect, mock, beforeAll, beforeEach } from "bun:test";
import express from "express";
import request from "supertest";
import path from "path";

// Mock environment variables
process.env.GEMINI_API_KEY_SECONDARY = "mock-key";
process.env.ENCRYPTION_KEY = "mock-encryption-key";

// Mock dependencies using mock.module
mock.module("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: () => Promise.resolve({ response: { text: () => "{}" } })
      };
    }
  }
}));

// Mock require.cache for CJS dependencies
const authMiddlewarePath = path.resolve(__dirname, "../middleware/authMiddleware.js");
const authMiddlewareTracker = mock((req, res, next) => {
  req.user = { uid: "authenticated-user" };
  next();
});

require.cache[authMiddlewarePath] = {
  id: authMiddlewarePath,
  filename: authMiddlewarePath,
  loaded: true,
  exports: authMiddlewareTracker
};

const projectModelPath = path.resolve(__dirname, "../models/Project.js");
class MockProject {
    constructor(data) { Object.assign(this, data); }
    save() { return Promise.resolve(this); }
    static findById() { return Promise.resolve(null); }
    static findByIdAndUpdate() { return Promise.resolve(null); }
    static findByIdAndDelete() { return Promise.resolve(null); }
    static find() { return Promise.resolve([]); }
    static findOne() { return Promise.resolve(null); }
}
require.cache[projectModelPath] = {
    id: projectModelPath,
    filename: projectModelPath,
    loaded: true,
    exports: MockProject
};

const userModelPath = path.resolve(__dirname, "../models/User.js");
require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: {
        findOne: () => Promise.resolve(null)
    }
};

const mailerPath = path.resolve(__dirname, "../services/mailer.js");
require.cache[mailerPath] = {
    id: mailerPath,
    filename: mailerPath,
    loaded: true,
    exports: {
        sendZyncEmail: () => Promise.resolve()
    }
};

const prismaPath = path.resolve(__dirname, "../lib/prisma.js");
require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: {}
};

const regexUtilsPath = path.resolve(__dirname, "../utils/regexUtils.js");
require.cache[regexUtilsPath] = {
    id: regexUtilsPath,
    filename: regexUtilsPath,
    loaded: true,
    exports: {
        escapeRegExp: (str) => str
    }
};

// Import the router
const projectRoutes = require("../routes/projectRoutes");

describe("Project Routes Security", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/projects", projectRoutes);
  });

  beforeEach(() => {
    authMiddlewareTracker.mockClear();
  });

  it("POST /projects (Create Project) should require auth", async () => {
    await request(app)
      .post("/projects")
      .send({ name: "Test", description: "Desc" });

    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/generate should require auth", async () => {
    await request(app)
      .post("/projects/generate")
      .send({ name: "Test", description: "Desc" });

    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("GET /projects should require auth", async () => {
    await request(app).get("/projects");
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:id/team should require auth", async () => {
    await request(app).post("/projects/123/team").send({ userId: "user2" });
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("GET /projects/:id should require auth", async () => {
    await request(app).get("/projects/123");
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("DELETE /projects/:id should require auth", async () => {
    await request(app).delete("/projects/123");
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("PATCH /projects/:id should require auth", async () => {
    await request(app).patch("/projects/123").send({ name: "New Name" });
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:projectId/steps/:stepId/tasks should require auth", async () => {
    await request(app)
      .post("/projects/123/steps/s1/tasks")
      .send({ title: "Task" });
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("PUT /projects/:projectId/steps/:stepId/tasks/:taskId should require auth", async () => {
    await request(app)
      .put("/projects/123/steps/s1/tasks/t1")
      .send({ status: "Done" });
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:projectId/quick-task should require auth", async () => {
    await request(app)
      .post("/projects/123/quick-task")
      .send({ title: "Quick Task" });
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

  it("POST /projects/:id/analyze-architecture should require auth", async () => {
    await request(app)
      .post("/projects/123/analyze-architecture")
      .send({});
    expect(authMiddlewareTracker).toHaveBeenCalled();
  });

});
