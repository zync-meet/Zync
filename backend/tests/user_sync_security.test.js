import { describe, it, expect, mock } from "bun:test";
import request from "supertest";
import express from "express";


const mockPrisma = {
  user: {
    findUnique: mock((args) => {
      if (args.where.uid === 'secure_uid') {
        return Promise.resolve({ id: 'user-id', uid: 'secure_uid', email: 'test@example.com' });
      }
      return Promise.resolve(null);
    }),
    create: mock(() => Promise.resolve({ id: 'new-user', uid: 'secure_uid' })),
    update: mock(() => Promise.resolve({ id: 'user-id' }))
  },
  $disconnect: mock(() => Promise.resolve())
};

mock.module("../lib/prisma", () => ({
  default: mockPrisma,
  user: mockPrisma.user,
  $disconnect: mockPrisma.$disconnect
}));


mock.module("firebase-admin", () => {
  return {
    apps: [],
    initializeApp: mock(() => { }),
    credential: { cert: mock(() => { }) },
    auth: () => ({
      verifyIdToken: mock((token) => {
        if (token === "valid_token") {
          return Promise.resolve({ uid: "secure_uid", email: "test@example.com" });
        }
        return Promise.reject(new Error("Invalid token"));
      })
    })
  };
});


mock.module("../utils/encryption", () => ({}));
mock.module("../utils/regexUtils", () => ({}));
mock.module("../services/mailer", () => ({
  sendZyncEmail: mock(() => Promise.resolve({}))
}));

const userRoutes = require("../routes/userRoutes");

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
