# ZYNC Architecture Overhaul: Complete Prompt Collection

**Context:** We are a team of 3 developers building Zync, a real-time collaborative workspace. We need to migrate from the current MongoDB + Firebase hybrid to an optimized free-tier architecture supporting 1000+ concurrent users.

---

## PROMPT 1: Generate Complete Implementation Plan

```
I need you to create a comprehensive, week-by-week implementation plan for migrating Zync to an optimized free-tier architecture.

CURRENT STACK (from codebase analysis):
- Frontend: React 18 + Vite + TypeScript (Vercel)
- Backend: Node.js/Express (currently on Render/Railway)
- Database: MongoDB (Mongoose) + Prisma (dual ORM issue)
- Real-time: Socket.io + Firebase Firestore (chat)
- Auth: Firebase Auth
- Storage: Firebase Storage
- AI: Google Gemini, Groq SDK

CURRENT ISSUES IDENTIFIED:
1. Dual ORM (Mongoose + Prisma on same MongoDB)
2. Firestore chat (50K reads/20K writes daily limit insufficient)
3. Client-side user sync (useUserSync hook - fragile)
4. Backend hosts spin down after 15 min (Render/Railway free tier)
5. No connection pooling
6. Manual token encryption (crypto-js instead of secure methods)

TARGET ARCHITECTURE:
- Backend: Oracle Cloud Free Tier (2x 1GB ARM VMs, always-on)
- Database: Supabase PostgreSQL (500MB, 50K MAU, connection pooling)
- Real-time: Supabase Realtime (200 concurrent connections)
- Auth: Firebase Auth (unlimited)
- Storage: Firebase Storage (5GB)
- Cache: Self-hosted Redis on Oracle VM #2
- Email: Gmail API (500 emails/day, already implemented)
- ORM: Consolidate to Prisma only

CONSTRAINTS:
- Team: 3 developers
- Timeline: 6 weeks
- Budget: $0/month (strict free tier)
- Must support: 1000 concurrent users
- Zero downtime migration required

FEATURES TO PRESERVE:
1. Real-time collaborative notes (Yjs + WebSocket)
2. Real-time chat with file attachments
3. Activity logs (auto-cleanup after 30 days)
4. Profile picture updates (sync across DBs)
5. GitHub project integration (webhooks, repo sync)
6. Google Meet integration
7. AI project generation (Gemini)
8. Task-commit linking (GitHub App)

DELIVERABLES REQUIRED:
1. Week-by-week breakdown (6 weeks x 3 developers = 18 work-weeks)
2. Exact migration steps with zero downtime strategy
3. Updated Prisma schema for Supabase PostgreSQL
4. Oracle Cloud VM setup commands (both VMs)
5. Supabase Realtime integration code (replacing Firestore)
6. Redis caching strategy with specific key patterns
7. Connection pooling configuration
8. Data migration scripts (MongoDB → Supabase)
9. Rollback procedures for each phase
10. Testing checklist (unit, integration, load testing)
11. Monitoring setup (BetterStack free tier)
12. Cost projection table (100/500/1000 users on free tiers)

FORMAT:
Use markdown with:
- Clear phase headers
- Code blocks for all commands/configs
- Tables for comparisons
- Checklists for each week
- Risk callouts (⚠️ warnings)
- Success metrics for each milestone

CRITICAL: 
- Be specific (no "configure the server" - give exact commands)
- Include error handling
- Address the dual-ORM issue first
- Provide actual file paths from our codebase
- Reference existing files (e.g., backend/models/User.js, backend/routes/projectRoutes.js)
```

---

## PROMPT 2: Update architecture/ARCHITECTURE.md

