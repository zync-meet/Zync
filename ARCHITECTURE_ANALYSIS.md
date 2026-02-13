# Zync Architecture Optimization Analysis

## 1. Executive Summary & Recommendation

**Recommendation: Consolidated Hybrid (Firebase Auth + MongoDB Core)**

We strongly recommend shifting away from the definition of "Hybrid" where data is split between Firestore and MongoDB. Instead, use **Firebase strictly for Authentication and Storage**, and consolidate **all business logic, chat, and real-time state into MongoDB + Node.js (Socket.io)**.

### Why?
1.  **The "Free Tier" Chat Trap**: Firestore's 50k reads/20k writes per day is insufficient for 1000 users.
    -   *Math*: 1000 users. If 10% are active and send 20 messages each -> 2,000 writes. But if they read history? 1000 users * 50 message history load = 50,000 reads. You hit the limit on day one of a beta launch.
    -   *Solution*: MongoDB (Atlas M0) handles millions of ops as long as storage stays under 512MB. Text is cheap. 100MB can store ~200,000 messages.
2.  **Dual-Write Complexity**: Your current `useUserSync` hook and split data models (User in Mongo, Message in Firestore) create synchronization nightmares.
3.  **Technical Debt**: We identified **two** ORMs in your backend: `Prisma` (for Tasks) and `Mongoose` (for Users/Notes). This splits your database connections and increases cold start times.

---

## 2. Architecture Decision: The "Thin-Auth" Pattern

### Proposed Architecture
-   **Identity**: Firebase Auth (Client SDK handles login/tokens).
-   **Database**: MongoDB (Atlas M0). Use **one** ORM (Prisma *or* Mongoose, recommend Prisma for type safety + performance, or Mongoose if you prefer flexibility. Current codebase uses both - **Pick one!**).
-   **Real-time**: Socket.io (hosted on Railway/Render) for Chat and Notifications.
-   **Collaboration**: `y-websocket` (or Hocuspocus) server for collaborative notes.
-   **Storage**: Firebase Storage (Images/Files).

### Pros vs Cons
| Feature | Old (Firebase+Mongo) | New (Mongo+Sockets) |
| :--- | :--- | :--- |
| **Free Tier Scale** | Low (Firestore limits) | **High** (Limited only by storage size) |
| **Latency** | Low (Firestore is fast) | **Low** (Socket.io is instant) |
| **Complexity** | High (Sync, Security Rules) | **Medium** (Standard CRUD + Sockets) |
| **Data Integrity** | Low (Dual-write drift) | **High** (Single source of truth) |

---

## 3. Data Distribution Blueprint

| Feature | Storage | Sync / Transport | Rationale |
| :--- | :--- | :--- | :--- |
| **User Profiles** | MongoDB | Auth Token Exchange | User is the root entity; keep with business data. |
| **Real-time Chat** | MongoDB | Socket.io | Avoids Firestore read costs. Easy to archive old chats to save space. |
| **Collab Notes** | MongoDB (Binaries) | Yjs + WebSocket | Store Yjs update blobs. Text is too complex for simple CRUD updates. |
| **Activity Logs** | MongoDB (Capped) | Async Write | Use "Capped Collections" (fixed size, auto-delete old) to stay free. |
| **File Attachments**| Firebase Storage | URL ref in Mongo | Offload large blobs. Keep metadata (size, type) in Mongo. |
| **GitHub Data** | MongoDB | Webhooks | Store reference + cache. Don't poll; use webhooks to update. |

---

## 4. Sync Strategy Redesign

### The "Auth-Token Exchange" Pattern (Solves Dual-Write Drift)
Instead of the client writing to MongoDB, the client **authenticates** with the backend, and the **backend** syncs the user.

1.  **Client**: User logs in via Firebase SDK. Gets `idToken`.
2.  **Client**: Sends `POST /api/auth/login` with `Authorization: Bearer <idToken>`.
3.  **Server**:
    -   Verifies token with `firebase-admin`.
    -   Extracts name/email/picture.
    -   `findOneAndUpdate` in MongoDB (Upsert).
    -   Returns session info or simply 200 OK.
4.  **Result**: Profile is ALWAYS in sync before any business logic executes.

### Failure Handling
-   If Backend denies token: Client forces logout.
-   If MongoDB is down: API returns 500, Client shows "Service Unavailable" (better than drift).

---

## 5. Free Tier Optimization Tactics

### MongoDB (Atlas M0 - 512MB Limit)
1.  **Short keys**: Use `_id` or short strings for IDs. Don't use UUID strings if possible (ObjectId is 12 bytes, UUID string is 36 bytes).
2.  **Capped Collections for Logs**:
    -   Activity logs grow forever. Create a collection with a `size` limit (e.g., 50MB). MongoDB auto-deletes oldest entries.
    -   `db.createCollection("activity_logs", { capped: true, size: 52428800 })`
