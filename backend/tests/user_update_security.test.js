const request = require('supertest');
const express = require('express');

// Mock Data & Models
const mockUser = {
  uid: "secure_uid",
  email: "user@example.com",
  phoneNumber: "1234567890",
  displayName: "Original Name",
  save: () => Promise.resolve({}),
  populate: () => Promise.resolve({})
};

const mockUserMethods = {
  findOne: (query) => {
    // Return a user if found. For simplicity, return a dummy user.
    return Promise.resolve({
      ...mockUser,
      uid: query.uid || "secure_uid"
    });
  },
  findOneAndUpdate: (query, update) => Promise.resolve({
    ...mockUser,
    ...update.$set,
    uid: query.uid
  }),
  find: () => ({
    select: () => ({
        populate: () => ({
            limit: () => Promise.resolve([])
        })
    })
  }),
  findOneAndDelete: () => Promise.resolve({}),
  updateMany: () => Promise.resolve({})
};

// Mock User Class (Mongoose Model Mock)
const MockUser = {
    ...mockUserMethods,
    create: (data) => Promise.resolve({ ...data, save: () => Promise.resolve() }),
};

// Mock Team Class
const MockTeam = {
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([]),
    updateMany: () => Promise.resolve({})
};

// Mock Firebase Admin
const mockAdmin = {
    apps: [],
    initializeApp: () => {},
    credential: { cert: () => {} },
    auth: () => ({
        verifyIdToken: (token) => {
            if (token === "valid_token_secure_uid") {
                return Promise.resolve({ uid: "secure_uid", email: "user@example.com" });
            }
            if (token === "valid_token_attacker_uid") {
                return Promise.resolve({ uid: "attacker_uid", email: "attacker@example.com" });
            }
            return Promise.reject(new Error("Invalid token"));
        }
    })
};

// Jest requires mock factory to use variables that are either inline or prefixed with 'mock'.
// We are using variables prefixed with 'mock' (case-insensitive) or inline.
// 'MockUser' starts with 'Mock'. 'MockTeam' starts with 'Mock'. 'mockAdmin' starts with 'mock'.

jest.mock('../models/User', () => MockUser);
jest.mock('../models/Team', () => MockTeam);
jest.mock('firebase-admin', () => mockAdmin);
jest.mock('../utils/encryption', () => ({ encrypt: (t) => t }));
jest.mock('../utils/regexUtils', () => ({ escapeRegExp: (s) => s }));
jest.mock('../services/mailer', () => ({ sendZyncEmail: () => Promise.resolve({}) }));

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
  });

  it("should reject request with valid token but different UID (403)", async () => {
    // Attacker tries to update secure_uid's profile
    const res = await request(app)
      .put("/api/users/secure_uid")
      .set("Authorization", "Bearer valid_token_attacker_uid")
      .send({ displayName: "Hacked Name" });

    expect(res.status).toBe(403);
  });

  it("should allow request with valid token and matching UID (200)", async () => {
    // User updates their own profile
    const res = await request(app)
      .put("/api/users/secure_uid")
      .set("Authorization", "Bearer valid_token_secure_uid")
      .send({ displayName: "Updated Name" });

    expect(res.status).toBe(200);
    // The mock returns the updated object with the new name
    expect(res.body.displayName).toBe("Updated Name");
  });

});