```
Update the architecture/ARCHITECTURE.md file based on our NEW target architecture and current codebase structure.

CURRENT architecture/ARCHITECTURE.md SECTIONS TO PRESERVE:       
1. High-Level Architecture diagram
2. Frontend Architecture (React hooks pattern)
3. Real-Time Collaboration Logic
4. Backend Architecture sections
5. Data Distribution Map

UPDATES NEEDED:

**Section 1: High-Level Architecture**
- Replace MongoDB mention with Supabase PostgreSQL
- Update real-time layer (Supabase Realtime instead of Firestore for chat)
- Add Oracle Cloud hosting details
- Add Redis caching layer
- Keep Firebase for Auth + Storage only

**Section 2: Data Distribution Map**
Create a NEW table:
| Feature/Module | Old Storage | New Storage | Migration Strategy |
|----------------|-------------|-------------|-------------------|
| User Profiles | MongoDB (Mongoose) | Supabase (Prisma) | Batch migration script |
| Projects & Tasks | MongoDB (Mongoose + Prisma) | Supabase (Prisma only) | Consolidate dual ORM |
| Real-time Chat | Firebase Firestore | Supabase Realtime | Export → Import with message history |
| Collaborative Notes | MongoDB + Socket.io | Supabase + Yjs WebSocket | Keep Yjs, change persistence |
| Activity Logs | MongoDB | Supabase (TTL policy) | Fresh start (30-day retention) |
| File Storage | Firebase Storage | Firebase Storage | No change |
| GitHub Integration | MongoDB + Prisma | Supabase (Prisma) | Update webhook handlers |

**Section 3: Authentication Flow**
Update the sequence diagram:
- Keep Firebase Auth
- Change user sync from client-side hook to server-side middleware
- Add Redis caching step (5-minute TTL)
- Update MongoDB references to Supabase

**Section 4: GitHub Sync Engine**
Update file references:
- OLD: routes/githubAppWebhook.js, lib/prisma.js
- NEW: Keep same files but update Prisma client initialization
- Add connection pooling details

**Section 5: Real-Time Architecture**
Complete rewrite needed:
1. Remove Firestore chat logic
2. Add Supabase Realtime subscriptions
3. Keep Yjs for collaborative notes
4. Add WebSocket server details (Oracle VM hosting)

**Section 6: NEW - Caching Strategy**
Add entire new section:
- Redis key patterns (user:*, project:*, session:*)
- TTL policies (user: 5min, project: 10min)
- Invalidation triggers
- Connection pooling to Redis

**Section 7: Folder & Data Structure**
Update:
- Remove Mongoose references
- Show only Prisma schema
- Add Supabase-specific types (e.g., UUID vs ObjectId)

REFERENCE THESE ACTUAL FILES:
- backend/models/User.js (Mongoose model to migrate)
- backend/models/Project.js (has dual schema issue)
- backend/prisma/schema.prisma (current Prisma schema)
- backend/routes/projectRoutes.js (uses Mongoose)
- backend/routes/githubAppWebhook.js (uses both ORMs)
- backend/sockets/noteSocketHandler.js (Yjs implementation)
- src/hooks/useUserSync.ts (client-side sync to remove)

OUTPUT FORMAT:
- Keep existing markdown structure
- Add mermaid diagrams where helpful
- Include code snippets showing OLD vs NEW
- Add migration warnings (⚠️) for breaking changes
```

---

## PROMPT 3: Update ERD.md

```
Completely rewrite ERD.md to reflect the new Supabase PostgreSQL schema.

CURRENT ERD ISSUES:
1. Shows MongoDB (Mongoose) + Prisma hybrid
2. References Firestore for chat
3. Missing Redis layer
4. ObjectId types need to change to UUID

NEW ERD REQUIREMENTS:

**Section 1: High-Level Data Model**
Create a mermaid ERD showing:
- All entities in Supabase PostgreSQL
- Foreign key relationships
- Firebase Auth as external identity provider
- Redis as caching layer

**Section 2: Supabase PostgreSQL Schema**
Provide complete Prisma schema with:

```prisma
// Full schema for Supabase
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations (bypasses pooler)
}

model User {
  // Complete schema from backend/models/User.js converted to Prisma
  // Include: connections, chatRequests, closeFriends, integrations
}

model Project {
  // From backend/models/Project.js
  // Include: steps (relation), githubRepoIds
}

model Step {
  // New table (was embedded in Project)
}

model Task {
  // From current Prisma schema but updated
}

