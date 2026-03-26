// import { describe, it, expect, mock } from "bun:test";
import request from "supertest";
import express from "express";


const mockPrisma = {
  user: {
    findUnique: jest.fn((args) => {
      if (args.where.uid === 'secure_uid') {
        return Promise.resolve({ id: 'user-id', uid: 'secure_uid', email: 'test@example.com' });
      }
      return Promise.resolve(null);
    }),
    create: jest.fn(() => Promise.resolve({ id: 'new-user', uid: 'secure_uid' })),
    update: jest.fn(() => Promise.resolve({ id: 'user-id' }))
  },
  $disconnect: jest.fn(() => Promise.resolve())
};

jest.mock("../lib/prisma", () => mockPrisma);


const mockFirebase = {
  apps: [],
  initializeApp: jest.fn(() => { }),
  credential: { cert: jest.fn(() => { }) },
  auth: () => ({
    verifyIdToken: jest.fn((token) => {
      if (token === "valid_token") {
        return Promise.resolve({ uid: "secure_uid", email: "test@example.com" });
      }
      return Promise.reject(new Error("Invalid token"));
    })
  })
};

jest.mock("firebase-admin", () => mockFirebase);


jest.mock("../utils/encryption", () => ({}));
jest.mock("../utils/regexUtils", () => ({}));
jest.mock("../services/mailer", () => ({
  sendZyncEmail: jest.fn(() => Promise.resolve({}))
}));

import userRoutes from "../routes/userRoutes";

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("User Sync Security", () => {
  it("should reject request without authorization header", async () => {
    const res = await request(app)
      .post("/api/users/sync")
      .send({ uid: "some_uid", email: "test@example.com" });

    expect(res.status).toBe(401);
  });

  it("should accept request with authorization header", async () => {
    const res = await request(app)
      .post("/api/users/sync")
      .set("Authorization", "Bearer valid_token")
      .send({ uid: "secure_uid", email: "test@example.com" });

    expect(res.status).toBe(200);

    expect(mockPrisma.user.findUnique).toHaveBeenCalled();
  });
});
