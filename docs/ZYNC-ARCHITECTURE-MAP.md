# Zync Complete Architecture Map

> Study guide: every feature, its pillars, connections, and a recommended learning order.

---

## Master Dependency Graph

```
                        ┌──────────────┐
                        │  Firebase    │
                        │  Auth (08)   │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  User Profile│ │  Middleware  │ │  API Client  │
     │    (09)      │ │   Stack (51) │ │   (55)       │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
            │                │                │
            ▼                ▼                ▼
  ┌─────────────────── BACKEND CORE ──────────────────┐
  │                                                    │
  │  Express + Mongoose (52) + Redis (33) + Socket.IO │
  │                                                    │
  │  Routes:                                           │
  │  ├─ userRoutes    ├─ projectRoutes  ├─ taskRoutes  │
  │  ├─ noteRoutes    ├─ chatRoutes     ├─ teamRoutes  │
  │  ├─ github        ├─ googleRoutes   ├─ meetRoutes  │
  │  ├─ sessionRoutes ├─ uploadRoutes   ├─ supportRoutes│
  │  ├─ designRoutes  ├─ inspirationRoutes├─ linkRoutes │
  │  ├─ collaboratorRoutes├─ generateProjectRoutes     │
  │  └─ architectureAgentRoutes  webhookRoutes         │
  │                                                    │
  │  Services:                                         │
  │  ├─ firebaseAdmin  ├─ cloudinaryService            │
  │  ├─ googleMeet     ├─ kiloCodeGateway              │
  │  ├─ usageService   ├─ mailer                       │
  │  ├─ geoService     ├─ haveIBeenPwnedService        │
  │  ├─ scraperService ├─ githubWebhookWorker          │
  │  └─ webhookQueue   ├─ teamFirebaseSync             │
  │                                                    │
  │  Sockets:                                          │
  │  ├─ /presence  ├─ /chat  ├─ /notes  ├─ /tasks      │
  │                                                    │
  └────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  Frontend    │ │  Frontend    │ │  Frontend    │
     │  Routing(53) │ │  State (54)  │ │  Pages/Views │
     └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Feature Connection Map (ASCII)

```
AUTH (08) ──► USER (09) ──► PROFILE SETTINGS
  │              │
  │              ├─► LOCATION (34) ──► ipapi.co
  │              ├─► CLOUDINARY (32) ──► avatar upload
  │              ├─► HIBP (12) ──► password breach check
  │              └─► ACCOUNT DELETE (10) ──► email verification
  │
  ├─► LINKEDIN (13) ──► OAuth → Firebase custom token
  ├─► GOOGLE (40) ──► Calendar API + Gmail SMTP
  │
  ├─► GITHUB (21) ──► WEBHOOKS (22) ──► WORKER ──► TASK UPDATES
  │       │                                    │
  │       ├─► REPO LINKING (44)                │
  │       └─► ARCHITECTURE ANALYSIS (25)       │
  │              │                             │
  │              ├─► KILO GATEWAY (26)         │
  │              ├─► QUOTA (27) ──► Redis      │
  │              └─► AGENT CHAT (35)           │
  │                    │                       │
  │                    └─► PROJECT GEN (36)    │
  │                         │                  │
  │                         ▼                  │
  │                    PROJECT (14) ◄──────────┘
  │                         │
  │                    STEPS (15)
  │                         │
  │                    TASKS (16) ◄── WEBHOOK WORKER
  │                         │
  │                    TASK ROUTES (47)
  │
  ├─► TEAMS (31) ──► ACTIVITY LOG ──► USER SEARCH (39)
  │
  ├─► CHAT (23) ──► CHAT SOCKET (24) ──► /chat namespace
  │      │
  │      └─► FILE UPLOAD (38) ──► Multer + Sharp + Cloudinary
  │
  ├─► NOTES (17) ──► FOLDERS (18) ──► SHARING
  │      │
  │      └─► REALTIME (19) ──► NOTES SOCKET (20) ──► Yjs CRDT
  │
  ├─► PRESENCE (11) ──► /presence namespace
  │
  ├─► SESSIONS (29) ──► MEETINGS (30) ──► GOOGLE MEET (45)
  │                                    ──► CALENDAR (37)
  │
  ├─► SUPPORT (42) ──► EMAIL (28)
  ├─► BETA APP (41) ──► Collaborator model
  └─► DESIGN INSPIRATION (43) ──► Cheerio + Puppeteer

