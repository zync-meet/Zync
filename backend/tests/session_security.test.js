
import { describe, it, expect, mock, beforeAll } from "bun:test";
import express from 'express';
import request from 'supertest';

// Mock the Session model to avoid DB connection
mock.module('../models/Session', () => {
  const mockSession = function(data) {
    this.save = () => Promise.resolve({ ...data, _id: 'mock-id' });
  };
  mockSession.find = () => ({ sort: () => Promise.resolve([]) });
  mockSession.findById = () => Promise.resolve({});
  mockSession.findByIdAndDelete = () => Promise.resolve({});
  mockSession.deleteMany = () => Promise.resolve({});

  return {
    default: mockSession,
    // Start of CommonJS compatibility
    __esModule: true,
    // End of CommonJS compatibility
  };
});

// We need to use require for the routes because they are CJS
const sessionRoutes = require('../routes/sessionRoutes');

const app = express();
app.use(express.json());
app.use('/api/sessions', sessionRoutes);

describe('Session Routes Security', () => {
    it('GET /:userId should require authentication', async () => {
        const res = await request(app).get('/api/sessions/user123');
        expect(res.status).toBe(401);
    });

    it('POST /start should require authentication', async () => {
        const res = await request(app)
            .post('/api/sessions/start')
            .send({ userId: 'user123' });
        expect(res.status).toBe(401);
    });

    it('POST /batch should require authentication', async () => {
        const res = await request(app)
            .post('/api/sessions/batch')
            .send({ userIds: ['user123'] });
        expect(res.status).toBe(401);
    });

    it('DELETE /user/:userId should require authentication', async () => {
        const res = await request(app).delete('/api/sessions/user/user123');
        expect(res.status).toBe(401);
    });
});