model Note {
  // From backend/models/Note.js
  // Add: yjsState (BYTEA for binary Yjs state)
}

model ChatRoom {
  // NEW - replaces Firestore
}

model ChatMessage {
  // NEW - replaces Firestore
  // Include denormalized sender data
}

model ActivityLog {
  // From backend/models/Session.js concept
  // Add TTL index
}

model Meeting {
  // From backend/models/Meeting.js
}

model Team {
  // From backend/models/Team.js
}
```

**Section 3: Migration Mapping**
Create table showing OLD → NEW:
| Old (MongoDB) | Collection | New (Supabase) | Table | Notes |
|---------------|------------|----------------|-------|-------|
| User | users | User | users | Change _id to UUID |
| Project | projects | Project | projects | Flatten embedded steps array |
| Note | notes | Note | notes | Add yjsState BYTEA field |
| Firestore | messages | ChatMessage | chat_messages | Complete schema change |

**Section 4: Indexes & Performance**
List all indexes needed:
- User: firebaseUid (unique), email (unique)
- Project: ownerId, createdAt
- Task: stepId, assigneeId, status
- ChatMessage: chatRoomId + createdAt (composite for pagination)
- ActivityLog: userId + createdAt, createdAt (for cleanup)

**Section 5: Row Level Security (RLS) Policies**
Supabase-specific section showing:
- Users can only read their own data
- Chat rooms: members only
- Projects: owner + team members
- Activity logs: owner only

**Section 6: Connection Pooling**
Explain:
- Supabase Pooler (pgbouncer)
- Transaction vs Session mode
- Prisma configuration for pooling

REFERENCE FILES TO CONVERT:
- backend/models/User.js → User table
- backend/models/Project.js → Project + Step + Task tables
- backend/models/Note.js → Note table
- backend/models/Meeting.js → Meeting table
- backend/models/Team.js → Team table
- backend/prisma/schema.prisma → Update this to Supabase

OUTPUT:
- Complete Prisma schema ready to copy-paste
- Mermaid ERD diagram
- Index creation SQL
- RLS policy examples
```

---

## PROMPT 4: Update API.md

```
Update API.md to reflect new architecture changes and add missing endpoints.

CURRENT API.md GAPS:
1. Missing endpoints (teams, support, google integration)
2. Outdated MongoDB references
3. No mention of Supabase Realtime subscriptions
4. Missing rate limiting info
5. No Redis caching headers

UPDATES NEEDED:

**Add Header Section:**
```markdown
# ZYNC API Documentation

**Base URL**: `https://api.zync.app`
**Version**: 2.0 (Supabase Migration)

## Global Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes (most endpoints) | `Bearer <Firebase-ID-Token>` |
| Content-Type | POST/PUT | `application/json` |
| X-Request-ID | No | Request tracking (auto-generated if omitted) |

## Rate Limits
| Tier | Requests/min | Burst |
|------|-------------|-------|
| Authenticated | 100 | 200 |
| Unauthenticated | 20 | 40 |

