import { describe, it, expect, mock, beforeEach } from "bun:test";
import request from "supertest";
import express from "express";

// Mocks for dependencies
mock.module("../utils/encryption", () => ({ encrypt: () => "encrypted" }));
mock.module("../utils/regexUtils", () => ({ escapeRegExp: (s) => s }));
mock.module("../services/mailer", () => ({ sendZyncEmail: () => Promise.resolve() }));

// Mock firebase-admin
mock.module("firebase-admin", () => {
  return {
    apps: [],
    credential: { cert: () => {} },
    initializeApp: () => {},
    auth: () => ({
      verifyIdToken: (token) => {
        if (token === "valid_token") {
            return Promise.resolve({ uid: "test_uid", email: "test@example.com" });
        }
        return Promise.reject(new Error("Invalid token"));
      }
    })
  };
});

// Mock Models
const mockTeamFind = mock(() => Promise.resolve([]));
const mockUserFindOne = mock(() => Promise.resolve({
  uid: "test_uid",
  connections: [],
  populate: () => Promise.resolve({ uid: "test_uid", connections: [] })
}));
const mockUserFind = mock(() => ({
  sort: () => Promise.resolve([])
}));

mock.module("../models/Team", () => {
  return {
      find: mockTeamFind,
      findById: mock(() => Promise.resolve(null)),
  };
});

mock.module("../models/User", () => {
  return {
      findOne: mockUserFindOne,
      find: mockUserFind,
      findOneAndUpdate: mock(() => Promise.resolve({})),
  };
});

// Import router after mocking
const userRoutes = require("../routes/userRoutes");

const app = express();
app.use(express.json());
app.use("/", userRoutes);

describe("Team Fetch Optimization", () => {
  beforeEach(() => {
    mockTeamFind.mockClear();
    mockUserFindOne.mockClear();
  });

  it("should combine team queries into a single $or query", async () => {
    // Making a request with valid token
    await request(app)
        .get("/")
        .set("Authorization", "Bearer valid_token");

    const calls = mockTeamFind.mock.calls;

    // Check if any call matches the $or structure
    const optimizedCall = calls.find(call => {
        const query = call[0];
        return query && query.$or && query.$or.length === 2;
    });

    // We expect the optimized call to be present
    expect(optimizedCall).toBeDefined();

    if (optimizedCall) {
        // Verify the structure of the $or query
        const orConditions = optimizedCall[0].$or;
        const hasMembers = orConditions.some(c => c.members === "test_uid");
        const hasOwner = orConditions.some(c => c.ownerId === "test_uid");

        expect(hasMembers).toBe(true);
        expect(hasOwner).toBe(true);
    }
  });
});
