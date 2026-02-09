import { describe, it, expect, mock, beforeAll, afterAll } from "bun:test";
const express = require('express');
const request = require('supertest');

// Set dummy API key for Groq initialization
process.env.GROQ_API_KEY = "dummy_key";

// Mock firebase-admin
const mockVerifyIdToken = mock(() => Promise.resolve({ uid: 'test-user-id', email: 'test@example.com' }));
const mockAuth = mock(() => ({
  verifyIdToken: mockVerifyIdToken
}));

mock.module('firebase-admin', () => ({
  apps: [],
  initializeApp: mock(),
  credential: { cert: mock() },
  auth: mockAuth,
  default: {
      apps: [],
      initializeApp: mock(),
      credential: { cert: mock() },
      auth: mockAuth
  }
}));

// Mock groq-sdk
const mockGroqCreate = mock(() => Promise.resolve({
  choices: [{ message: { content: JSON.stringify({ architecture: {}, steps: [] }) } }]
}));
const MockGroq = class {
  constructor() {
    this.chat = { completions: { create: mockGroqCreate } };
  }
};

const groqPath = require.resolve('groq-sdk');
mock.module(groqPath, () => {
  return {
    Groq: MockGroq,
    default: { Groq: MockGroq }
  };
});
mock.module('groq-sdk', () => {
    return {
      Groq: MockGroq,
      default: { Groq: MockGroq }
    };
});

// Mock Mongoose
const mockProjectSave = mock(() => Promise.resolve({ _id: 'new-project-id' }));
const MockProject = class {
  constructor(data) {
    Object.assign(this, data);
  }
  save() { return mockProjectSave(); }
};

const mockMongooseModel = mock((name, schema) => {
  if (name === 'Project') return MockProject;
  return class {}; // Fallback for User or others
});

const MockObjectId = class { toString() { return 'mock-object-id'; } };
const MockSchema = class {
    static Types = { ObjectId: MockObjectId };
};

mock.module('mongoose', () => ({
  Types: { ObjectId: MockObjectId },
  Schema: MockSchema,
  model: mockMongooseModel,
  connect: mock(() => Promise.resolve({ connection: { host: 'mock', name: 'mock' } })),
  default: {
    Types: { ObjectId: MockObjectId },
    Schema: MockSchema,
    model: mockMongooseModel,
    connect: mock(() => Promise.resolve({ connection: { host: 'mock', name: 'mock' } }))
  }
}));

// Now require the route
const generateProjectRoutes = require('../routes/generateProjectRoutes');

const app = express();
app.use(express.json());
app.use('/', generateProjectRoutes);

describe('Generate Project Routes', () => {
  it('should return 401 if not authenticated (no header)', async () => {
    const res = await request(app)
      .post('/')
      .send({ name: 'Test Project', description: 'Test Description' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('No token provided');
  });

  it('should return 201 if authenticated', async () => {
    mockVerifyIdToken.mockClear();
    mockGroqCreate.mockClear();

    const res = await request(app)
      .post('/')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Test Project', description: 'Test Description' });

    expect(res.status).toBe(201);
    expect(mockVerifyIdToken).toHaveBeenCalled();
    expect(mockGroqCreate).toHaveBeenCalled();
    expect(mockProjectSave).toHaveBeenCalled();
  });
});