## Caching
Responses include cache headers:
- `X-Cache-Hit`: true/false
- `X-Cache-TTL`: seconds remaining
```

**Update Each Section:**

1. **Authentication & Users** (`/api/users`)
   - Update sync endpoint to show server-side processing
   - Add Redis caching note
   - Show Supabase User ID in responses (not MongoDB ObjectId)

2. **Projects** (`/api/projects`)
   - Update response format (Supabase UUIDs)
   - Add query params: `?cache=skip` to bypass Redis
   - Show Prisma-only examples (remove Mongoose)

3. **Real-Time Chat** (NEW major section)
   ```markdown
   ### Supabase Realtime Subscriptions
   
   **WebSocket Connection:**
   ```javascript
   const supabase = createClient(url, key);
   const channel = supabase.channel('chat:ROOM_ID');
   ```
   
   **Subscribe to Messages:**
   ```javascript
   channel.on('postgres_changes', {
     event: 'INSERT',
     schema: 'public',
     table: 'ChatMessage',
     filter: `chatRoomId=eq.${roomId}`
   }, (payload) => {
     // Handle new message
   }).subscribe();
   ```
   ```

4. **GitHub Integration**
   - Update webhook verification code
   - Show Prisma Task model (not MongoDB)
   - Add cache invalidation on webhook

5. **Notes** (`/api/notes`)
   - Add Yjs binary state handling
   - Show BYTEA storage in Supabase
   - Document WebSocket namespace separately

6. **NEW Endpoints to Add:**
   - `/api/teams/*` (from teamRoutes.js)
   - `/api/google/*` (from googleRoutes.js)
   - `/api/support/*` (from supportRoutes.js)

EXAMPLE UPDATED ENDPOINT:
```markdown
### Get User Profile
**GET** `/api/users/:uid`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbG..."
}
```

**Response:** (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // UUID (Supabase)
  "firebaseUid": "firebase-uid-string",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://storage.googleapis.com/...",
  "integrations": {
    "github": {
      "connected": true,
      "username": "johndoe"
    }
  },
  "_cache": {
    "hit": true,
    "ttl": 240  // seconds
  }
}
```

**Cache Behavior:**
- First request: Queries Supabase, caches for 5 minutes
- Subsequent requests: Served from Redis
- Invalidation: On PUT /api/users/:uid
```

REFERENCE FILES:
- backend/routes/userRoutes.js
- backend/routes/projectRoutes.js
- backend/routes/teamRoutes.js
- backend/routes/googleRoutes.js
- backend/routes/supportRoutes.js
- backend/routes/githubAppWebhook.js

OUTPUT FORMAT:
- Keep table-based layout
- Add code examples for Supabase Realtime
- Include caching behavior notes
- Add rate limit warnings
```

---

## PROMPT 5: Create MIGRATION_GUIDE.md (NEW)

```
Create a comprehensive migration guide for moving from MongoDB to Supabase.

STRUCTURE:

# MIGRATION_GUIDE.md

## Pre-Migration Checklist
- [ ] Backup MongoDB database
- [ ] Set up Supabase project
- [ ] Configure Oracle Cloud VMs
- [ ] Test migration script on sample data
- [ ] Notify users of maintenance window

## Phase 1: Database Setup (Week 1)

### 1.1 Create Supabase Project
```bash
# Steps to create Supabase project
# Get connection strings
# Configure environment variables
```

### 1.2 Run Prisma Migrations
```bash
# Generate Prisma client
# Push schema to Supabase
# Verify tables created
```

### 1.3 Set Up Row Level Security
```sql
-- RLS policies for each table
-- Test policies with sample data
```

## Phase 2: Data Migration (Week 2)

### 2.1 User Migration Script
```javascript
// Complete script from backend/models/User.js → Supabase
// Handle integrations encryption
// Preserve firebaseUid mapping
```

### 2.2 Project Migration
```javascript
// Flatten Project.steps array
// Create Step records
// Update foreign keys
```

### 2.3 Chat History Migration
```javascript
// Export Firestore messages
// Transform to Supabase schema
// Batch insert with progress tracking
```

### 2.4 Verification Queries
```sql
-- Count records per table
-- Verify foreign key integrity
-- Check for NULL firebaseUid values
```

## Phase 3: Application Updates (Week 3-4)

### 3.1 Update Backend
- Remove Mongoose entirely
- Update all routes to Prisma
- Add connection pooling
- Implement Redis caching

### 3.2 Update Frontend
- Remove useUserSync hook
- Add Supabase Realtime client
- Update API base URL
- Handle UUID vs ObjectId

## Phase 4: Cutover Plan (Week 5)

### Zero-Downtime Cutover
```markdown
**T-24 hours:**
- [ ] Deploy new backend to Oracle Cloud (shadowing old)
- [ ] Set up dual writes (MongoDB + Supabase)
- [ ] Monitor lag between databases

**T-4 hours:**
- [ ] Stop accepting new user signups
- [ ] Drain active sessions
- [ ] Run final sync script

**T-1 hour:**
- [ ] Enable maintenance mode
- [ ] Final data verification
- [ ] Update DNS/load balancer

**T-0:**
- [ ] Switch traffic to new backend
- [ ] Disable MongoDB writes
- [ ] Monitor error logs

**T+1 hour:**
- [ ] Verify all features working
- [ ] Check Supabase connection count
- [ ] Monitor Redis hit rate
- [ ] Disable maintenance mode
```

## Rollback Procedures

### Immediate Rollback (< 1 hour)
```bash
# Commands to switch back to MongoDB
# Restore from backup
# Revert DNS changes
```

### Data Corruption Recovery
```sql
-- Restore specific tables from backup
-- Replay transaction log
```

## Post-Migration Verification

### Functional Tests
- [ ] User login/signup
- [ ] Real-time chat
- [ ] Collaborative notes
- [ ] GitHub webhook
- [ ] File uploads
- [ ] Activity logs

### Performance Tests
- [ ] Load test (1000 concurrent users)
- [ ] Redis cache hit rate > 80%
- [ ] Supabase connection pool < 50
- [ ] API response time < 200ms

### Data Integrity Tests
```sql
-- User count matches
-- Project count matches
-- Foreign key constraints valid
-- No orphaned records
```

## Monitoring Setup
```markdown
**BetterStack Monitors:**
1. Supabase DB health
2. Redis uptime
3. API response time
4. Error rate
5. WebSocket connections

**Alerts:**
- Connection pool > 80%
- Cache hit rate < 70%
- Error rate > 1%
- Response time > 500ms
```

REFERENCE:
- All backend/models/*.js files (source schema)
- backend/prisma/schema.prisma (target schema)
- Current MongoDB structure from ERD.md
```

---

## PROMPT 6: Update DEPENDENCY_REPORT.md

```
Update DEPENDENCY_REPORT.md with new dependencies and remove obsolete ones.

CHANGES TO DOCUMENT:

**NEW Dependencies to Add:**
```json
{
  "@supabase/supabase-js": "^2.x",
  "ioredis": "^5.x",
  "pg": "^8.x"  // Already present but document usage
}
```

**Dependencies to REMOVE:**
```json
{
  "mongoose": "Remove completely",
  "firebase-admin": "Keep but update usage note"
}
```

**Dependencies to UPDATE:**
```
prisma: Document switch to PostgreSQL provider
@prisma/client: Update to match Prisma 7.x
```

**NEW Sections to Add:**

### 1. Supabase Dependencies
| Package | Version | Purpose | Free Tier Impact |
|---------|---------|---------|-----------------|
| @supabase/supabase-js | ^2.x | Realtime subscriptions | 200 concurrent connections |
| @supabase/auth-helpers | ^0.x | Auth integration | N/A |

### 2. Redis Dependencies
| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| ioredis | ^5.x | Redis client | Self-hosted on Oracle VM |
| connect-redis | ^7.x | Express session store | Optional |

### 3. Removed Dependencies
| Package | Reason | Replaced By |
|---------|--------|-------------|
| mongoose | Migrating to Prisma only | @prisma/client |
| firebase (client SDK) | Only using Admin SDK | firebase-admin |

### 4. Updated Prisma Configuration
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // Changed from mongodb
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 5. Breaking Changes
**Mongoose → Prisma:**
- ObjectId (12 bytes) → UUID (16 bytes, string format)
- Embedded documents → Foreign key relations
- .populate() → Prisma .include()
- .lean() → No equivalent (Prisma returns plain objects)

**Firebase Firestore → Supabase:**
- onSnapshot() → supabase.channel().on()
- collection('messages') → FROM chat_messages table
- Timestamp → PostgreSQL timestamptz

OUTPUT:
- Keep existing structure
- Add version compatibility matrix
- Include migration path for each change
```

---

## PROMPT 7: Create ORACLE_CLOUD_SETUP.md (NEW)

```
Create a complete Oracle Cloud Free Tier setup guide.

# ORACLE_CLOUD_SETUP.md

## Overview
Oracle Cloud Free Tier provides 2x ARM Ampere A1 instances with 1GB RAM each, always-on.

## Architecture
```
VM 1 (Backend):
- Node.js/Express backend
- Yjs WebSocket server
- PM2 process manager
- Cloudflare Tunnel for public access

VM 2 (Redis):
- Redis 7.x
- Connection from VM 1 only
- Persistence enabled
```

## Step 1: Create Oracle Cloud Account
[Detailed steps with screenshots descriptions]

## Step 2: Provision Compute Instances

### VM 1 Configuration
```yaml
Name: zync-backend
Shape: VM.Standard.A1.Flex
OCPU: 1
Memory: 1 GB
OS: Ubuntu 22.04 LTS (ARM64)
Boot Volume: 50 GB
VCN: Create new VCN
Public IP: Assign
```

### VM 2 Configuration
```yaml
Name: zync-redis
Shape: VM.Standard.A1.Flex
OCPU: 1
Memory: 1 GB
OS: Ubuntu 22.04 LTS (ARM64)
Boot Volume: 50 GB
VCN: Same as VM 1
Public IP: No (internal only)
```

## Step 3: Configure Networking

### Security Lists
```bash
# Ingress Rules for VM 1
- Port 22 (SSH) from your IP
- Port 443 (HTTPS) from 0.0.0.0/0 (Cloudflare)
- Port 6379 (Redis) from VM 2 private IP only

# Ingress Rules for VM 2
- Port 22 (SSH) from your IP
- Port 6379 (Redis) from VM 1 private IP only
```

## Step 4: Initial Server Setup

### VM 1 (Backend)
```bash
# SSH into VM 1
ssh ubuntu@<VM1_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v20.x
npm --version

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Cloudflare Tunnel
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### VM 2 (Redis)
```bash
# SSH into VM 2
ssh ubuntu@<VM2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Changes to make:
# 1. bind 0.0.0.0 (allow connections from VM 1)
# 2. requirepass YOUR_STRONG_PASSWORD_HERE
# 3. maxmemory 768mb
# 4. maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return PONG

# Configure firewall
sudo ufw allow from <VM1_PRIVATE_IP> to any port 6379
sudo ufw allow 22/tcp
sudo ufw enable
```

## Step 5: Deploy Backend

```bash
# On VM 1
cd /home/ubuntu
git clone https://github.com/your-org/zync-backend.git
cd zync-backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add all environment variables (see ENVIRONMENT_VARIABLES.md)

# Test run
npm start

# If successful, set up PM2
pm2 start npm --name "zync-api" -- start
pm2 startup
pm2 save

# Check logs
pm2 logs zync-api

# Monitor
pm2 monit
```

## Step 6: Set Up Cloudflare Tunnel

```bash
# On VM 1
cloudflared tunnel login
# Follow the browser auth flow

# Create tunnel
cloudflared tunnel create zync-backend

# Note the tunnel ID, then create config
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/ubuntu/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.zync.app
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# Set up DNS
cloudflared tunnel route dns zync-backend api.zync.app

# Start tunnel
pm2 start cloudflared -- tunnel run zync-backend
pm2 save

# Verify
curl https://api.zync.app/health
```

## Step 7: Monitoring & Maintenance

### Health Checks
```bash
# Create health check script
nano /home/ubuntu/health-check.sh
```

```bash
#!/bin/bash
# Check if backend is running
if ! pm2 status | grep -q "zync-api.*online"; then
  echo "Backend is down! Restarting..."
  pm2 restart zync-api
fi

# Check Redis connectivity
if ! redis-cli -h <VM2_PRIVATE_IP> -a $REDIS_PASSWORD ping > /dev/null; then
  echo "Redis is unreachable!"
  # Send alert
fi
```

```bash
chmod +x /home/ubuntu/health-check.sh

# Add to crontab (every 5 minutes)
crontab -e
# Add: */5 * * * * /home/ubuntu/health-check.sh >> /home/ubuntu/health-check.log 2>&1
```

### Log Rotation
```bash
# PM2 handles log rotation, but configure size limits
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