3.  **Chat Archival**:
    -   Don't store chat history forever in the "hot" collection.
    -   Cron job (run locally or via GitHub Actions) to delete messages > 30 days if storage gets tight.
4.  **No base64**: NEVER store images in MongoDB. Only URLs.

### Compute (Render/Railway)
1.  **WebSocket optimization**:
    -   Socket.io creates open connections. On free tier, you might hit connection limits.
    -   Use `socket.io-msgpack-parser` for binary compression.
    -   Disconnect inactive sockets (client-side "idle" detection).

---

## 6. Implementation Diagrams & Code

### A. Optimized User Sync (Backend)

```javascript
// backend/middleware/auth.js
const admin = require('firebase-admin');
const User = require('../models/User'); // Or Prisma

const verifyAndSyncUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    // 1. Verify with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 2. Sync to MongoDB (Upsert) - Critical Step
    // This ensures MongoDB is always fresh on every authenticated request
    // Optimization: Use a cache (Redis/Memory) to avoid writing on EVERY request.
    // Only write if 'auth_time' in token > last_sync_time
    
    const user = await User.findOneAndUpdate(
      { uid: decodedToken.uid },
      {
        email: decodedToken.email,
        displayName: decodedToken.name || 'User',
        photoURL: decodedToken.picture,
        lastSeen: new Date() 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Error", error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### B. Real-time Collaborative Notes setup (Yjs + Socket.io)

For the "Free Tier", running a separate `Hocuspocus` server might be overkill. You can piggyback on your existing Express/Socket.io server.

```javascript
// backend/sockets/notes.js
const Y = require('yjs');
const { MongodbPersistence } = require('y-mongodb-provider');
// WARNING: y-mongodb-provider might be heavy for M0. 
// Simpler: Save snapshot to MongoDB every 10 seconds.

const setupNoteSockets = (io) => {
  const notesNamespace = io.of('/notes');
  const docs = new Map(); // In-memory cache of active docs

  notesNamespace.on('connection', (socket) => {
    socket.on('join-note', async (noteId) => {
      socket.join(noteId);
      
      // Load from DB if not in memory
      if (!docs.has(noteId)) {
        const note = await NoteModel.findById(noteId);
        const ydoc = new Y.Doc();
        if (note && note.content) {
            Y.applyUpdate(ydoc, note.content); // storing binary update blob
        }
        docs.set(noteId, ydoc);
        
        // Debounced save logic
        ydoc.on('update', (update) => {
            // Save 'update' to DB or merge to snapshot
             saveToDb(noteId, Y.encodeStateAsUpdate(ydoc));
        });
      }
      
      const ydoc = docs.get(noteId);
      // Send current state
      socket.emit('sync', Y.encodeStateAsUpdate(ydoc));
      
      socket.on('update', (update) => {
        Y.applyUpdate(ydoc, update);
        socket.to(noteId).emit('update', update);
      });
    });
  });
};
```

### C. Migration Plan (3 Months to Beta)

**Phase 1: Housekeeping (Week 1-2)**
1.  **Pick an ORM**: Migrate all Prisma models to Mongoose OR Mongoose schemas to Prisma. Given your complex `User.js` model in Mongoose, it might be easier to stick with Mongoose for now, OR generate Prisma schema from it. **Recommendation: Prisma** is better for TypeScript projects, but requires rewrite. **Path of least resistance: Standardize on Mongoose** since your logical complexity is there.
2.  **Consolidate Backend**: Ensure all routes use the new `verifyAndSyncUser` middleware.

**Phase 2: Data Migration (Week 3-4)**
1.  **Chat Migration**: Create `Message` model in MongoDB.
2.  Write a script to read all Firestore messages and insert into MongoDB.
3.  Update Frontend `ChatView` to use `socket.io` instead of `onSnapshot`.

**Phase 3: Real-time & Optimization (Week 5-8)**
1.  Implement `Yjs` for notes.
2.  Set up "Capped Collections" for logs.
3.  Stress test with 100 simulated users locally.

**Phase 4: Polish (Week 9-12)**
1.  UI Refinement (Offline mode with Tanstack Query + persist).
2.  Deploy.

---

## 7. Risks & Mitigation

| Risk | Mitigation |
| :--- | :--- |
| **MongoDB M0 Storage Full** | Aggressive data retention policy (delete old logs/chats). Store images in Firebase Storage. |
| **Socket.io Connection Limits** | Use `socket.io` strictly for active windows. Disconnect on blur/background. |
| **Data Loss (in-memory Yjs)** | Implement robust flush-to-DB logic on server shutdown (`process.on('SIGTERM')`). |