INFRASTRUCTURE:
  ENCRYPTION (48) ──► AES-256 for GitHub/Google tokens
  CACHE (33) ──► Redis fail-open
  PAGINATION (49) ──► all list endpoints
  ERROR HANDLING (57) ──► all routes
  SOCKET.IO INIT (50) ──► all 4 namespaces
  DEPLOYMENT (59) ──► Render + Atlas + Redis Cloud
  SECURITY (60) ──► Helmet + rate limit + HMAC
  PERFORMANCE (61) ──► indexes + lazy load + cache
  TESTING (62) ──► Jest + Supertest + Vitest
```

---

## Per-Feature: What / Why / Pillars / Connections

### 1. Firebase Auth (08)
- **What:** Verifies Firebase JWTs on every API call
- **Why:** Single source of truth for identity
- **Pillars:** `firebase-admin`, `verifyToken` middleware, `AuthContext`
- **Connects to:** Every protected route, API client (55), middleware (51)
- **Files:** `backend/services/firebaseAdmin.js`, `backend/middleware/authMiddleware.js`, `src/lib/firebase.ts`, `src/hooks/useMe.ts`

### 2. User Profile (09)
- **What:** CRUD for user display name, bio, avatar, location
- **Why:** Identity and personalization
- **Pillars:** `User` model, `userRoutes.js`, `useMe` hook
- **Connects to:** Cloudinary (32) for avatar, Location (34), HIBP (12)
- **Files:** `backend/routes/userRoutes.js`, `backend/models/User.js`, `src/hooks/useMe.ts`

### 3. Account Deletion (10)
- **What:** Email-verified cascading deletion
- **Why:** GDPR compliance, user control
- **Pillars:** `sendZyncEmail`, 6-digit code, cascade delete
- **Connects to:** Email (28), User (09)
- **Files:** `backend/routes/userRoutes.js` (delete endpoint), `backend/services/mailer.js`

### 4. LinkedIn OAuth (13)
- **What:** Server-side LinkedIn login → Firebase custom token
- **Why:** Alternative login method
- **Pillars:** `axios` OAuth exchange, `firebase-admin` custom token
- **Connects to:** Firebase Auth (08)
- **Files:** `backend/routes/linkedinRoutes.js`

### 5. Google OAuth (40)
- **What:** Google sign-in + Calendar/Gmail API access
- **Why:** Meeting creation, email sending
- **Pillars:** `googleapis`, encrypted token storage, OAuth2 client
- **Connects to:** Meetings (30), Email (28), Encryption (48)
- **Files:** `backend/routes/googleRoutes.js`, `backend/services/googleMeet.js`

### 6. GitHub OAuth (21)
- **What:** Connect GitHub, list repos, fetch commits/PRs
- **Why:** Code integration, architecture analysis
- **Pillars:** `octokit`, encrypted token, GitHub App auth
- **Connects to:** Webhooks (22), Architecture (25), Repo Linking (44), Tasks (16)
- **Files:** `backend/routes/github.js`, `backend/utils/githubAppAuth.js`, `backend/utils/githubService.js`

### 7. GitHub Webhooks (22)
- **What:** Receive + verify + queue + process GitHub events
- **Why:** Auto-update tasks when code is pushed/merged
- **Pillars:** HMAC verification, `webhookQueue.js`, `githubWebhookWorker.js`
- **Connects to:** Tasks (16), Socket.IO /tasks (47)
- **Files:** `backend/routes/githubAppWebhook.js`, `backend/services/webhookQueue.js`, `backend/services/githubWebhookWorker.js`

### 8. Project CRUD (14)
- **What:** Create/read/update/delete projects
- **Why:** Core organizing unit for work
- **Pillars:** `Project` model, `projectRoutes.js`, Redis cache, `useProjects` hook
- **Connects to:** Steps (15), Tasks (16), Notes (17), GitHub (21), Teams (31)
- **Files:** `backend/routes/projectRoutes.js`, `backend/models/Project.js`, `src/hooks/useProjects.ts`

### 9. Steps Pipeline (15)
- **What:** Kanban columns within a project
- **Why:** Visual workflow organization
- **Pillars:** `Step` model, ordered array on project, drag-and-drop
- **Connects to:** Tasks (16), Project (14)
- **Files:** `backend/models/Step.js`, `backend/routes/projectRoutes.js`

### 10. Task Management (16)
- **What:** Tasks within steps, assignment, due dates, GitHub branches
- **Why:** Track work items
- **Pillars:** `ProjectTask` model, `taskRoutes.js`, Socket.IO /tasks, GitHub branch creation
- **Connects to:** Steps (15), GitHub (21), Webhooks (22), Task Routes (47)
- **Files:** `backend/routes/taskRoutes.js`, `backend/models/ProjectTask.js`, `src/hooks/use-task-updates.ts`

### 11. Chat System (23)
- **What:** 1:1 real-time messaging with file attachments
- **Why:** Team communication
- **Pillars:** `Message` model, `chatRoutes.js`, Socket.IO /chat, cursor pagination
- **Connects to:** Chat Socket (24), File Upload (38), Presence (11)
- **Files:** `backend/routes/chatRoutes.js`, `backend/models/Message.js`, `src/components/views/ChatView.tsx`

### 12. Chat Socket (24)
- **What:** Multi-device delivery, read receipts, typing
- **Why:** Real-time UX
- **Pillars:** `userSockets` Map, delivery catch-up, `chatId` sorting
- **Connects to:** Chat (23), Socket.IO Init (50)
- **Files:** `backend/sockets/chatSocketHandler.js`, `src/lib/SocketIOProvider.ts`

### 13. Presence (11)
- **What:** Online/offline/away status
- **Why:** See who's available
- **Pillars:** Socket.IO /presence, `userSockets` Map, stale cleanup
- **Connects to:** Socket.IO Init (50)
- **Files:** `backend/sockets/presenceSocketHandler.js`, `src/hooks/usePresence.ts`

### 14. Notes (17)
- **What:** Rich-text notes in folders, shareable
- **Why:** Documentation and knowledge base
- **Pillars:** `Note` model, `Folder` model, `noteRoutes.js`, BlockNote editor
- **Connects to:** Folders (18), Realtime (19), Notes Socket (20)
- **Files:** `backend/routes/noteRoutes.js`, `backend/models/Note.js`, `src/hooks/useNotes.ts`

### 15. Realtime Notes (19, 20)
- **What:** Yjs CRDT collaborative editing over Socket.IO
- **Why:** Multiple users edit simultaneously
- **Pillars:** Yjs document, awareness, `noteSocketHandler.js`, `y-indexeddb`
- **Connects to:** Notes (17), Socket.IO Init (50)
- **Files:** `backend/sockets/noteSocketHandler.js`, `src/hooks/useNotePresence.ts`

### 16. AI Architecture Analysis (25)
- **What:** Analyzes linked GitHub repo with AI
- **Why:** Auto-generate architecture docs
- **Pillars:** GitHub file tree fetch, Kilo Gateway call, in-memory cache
- **Connects to:** GitHub (21), Kilo Gateway (26), Quota (27)
- **Files:** `backend/routes/projectRoutes.js` (architecture endpoint), `backend/services/kiloCodeGateway.js`

### 17. Kilo Code Gateway (26)
- **What:** LLM API client with JSON repair
- **Why:** Get structured AI output
- **Pillars:** `axios` POST, prompt engineering, JSON fix function
- **Connects to:** Architecture (25), Agent Chat (35), Project Gen (36)
- **Files:** `backend/services/kiloCodeGateway.js`

### 18. Quota / Usage Service (27)
- **What:** Redis-based rate limiting for AI features
- **Why:** Prevent abuse, fair usage
- **Pillars:** Redis Lua scripts, weekly limit, daily cap, chat throttle
- **Connects to:** Architecture (25), Agent Chat (35), Project Gen (36), Redis (33)
- **Files:** `backend/services/usageService.js`, `backend/utils/redisClient.js`

### 19. Architecture Agent Chat (35)
- **What:** Q&A chat about project architecture
- **Why:** Interactive AI assistance
- **Pillars:** `architectureAgentRoutes.js`, chat throttle, quota info
- **Connects to:** Kilo Gateway (26), Quota (27)
- **Files:** `backend/routes/architectureAgentRoutes.js`

### 20. Project Generation (36)
- **What:** AI generates full project blueprint → auto-creates project+steps+tasks
- **Why:** Jumpstart new projects
- **Pillars:** `generateProjectRoutes.js`, Kilo Gateway, bulk creation
- **Connects to:** Project (14), Steps (15), Tasks (16), Kilo (26), Quota (27)
- **Files:** `backend/routes/generateProjectRoutes.js`, `backend/utils/taskGenerator.js`

### 21. Teams (31)
- **What:** Create teams, invite codes, roles, ownership transfer
- **Why:** Group collaboration
- **Pillars:** `Team` model, `Activity` model, role hierarchy, security PIN
- **Connects to:** User Search (39), Email (28), Projects (14)
- **Files:** `backend/routes/teamRoutes.js`, `backend/models/Team.js`, `src/components/views/CreateTeamDialog.tsx`

### 22. Email Service (28)
- **What:** Gmail SMTP wrapper for all transactional emails
- **Why:** Notifications, verification codes, invites
- **Pillars:** `nodemailer`, `send_ZYNC_email`, fail-open on auth error
- **Connects to:** Account Delete (10), Teams (31), Support (42), Meetings (30)
- **Files:** `backend/services/mailer.js`, `backend/utils/emailTemplates.js`

### 23. Sessions (29)
- **What:** Track work sessions and meeting participation
- **Why:** Time tracking, analytics
- **Pillars:** `Session` model, `sessionRoutes.js`
- **Connects to:** Meetings (30)
- **Files:** `backend/routes/sessionRoutes.js`, `backend/models/Session.js`

### 24. Meetings (30, 45)
- **What:** Schedule Google Meet meetings, invite attendees
- **Why:** Video collaboration
- **Pillars:** `Meeting` model, `googleMeet.js`, Calendar API, email invites
- **Connects to:** Google (40), Email (28), Sessions (29), Calendar (37)
- **Files:** `backend/routes/meetRoutes.js`, `backend/services/googleMeet.js`, `src/components/views/MeetView.tsx`

### 25. Calendar (37)
- **What:** Public holidays, country list
- **Why:** Mark non-working days
- **Pillars:** `date.nager.at` API, in-memory cache
- **Connects to:** Meetings (30)
- **Files:** `backend/routes/calendarRoutes.js`, `src/components/views/CalendarView.tsx`

### 26. Cloudinary (32)
- **What:** Image upload, face-crop avatars, asset deletion
- **Why:** Media storage and optimization
- **Pillars:** `cloudinary` SDK, `multer`, `sharp`
- **Connects to:** User Profile (09), File Upload (38)
- **Files:** `backend/services/cloudinaryService.js`, `backend/routes/uploadRoutes.js`

### 27. Redis Cache (33)
- **What:** JSON get/set with TTL, pattern invalidation, fail-open
- **Why:** Reduce DB load, speed up responses
- **Pillars:** `redis` client, `cache.js` utility
- **Connects to:** Projects (14), GitHub (21), Quota (27)
- **Files:** `backend/utils/cache.js`, `backend/utils/redisClient.js`

### 28. Location Detection (34)
- **What:** IP-based geo-location with timezone
- **Why:** Auto-detect user location
- **Pillars:** `ipapi.co` API, IP extraction from request
- **Connects to:** User Profile (09)
- **Files:** `backend/services/geoService.js`, `backend/routes/userRoutes.js`

### 29. File Upload (38)
- **What:** Multipart upload with Sharp optimization
- **Why:** Chat attachments, profile photos
- **Pillars:** `multer` (memory storage), `sharp` (resize/compress), `cloudinary`
- **Connects to:** Chat (23), Cloudinary (32)
- **Files:** `backend/routes/uploadRoutes.js`

### 30. User Search (39)
- **What:** Regex search by name/email, chat requests
- **Why:** Find people to collaborate with
- **Pillars:** `escapeRegExp`, text index, pagination
- **Connects to:** Teams (31), Chat (23)
- **Files:** `backend/routes/userRoutes.js` (search endpoint)

### 31. Design Inspiration (43)
- **What:** Scrape Dribbble and web for design references
- **Why:** Visual inspiration for designers
- **Pillars:** `cheerio`, `puppeteer`, `axios`
- **Connects to:** None (standalone)
- **Files:** `backend/routes/inspirationRoutes.js`, `backend/services/scraperService.js`, `src/hooks/useInspiration.ts`

### 32. Support (42) / Beta (41)
- **What:** Support ticket email, beta application storage
- **Why:** User intake
- **Pillars:** `supportRoutes.js`, `collaboratorRoutes.js`, email
- **Connects to:** Email (28)
- **Files:** `backend/routes/supportRoutes.js`, `backend/routes/collaboratorRoutes.js`

### 33. Encryption (48)
- **What:** AES-256 encrypt/decrypt for OAuth tokens
- **Why:** Protect credentials at rest
- **Pillars:** `crypto-js`, `ENCRYPTION_KEY`
- **Connects to:** GitHub (21), Google (40)
- **Files:** `backend/utils/encryption.js`

### 34. Pagination (49)
- **What:** Array pagination + HTTP headers + regex escape
- **Why:** Consistent list handling across all endpoints
- **Pillars:** `paginateArray`, `setPaginationHeaders`, `escapeRegExp`
- **Connects to:** All list endpoints
- **Files:** `backend/utils/pagination.js`, `backend/utils/regexUtils.js`

### 35. Socket.IO Init (50)
- **What:** Server setup with 4 namespaces
- **Why:** Real-time infrastructure
- **Pillars:** `socket.io`, Redis adapter (prod), namespace handlers
- **Connects to:** Chat (24), Notes (20), Presence (11), Tasks (47)
- **Files:** `backend/index.js`, `src/lib/SocketIOProvider.ts`

### 36. Middleware (51)
- **What:** CORS, Helmet, rate limit, auth, webhook verify
- **Why:** Security and request processing
- **Pillars:** `express`, `helmet`, `express-rate-limit`, `cors`, `multer`
- **Connects to:** All routes
- **Files:** `backend/middleware/authMiddleware.js`, `backend/middleware/verifyGithub.js`, `backend/index.js`

### 37. Frontend Routing (53)
- **What:** React Router with protected routes + lazy loading
- **Why:** SPA navigation
- **Pillars:** `react-router-dom`, `ProtectedRoute`, `AppLayout`
- **Connects to:** Auth (08), State (54)
- **Files:** `src/App.tsx`, `src/pages/Login.tsx`, `src/components/layout/`

### 38. Frontend State (54)
- **What:** TanStack Query + Zustand + Context
- **Why:** Server cache + UI state
- **Pillars:** `@tanstack/react-query`, `zustand`, `AuthContext`, `SocketContext`
- **Connects to:** All frontend pages
- **Files:** `src/lib/query-client.ts`, `src/lib/SocketIOProvider.ts`, `src/hooks/`

### 39. API Client (55)
- **What:** Axios with JWT injection + error normalization
- **Why:** Consistent API communication
- **Pillars:** `axios`, Firebase `getIdToken`, 401 redirect
- **Connects to:** All frontend API calls
- **Files:** `src/lib/auth-headers.ts`, `src/lib/firebase.ts`

---

## Recommended Study Order

### Phase 1: Foundation (Days 1-3)
1. **08 — Firebase Auth** → understand JWT flow
2. **51 — Middleware** → how requests are processed
3. **55 — API Client** → how frontend talks to backend
4. **52 — Database Schema** → all Mongoose models
5. **53 — Frontend Routing** → page structure

### Phase 2: Core Features (Days 4-7)
6. **09 — User Profile** → CRUD basics
7. **14 — Project CRUD** → main entity
8. **15 — Steps** → project sub-structure
9. **16 — Tasks** → work items
10. **47 — Task Routes** → standalone task API

### Phase 3: Real-Time (Days 8-10)
11. **50 — Socket.IO Init** → namespace setup
12. **11 — Presence** → online/offline
13. **23 — Chat** → messaging REST
14. **24 — Chat Socket** → real-time delivery
15. **17 — Notes** → note CRUD
16. **19 — Realtime Notes** → Yjs collaboration

### Phase 4: Integrations (Days 11-14)
17. **21 — GitHub OAuth** → repo access
18. **22 — Webhooks** → event processing
19. **44 — Repo Linking** → project ↔ repo
20. **40 — Google OAuth** → Calendar/Meet
21. **30 — Meetings** → schedule + invite
22. **28 — Email** → notifications

### Phase 5: AI Layer (Days 15-17)
23. **26 — Kilo Gateway** → LLM client
24. **27 — Quota** → Redis rate limiting
25. **25 — Architecture Analysis** → repo analysis
26. **35 — Agent Chat** → Q&A
27. **36 — Project Generation** → blueprint → auto-create

### Phase 6: Services & Utilities (Days 18-20)
28. **32 — Cloudinary** → media uploads
29. **38 — File Upload** → multer + sharp
30. **33 — Redis Cache** → caching layer
31. **48 — Encryption** → AES-256
32. **49 — Pagination** → helpers
33. **34 — Location** → geo-IP

### Phase 7: Teams & Secondary (Days 21-23)
34. **31 — Teams** → groups + roles
35. **39 — User Search** → discovery
36. **37 — Calendar** → holidays
37. **29 — Sessions** → time tracking
38. **42 — Support** / **41 — Beta** → intake forms
39. **43 — Design Inspiration** → scraping

### Phase 8: Infrastructure (Days 24-26)
40. **57 — Error Handling** → fail-open patterns
41. **60 — Security** → all security layers
42. **61 — Performance** → optimization
43. **59 — Deployment** → Render setup
44. **56 — Env Variables** → complete reference
45. **62 — Testing** → Jest + Vitest
46. **58 — Cross-Reference** → master index

---

## Frontend Page → Backend Route → Model Map

| Frontend Page | Component File | Backend Route | Model(s) | Socket |
|---|---|---|---|---|
| Login | `Login.tsx` | `linkedinRoutes`, `googleRoutes` | User | — |
| Dashboard | `DashboardHome.tsx` | `projectRoutes` | Project, Step, ProjectTask | — |
| Project Details | `ProjectDetails.tsx` | `projectRoutes`, `taskRoutes` | Project, Step, ProjectTask | /tasks |
| Messages | `MessagesPage.tsx`, `ChatView.tsx` | `chatRoutes` | Message | /chat |
| Notes | `src/components/notes/` | `noteRoutes` | Note, Folder | /notes |
| Teams | `TeamGateway.tsx`, `CreateTeamDialog.tsx` | `teamRoutes` | Team, Activity | — |
| Meetings | `MeetView.tsx` | `meetRoutes`, `sessionRoutes` | Meeting, Session | — |
| Calendar | `CalendarView.tsx` | `calendarRoutes` | — | — |
| Settings | `SettingsView.tsx` | `userRoutes`, `googleRoutes`, `github` | User | — |
| People | `PeopleView.tsx` | `userRoutes` (search) | User | — |
| Design | `DesignView.tsx` | `inspirationRoutes`, `designRoutes` | — | — |
| Tasks | `TasksView.tsx`, `TaskBoardView.tsx` | `taskRoutes` | ProjectTask | /tasks |
| New Project | `NewProject.tsx` | `generateProjectRoutes` | Project, Step, ProjectTask | — |
