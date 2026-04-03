// import { describe, it, expect, mock } from "bun:test";
import request from "supertest";
import express from "express";

const createSelectLeanChain = (result) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result)
});

const createLeanChain = (result) => ({
  lean: jest.fn().mockResolvedValue(result)
});

jest.mock("../models/User", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn()
}));

jest.mock("../models/Team", () => ({
  findById: jest.fn(),
  find: jest.fn()
}));

const mockUserModel = jest.requireMock("../models/User");
const mockTeamModel = jest.requireMock("../models/Team");


jest.mock("firebase-admin", () => {
  const verifyIdToken = jest.fn((token) => {
    if (token === "valid_token") {
      return Promise.resolve({ uid: "secure_uid", email: "test@example.com" });
    }
    return Promise.reject(new Error("Invalid token"));
  });

  return {
    apps: [],
    initializeApp: jest.fn(() => { }),
    credential: { cert: jest.fn(() => { }) },
    auth: () => ({
      verifyIdToken
    })
  };
});


jest.mock("../utils/encryption", () => ({}));
jest.mock("../utils/regexUtils", () => ({}));
jest.mock("../services/mailer", () => ({
  sendZyncEmail: jest.fn(() => Promise.resolve({}))
}));
jest.mock("../services/sheetLogger", () => ({
  appendRow: jest.fn(() => Promise.resolve())
}));
jest.mock("../utils/normalize", () => ({
  normalizeDoc: (doc) => doc,
  normalizeDocs: (docs) => docs
}));
jest.mock("../utils/emailTemplates", () => ({
  getNewUserRegistrationTemplate: jest.fn(() => "<html></html>")
}));
jest.mock("../services/cloudinaryService", () => ({
  deleteCloudinaryAsset: jest.fn(() => Promise.resolve())
}));

import userRoutes from "../routes/userRoutes";

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

const defaultUserData = {
  uid: "secure_uid",
  email: "test@example.com",
  displayName: "Secure User",
  teamMemberships: []
};

const resetModelMocks = (userData = defaultUserData) => {
  mockUserModel.findOne.mockImplementation(() => createSelectLeanChain(userData));
  mockUserModel.findOneAndUpdate.mockResolvedValue({
    ...(userData || {}),
    lastSeen: new Date().toISOString()
  });
  mockUserModel.create.mockImplementation(() => ({
    toObject: () => ({
      ...(userData || {}),
      created: true
    })
  }));
  mockTeamModel.findById.mockImplementation(() => createLeanChain(null));
  mockTeamModel.find.mockImplementation(() => createLeanChain([]));
};

beforeEach(() => {
  jest.clearAllMocks();
  resetModelMocks();
});

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
    expect(mockUserModel.findOne).toHaveBeenCalledWith({ uid: "secure_uid" });
    expect(mockUserModel.findOneAndUpdate).toHaveBeenCalled();
  });
});
