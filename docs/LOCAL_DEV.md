# Running Zync Fully Locally

This guide explains how to run Zync entirely on your local machine using local Docker containers (MongoDB, Redis), the Firebase Emulator Suite (Auth, Firestore, Storage), and our demo workspace seed script. No external API keys or cloud credentials are required.

---

## 1. Architecture & Port Mapping

| Service | Target Address / Port | Notes |
| :--- | :--- | :--- |
| **MongoDB** | `mongodb://127.0.0.1:27018/zync_local` | Docker container (`mongo:7`), unencrypted (no TLS) |
| **Redis** | `redis://127.0.0.1:6380` | Docker container (`redis:7-alpine`), cache and session store |
| **Firebase Auth Emulator** | `127.0.0.1:9099` | Local user authentication (`demo-zync`) |
| **Firebase Firestore Emulator** | `127.0.0.1:8088` | Local real-time documents and team snapshots |
| **Firebase Storage Emulator** | `127.0.0.1:9199` | Local asset and media bucket |
| **Zync Backend API** | `http://localhost:5010` | Express REST API, WebSockets, Mongoose |
| **Zync Frontend (Vite)** | `http://localhost:5311` | React 18 SPA with Tailwind and TanStack Query |

---

## 2. Prerequisites

Ensure you have the following installed on your system:
- **Docker** and Docker CLI
- **Node.js** (v18+ or v20+) and **npm**
- **Firebase CLI** (`npm install -g firebase-tools` or `npx firebase-tools`)

---

## 3. Step-by-Step Setup

### Step 3.1: Start Local MongoDB & Redis (Docker)

Run the MongoDB and Redis containers on the specified custom local ports:

```bash
# 1. Start MongoDB (v7) on port 27018
docker run -d \
  --name zync-mongo \
  -p 27018:27017 \
  mongo:7

# 2. Start Redis (v7 Alpine) on port 6380
docker run -d \
  --name zync-redis \
  -p 6380:6379 \
  redis:7-alpine
```

*(To stop them later, run `docker stop zync-mongo zync-redis` and `docker rm zync-mongo zync-redis`).*

---

### Step 3.2: Start the Firebase Emulator Suite

Start the Firebase emulators for Auth, Firestore, and Storage under the `demo-zync` project:

```bash
firebase emulators:start --only auth,firestore,storage --project demo-zync
```

This starts:
- Authentication emulator on `127.0.0.1:9099`
- Cloud Firestore emulator on `127.0.0.1:8088`
- Cloud Storage emulator on `127.0.0.1:9199`

---

### Step 3.3: Configure & Start the Backend

Navigate to the `backend/` directory:

```bash
cd backend
```

Create or update your `backend/.env` file with these values:

```env
PORT=5010
NODE_ENV=development
FRONTEND_URL=http://localhost:5311
ALLOWED_ORIGINS=http://localhost:5311,http://127.0.0.1:5311,http://localhost:5173

# Local Database & Redis
MONGO_URI=mongodb://127.0.0.1:27018/zync_local
REDIS_URL=redis://127.0.0.1:6380
REDIS_TLS=false

# Firebase Emulators & Dummy GCP Service Account
GCLOUD_PROJECT=demo-zync
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8088
GCP_SERVICE_ACCOUNT_KEY='{"project_id":"demo-zync","client_email":"demo@demo-zync.iam.gserviceaccount.com"}'

# Third-party integrations disabled for clean local boot
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
KILO_CODE_GATEWAY_URL=
KILO_CODE_GATEWAY_API_KEY=
```

Start the backend server:

```bash
npm run dev
# Or: node index.js
```

Verify that the console logs clean startup messages:
- `✅ MongoDB Connected: 127.0.0.1:27018`
- `[github] GITHUB_APP_ID not set — GitHub App features disabled`
- `[mailer] GOOGLE_REFRESH_TOKEN not set — Email sending disabled`
- `[sheets] GOOGLE_SHEETS_CLIENT_EMAIL not set — Google Sheets logging disabled`
- `[cloudinary] CLOUDINARY_CLOUD_NAME not set — Cloudinary media upload disabled`
- `[kilo] KILO_CODE_GATEWAY_URL not set — Kilo Code Gateway disabled (using local fallback architecture)`
- `🚀 Server successfully started on port 5010`

---

### Step 3.4: Seed the Demo Workspace

In a new terminal window, run the idempotent demo seed script:

```bash
cd backend
npm run seed:demo
```

The script:
1. Verifies local safety constraints (refuses to run unless `MONGO_URI` is local, emulators are active, and project is `demo-*`).
2. Clears any previous demo records to ensure full idempotency.
3. Provisions 4 demo users in the Auth emulator and MongoDB (`alex@zync.dev`, `priya@zync.dev`, `rahul@zync.dev`, `sneha@zync.dev`).
4. Creates team **"Zync Core"** and syncs its snapshot to Firestore.
5. Populates 3 projects: **"Zync Dashboard"**, **"API Gateway"**, and **"Mobile App"**.
6. Generates 30 tasks across all statuses (`Ready`, `In Progress`, `Review`, `Done`) with assigned users and commit links.
7. Seeds 6 rich BlockNote documents (including pinned *"Architecture Plan"* and *"Sprint 14 Planning"*).
8. Seeds 25 realistic chat messages across 2 communication channels.
9. Creates 5 team calendar meetings.
10. Records 30 activity log events and 15 user sessions for analytics and velocity charts.

---

### Step 3.5: Configure & Start the Frontend

Navigate to the project root:

```bash
cd ..
```

Create or update your `.env` (or `.env.local`) with:

```env
VITE_USE_FIREBASE_EMULATORS=1
VITE_API_URL=http://localhost:5010
VITE_FIREBASE_PROJECT_ID=demo-zync
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-zync.firebaseapp.com
```

Start Vite on port 5311:

```bash
npm run dev -- --port 5311
```

Open your browser and navigate to:
**[http://localhost:5311](http://localhost:5311)**

---

## 4. Demo Login & Verification

Sign in on the login page using the seeded demo credentials:

- **Email:** `alex@zync.dev`
- **Password:** `ZyncDemo#2026`

Once authenticated, explore the fully populated workspace:
- **Dashboard / Home:** View sprint metrics, active tasks count, and team activity timeline.
- **My Workspace & Project Details:** Inspect the 3 projects, browse the Kanban board with cards in *Ready*, *In Progress*, *Review*, and *Done*, and check step hierarchies.
- **Notes:** Open the pinned *"Architecture Plan"*, *"Sprint 14 Planning"*, or *"API Rate-Limit Design"* notes rendered via BlockNote.
- **Chat:** View the conversational threads with Priya Sharma and Rahul Patel.
- **Calendar & Meetings:** View scheduled meetings (Daily Standup, Architecture Review, Sprint 14 Demo, etc.).
- **Activity Log:** Inspect velocity charts, session tracking, and recent team audit entries.
- **People:** View all 4 team members with online status badges.
