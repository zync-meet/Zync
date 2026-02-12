import { describe, it, expect, mock } from "bun:test";
import request from "supertest";
import express from "express";

// Mock User model
const mockUserMethods = {
  findOne: mock((query) => {
    // Return a user if found. For simplicity, return a dummy user.
    // In real app, we might check query.uid
    return Promise.resolve({
      uid: query.uid || "secure_uid",
      phoneNumber: "1234567890",
      save: mock(() => Promise.resolve({})),
      populate: mock(() => Promise.resolve({}))
    });
  }),
  findOneAndUpdate: mock(() => Promise.resolve({
    uid: "secure_uid",
    displayName: "Updated Name"
  })),
  save: mock(() => Promise.resolve({})),
  populate: mock(() => Promise.resolve({}))
};

class UserMock {
    constructor(data) {
        Object.assign(this, data);
    }
    async save() { return this; }
    async populate() { return this; }
}
// Attach static methods
UserMock.findOne = mockUserMethods.findOne;
UserMock.findOneAndUpdate = mockUserMethods.findOneAndUpdate;
UserMock.find = mock(() => ({
    select: () => ({
        populate: () => ({
            limit: () => Promise.resolve([])
        })
    })
}));

// Mock the module export
mock.module("../models/User", () => {
    return UserMock;
});

// Mock Team model
mock.module("../models/Team", () => ({}));

// Mock Firebase Admin
mock.module("firebase-admin", () => {
    return {
        apps: [],
        initializeApp: mock(() => {}),
        credential: { cert: mock(() => {}) },
        auth: () => ({
            verifyIdToken: mock((token) => {
                if (token === "valid_token_secure_uid") {
                    return Promise.resolve({ uid: "secure_uid", email: "user@example.com" });
                }
                if (token === "valid_token_attacker_uid") {
                    return Promise.resolve({ uid: "attacker_uid", email: "attacker@example.com" });
                }
                return Promise.reject(new Error("Invalid token"));
            })
        })
    };
});

// Mock other dependencies
mock.module("../utils/encryption", () => ({}));
mock.module("../utils/regexUtils", () => ({}));
mock.module("../services/mailer", () => ({
  sendZyncEmail: mock(() => Promise.resolve({}))
}));

const userRoutes = require("../routes/userRoutes");

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("User Update Security", () => {

  it("should reject request without authorization header (401)", async () => {
    const res = await request(app)
      .put("/api/users/secure_uid")
      .send({ displayName: "Hacked Name" });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Unauthorized");
  });

  it("should reject request with valid token but different UID (403)", async () => {
    // Attacker tries to update secure_uid's profile
    const res = await request(app)
      .put("/api/users/secure_uid")
      .set("Authorization", "Bearer valid_token_attacker_uid")
      .send({ displayName: "Hacked Name" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Unauthorized");
  });

  it("should allow request with valid token and matching UID (200)", async () => {
    // User updates their own profile
    const res = await request(app)
      .put("/api/users/secure_uid")
      .set("Authorization", "Bearer valid_token_secure_uid")
      .send({ displayName: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe("Updated Name");
  });

});