## Step 8: Backup Strategy

```bash
# Automatic backup script
nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"

# Backup Redis data
ssh ubuntu@<VM2_PRIVATE_IP> "redis-cli -a $REDIS_PASSWORD SAVE"
scp ubuntu@<VM2_PRIVATE_IP>:/var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup .env
cp /home/ubuntu/zync-backend/.env $BACKUP_DIR/env_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
```

## Troubleshooting

### Issue: Backend won't start
```bash
# Check logs
pm2 logs zync-api --lines 100

# Common causes:
# 1. Wrong Node version
# 2. Missing .env variables
# 3. Port 3000 already in use

# Fix port conflict
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Issue: Can't connect to Redis from VM 1
```bash
# On VM 2, check Redis is listening
sudo netstat -tlnp | grep 6379

# Test from VM 1
redis-cli -h <VM2_PRIVATE_IP> -a <PASSWORD> ping

# Check firewall rules
sudo ufw status
```

## Cost Verification

Free Tier Limits:
- 2x ARM Ampere A1 instances: ✅ Always Free
- 200GB Block Storage: ✅ Always Free (using 100GB)
- 10TB/month Bandwidth: ✅ Always Free

Monthly Cost: $0.00
```

---

## PROMPT 8: Create TESTING_STRATEGY.md (NEW)

```
Create a comprehensive testing strategy document.

# TESTING_STRATEGY.md

## Overview
Testing approach for 1000+ concurrent users on free tier architecture.

## Testing Pyramid

```
        /\
       /E2E\        ← 10 tests (critical paths)
      /------\
     /Integration\  ← 50 tests (API + DB)
    /------------\
   /  Unit Tests  \ ← 200 tests (business logic)
  /________________\
```

## Phase 1: Unit Tests (Week 1-2)

### Backend Services
**File:** `backend/services/emailService.test.js`
```javascript
describe('EmailService', () => {
  test('sendTaskAssignment sends email via Gmail API', async () => {
    // Test Gmail API integration
  });
  
  test('respects 500/day quota limit', async () => {
    // Test rate limiting
  });
});
```

**File:** `backend/utils/encryption.test.js`
```javascript
describe('Token Encryption', () => {
  test('encrypts GitHub token securely', () => {
    // Test AES-256 encryption
  });
  
  test('decrypts GitHub token correctly', () => {
    // Test decryption
  });
});
```

### Coverage Goals
- Business logic: 90%
- Utilities: 95%
- Routes: 70% (integration tests cover rest)

## Phase 2: Integration Tests (Week 3-4)

### Supabase Integration
**File:** `backend/tests/integration/supabase.test.js`
```javascript
describe('Supabase Operations', () => {
  test('creates user with firebaseUid', async () => {
    const user = await prisma.user.create({
      data: {
        firebaseUid: 'test-uid',
        email: 'test@example.com'
      }
    });
    expect(user.id).toBeDefined();
  });
  
  test('handles connection pooling correctly', async () => {
    // Simulate 100 concurrent queries
    const queries = Array(100).fill().map(() => 
      prisma.user.findMany({ take: 1 })
    );
    await Promise.all(queries);
    // Should not exceed pool limit
  });
});
```

### Redis Caching
**File:** `backend/tests/integration/redis.test.js`
```javascript
describe('Redis Caching', () => {
  test('caches user data for 5 minutes', async () => {
    // Test cache set
    // Test cache get
    // Test TTL
  });
  
  test('invalidates cache on user update', async () => {
    // Test cache invalidation
  });
});
```

### Real-Time Features
**File:** `backend/tests/integration/realtime.test.js`
```javascript
describe('Supabase Realtime', () => {
  test('broadcasts new chat message to subscribers', async () => {
    // Create message
    // Verify subscribers receive it
  });
  
  test('handles 200 concurrent WebSocket connections', async () => {
    // Stress test WebSocket connections
  });
});
```

## Phase 3: Load Testing (Week 5)

### K6 Load Test Scripts

**File:** `tests/load/auth-flow.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  // Test user login
  const loginRes = http.post('https://api.zync.app/api/users/sync', 
    JSON.stringify({
      uid: `user-${__VU}`,
      email: `user${__VU}@test.com`
    }),
    { headers: { 'Content-Type': 'application/json' }}
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**File:** `tests/load/chat.js`
```javascript
// Test real-time chat under load
export default function () {
  // Establish WebSocket
  // Send messages
  // Verify delivery
}
```

**File:** `tests/load/collaborative-notes.js`
```javascript
// Test Yjs collaboration
export default function () {
  // Connect to note
  // Simulate typing
  // Verify sync
}
```

### Expected Results
| Metric | Target | Acceptable | Fail |
|--------|--------|------------|------|
| Concurrent Users | 1000 | 800 | <500 |
| Avg Response Time | <200ms | <500ms | >1s |
| Error Rate | <0.1% | <1% | >5% |
| Supabase Connections | <50 | <60 | >60 |
| Redis Hit Rate | >80% | >70% | <50% |

## Phase 4: E2E Tests (Week 6)

### Playwright Tests

**File:** `tests/e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test('user signup and login flow', async ({ page }) => {
  await page.goto('https://zync.app/signup');
  
  // Fill signup form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Verify user data loaded
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
});
```

**File:** `tests/e2e/realtime-chat.spec.ts`
```typescript
test('two users chat in real-time', async ({ browser }) => {
  const user1 = await browser.newPage();
  const user2 = await browser.newPage();
  
  // User 1 logs in
  await user1.goto('https://zync.app/chat');
  // User 2 logs in
  await user2.goto('https://zync.app/chat');
  
  // User 1 sends message
  await user1.fill('textarea[name="message"]', 'Hello!');
  await user1.click('button[type="submit"]');
  
  // Verify User 2 sees message (within 500ms)
  await expect(user2.locator('text=Hello!')).toBeVisible({ timeout: 500 });
});
```

### Critical User Journeys
1. ✅ Signup → Email Verification → Dashboard
2. ✅ Create Project → Add Task → Assign to Team Member
3. ✅ Real-time Chat → Send File → Download
4. ✅ Collaborative Note → Simultaneous Edit → No Conflicts
5. ✅ GitHub Webhook → Task Auto-Complete → UI Update

## Continuous Monitoring

### BetterStack Setup
```yaml
monitors:
  - name: API Health
    url: https://api.zync.app/health
    interval: 60s
    
  - name: Supabase Connection
    url: https://api.zync.app/health/db
    interval: 60s
    
  - name: Redis Cache
    url: https://api.zync.app/health/redis
    interval: 60s
```

### Alert Thresholds
```yaml
alerts:
  - condition: response_time > 1000ms
    action: Email + Slack
    
  - condition: error_rate > 1%
    action: SMS + Email
    
  - condition: supabase_connections > 50
    action: Warning email
```

## Regression Testing
Run full test suite on:
- Every PR (unit + integration)
- Before deployment (all tests)
- Weekly (load tests)

## Performance Benchmarks
Baseline metrics (update after migration):
```
Auth Flow: 180ms avg
Project Load: 320ms avg
Chat Message: 95ms avg
Collaborative Edit: 45ms avg
```
```

---

## Master Execution Order

**Week 1:**
1. Run PROMPT 1 → Get implementation plan
2. Run PROMPT 7 → Set up Oracle Cloud
3. Run PROMPT 3 → Update ERD with Supabase schema

**Week 2:**
4. Run PROMPT 5 → Create migration guide
5. Run PROMPT 2 → Update architecture/ARCHITECTURE.md

**Week 3-4:**
6. Execute migration (follow PROMPT 5 output)

**Week 5:**
7. Run PROMPT 8 → Test everything
8. Run PROMPT 4 → Update API.md
9. Run PROMPT 6 → Update dependencies

**Week 6:**
10. Final review of all documentation
11. Beta launch

---

## Success Criteria

✅ All 8 prompts executed
✅ Documentation updated and consistent
✅ Migration plan tested
✅ Load tests passing (1000 users)
✅ All free tiers confirmed
✅ Zero-downtime cutover successful