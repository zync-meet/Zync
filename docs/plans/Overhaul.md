# ZYNC ARCHITECTURE OVERHAUL: COMPLETE IMPLEMENTATION PLAN
## Free-Tier Infrastructure for 1000+ Concurrent Users

**Timeline:** 6 Weeks (3 Developers)  
**Goal:** Flawless, fast, scalable architecture using only free tiers  
**Cost Target:** $0/month

---

# EXECUTIVE DECISION MATRIX

## Firebase vs Supabase

| Feature | Firebase | Supabase | Winner |
|---------|----------|----------|--------|
| **Auth (Free Tier)** | Unlimited users | 50,000 MAU | **Firebase** |
| **Real-time DB (Free)** | RTDB: 100 connections, 10GB bandwidth | Realtime: 200 concurrent, 2GB bandwidth | **Supabase** |
| **Storage (Free)** | 5GB, 1GB/day downloads | 1GB storage, 2GB bandwidth | **Firebase** |
| **Pricing Trajectory** | Pay-as-you-go (predictable) | Fixed tiers ($25/mo jump) | **Firebase** |
| **Developer Experience** | Excellent SDKs | PostgreSQL (SQL expertise needed) | **Firebase** |
| **Vendor Lock-in** | High | Low (self-hostable) | **Supabase** |

**DECISION: Use Firebase for Auth + Storage, Supabase for Real-time Chat**

**Why Hybrid?**
- Firebase Auth is unmatched (OAuth integrations, security)
- Supabase Realtime handles 200 concurrent connections (vs Firebase RTDB's 100)
- Supabase PostgreSQL is better for complex queries than Firebase's NoSQL
- Total free tier: Firebase Auth (unlimited) + Supabase (50K MAU) + Storage (5GB Firebase)

---

## MongoDB vs Supabase PostgreSQL

| Criterion | MongoDB Atlas M0 | Supabase PostgreSQL | Winner |
|-----------|-----------------|---------------------|--------|
| **Storage** | 512MB | 500MB | **MongoDB** (slight edge) |
| **Connections** | 100 max | 60 direct (unlimited pooled) | **Supabase** |
| **Query Complexity** | Limited aggregations | Full SQL, joins, indexes | **Supabase** |
| **Real-time** | Change Streams (limited on M0) | Built-in with Realtime | **Supabase** |
| **ORM Support** | Mongoose/Prisma | Prisma (native), Drizzle | **Tie** |
| **Free Tier Stability** | 3 clusters, stable | 2 projects, stable | **Tie** |

**DECISION: Migrate to Supabase PostgreSQL**

**Why?**
- Consolidates tech stack (auth + DB + realtime in one service)
- Better query performance for complex joins (Projects → Steps → Tasks)
- Connection pooling solves the "100 connection limit" problem
- Real-time subscriptions built-in (no need for separate Socket.io server)
- Supabase provides **pgbouncer** for connection pooling (critical for serverless)

**Migration Path:** MongoDB → Supabase is straightforward with Prisma

---

## Backend Hosting: Oracle Cloud Free Tier

| Provider | Free Tier | Verdict |
|----------|-----------|---------|
| Render | 750hrs/mo (spins down) | ❌ Not 24/7 |
| Railway | 500hrs/mo | ❌ Not 24/7 |
| Fly.io | 3 VMs (256MB) | ✅ Good, but limited RAM |
| **Oracle Cloud** | **2 VMs: 1GB RAM each (ARM), 200GB storage** | ✅ **BEST** |

**Oracle Cloud Always Free Tier:**
- 2x ARM-based Ampere A1 compute instances (1GB RAM each = 2GB total)
- 200GB block storage
- 10TB/month outbound bandwidth
- **Truly always-on, no spin-down**

**DECISION: Host backend on Oracle Cloud (Free Tier)**

**Deployment Strategy:**
- VM 1: Node.js backend (Express + Yjs collaboration server)
- VM 2: Redis (Upstash alternative, self-hosted)
- Load balancer: Cloudflare Tunnel (free, replaces paid load balancers)

---

# FINAL TECH STACK

| Layer | Technology | Hosting | Free Tier Limit |
|-------|-----------|---------|-----------------|
| **Frontend** | Next.js 14 (App Router) | Vercel | Unlimited |
| **Backend** | Node.js 20 (Fastify) | Oracle Cloud (2x 1GB ARM VMs) | Always-on |
| **Database** | PostgreSQL 15 | Supabase | 500MB, 50K MAU |
| **Real-time** | Supabase Realtime | Supabase | 200 concurrent connections |
| **Auth** | Firebase Auth | Firebase Spark | Unlimited users |
| **Storage** | Firebase Storage | Firebase Spark | 5GB, 1GB/day downloads |
| **Cache** | Redis 7 | Self-hosted (Oracle VM 2) | 1GB RAM allocation |
| **Collaboration** | Yjs + y-websocket | Oracle VM 1 | No limits |
| **Email** | Gmail API | Google Workspace/Gmail | 500 emails/day (free) |
| **Monitoring** | BetterStack | BetterStack Free | 10 monitors |

**Why Fastify over Express?**
- 30% faster request handling
- Native TypeScript support
- Better error handling
- Lower memory footprint (critical for 1GB VM)

---

# 6-WEEK IMPLEMENTATION ROADMAP

## WEEK 1: FOUNDATION & CRITICAL FIXES

### Day 1-2: Database Migration Prep
**Owner:** Developer 1

**Tasks:**
1. Audit current data models (Mongoose + Prisma)
2. Create unified Prisma schema for Supabase PostgreSQL
3. Set up Supabase project (free tier)

**Deliverables:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations (bypasses pooler)
}

model User {
  id            String   @id @default(uuid())
  firebaseUid   String   @unique // Bridge to Firebase Auth
  email         String   @unique
  displayName   String
  photoURL      String?
  
  // Social Graph
  connections   String[] // Array of user IDs
  closeFriends  String[] // Array of user IDs
  
  // Relations
  ownedProjects Project[] @relation("ProjectOwner")
  assignedTasks Task[]    @relation("TaskAssignee")
  notes         Note[]
  chatRooms     ChatRoomMember[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([firebaseUid])
}

model Project {
  id          String   @id @default(uuid())
  title       String
  description String?
  ownerId     String
  owner       User     @relation("ProjectOwner", fields: [ownerId], references: [id])
  
  steps       Step[]
  
  // GitHub Integration
  githubRepoUrl String?
  githubRepoData Json? // Store architecture analysis
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([ownerId])
}

model Step {
  id          String   @id @default(uuid())
  title       String
  order       Int
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  tasks       Task[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([projectId])
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      String   @default("TODO") // TODO, IN_PROGRESS, DONE
  priority    String   @default("MEDIUM") // LOW, MEDIUM, HIGH
  
  stepId      String
  step        Step     @relation(fields: [stepId], references: [id], onDelete: Cascade)
  
  assigneeId  String?
  assignee    User?    @relation("TaskAssignee", fields: [assigneeId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  dueDate     DateTime?
  
  @@index([stepId])
  @@index([assigneeId])
}

model Note {
  id            String   @id @default(uuid())
  title         String
  ownerId       String
  owner         User     @relation(fields: [ownerId], references: [id])
  
  // Yjs binary state (bytea in PostgreSQL)
  yjsState      Bytes?
  
  // Access control
  isPublic      Boolean  @default(false)
  sharedWith    String[] // Array of user IDs
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([ownerId])
}

model ChatRoom {
  id          String   @id @default(uuid())
  name        String?  // Null for DMs
  isDM        Boolean  @default(true)
  
  members     ChatRoomMember[]
  messages    ChatMessage[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ChatRoomMember {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  chatRoomId  String
  chatRoom    ChatRoom @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  
  // Status
  lastReadAt  DateTime?
  
  @@unique([userId, chatRoomId])
  @@index([chatRoomId])
}

model ChatMessage {
  id          String   @id @default(uuid())
  content     String
  chatRoomId  String
  chatRoom    ChatRoom @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  senderId    String   // User.firebaseUid
  
  // Denormalized for performance (avoid joins on every message load)
  senderName  String
  senderPhoto String?
  
  // File attachments
  fileUrl     String?
  fileName    String?
  fileType    String?
  
  createdAt   DateTime @default(now())
  
  @@index([chatRoomId, createdAt])
}

model ActivityLog {
  id          String   @id @default(uuid())
  userId      String   // Who performed the action
  action      String   // "created_project", "assigned_task", etc.
  entityType  String   // "project", "task", "note"
  entityId    String   // ID of the affected entity
  metadata    Json?    // Additional context
  
  createdAt   DateTime @default(now())
  
  // Auto-delete after 30 days (PostgreSQL PARTITION or manual cleanup)
  @@index([userId, createdAt])
  @@index([createdAt]) // For cleanup queries
}
```

### Day 3-4: Oracle Cloud Setup
**Owner:** Developer 2

**Tasks:**
1. Create Oracle Cloud account (free tier)
2. Provision 2x ARM Ampere A1 instances (1GB RAM each)
3. Install Ubuntu 22.04 LTS
4. Configure firewall rules
5. Set up Cloudflare Tunnel for public access

**Commands:**
```bash
# On Oracle Cloud VM 1 (Backend)
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm redis-server git

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Cloudflare Tunnel
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb

# Authenticate and create tunnel
cloudflared tunnel login
cloudflared tunnel create zync-backend
cloudflared tunnel route dns zync-backend api.zync.app

# On Oracle Cloud VM 2 (Redis)
sudo apt update && sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configure Redis for remote access
sudo nano /etc/redis/redis.conf
# Change: bind 127.0.0.1 to bind 0.0.0.0
# Set password: requirepass YOUR_STRONG_PASSWORD
sudo systemctl restart redis-server
```

**Security Hardening:**
```bash
# Set up UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 4444/tcp  # Yjs WebSocket
sudo ufw enable

# Install fail2ban (prevent brute force)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### Day 5-7: Backend Restructure
**Owner:** Developer 3

**Tasks:**
1. Migrate Express to Fastify
2. Remove Mongoose (keep only Prisma)
3. Implement connection pooling
4. Create middleware for Firebase Auth verification

**Code:**
```javascript
// backend/src/server.js
const fastify = require('fastify')({ 
  logger: true,
  trustProxy: true 
});
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('./firebase-service-account.json'))
});

// Prisma with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Supabase pooler URL
    },
  },
});

// Auth middleware
fastify.decorateRequest('user', null);

fastify.addHook('onRequest', async (request, reply) => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // JIT User Sync (with caching)
    const cacheKey = `user:${decodedToken.uid}`;
    let user = await redis.get(cacheKey);
    
    if (!user) {
      user = await prisma.user.upsert({
        where: { firebaseUid: decodedToken.uid },
        update: {
          email: decodedToken.email,
          displayName: decodedToken.name || 'User',
          photoURL: decodedToken.picture,
        },
        create: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name || 'User',
          photoURL: decodedToken.picture,
        },
      });
      
      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(user));
    } else {
      user = JSON.parse(user);
    }
    
    request.user = user;
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
});

// Routes
fastify.register(require('./routes/projects'), { prefix: '/api/projects' });
fastify.register(require('./routes/tasks'), { prefix: '/api/tasks' });
fastify.register(require('./routes/notes'), { prefix: '/api/notes' });
fastify.register(require('./routes/chat'), { prefix: '/api/chat' });

// WebSocket for Yjs
fastify.register(require('./sockets/collaboration'));

// Start server
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```

---

## WEEK 2: DATA MIGRATION & CHAT SYSTEM

### Day 1-3: MongoDB → Supabase Migration
**Owner:** Developer 1

**Migration Script:**
```javascript
// scripts/migrate-to-supabase.js
const { MongoClient } = require('mongodb');
const { PrismaClient } = require('@prisma/client');

const mongoClient = new MongoClient(process.env.MONGODB_URI);
const prisma = new PrismaClient();

async function migrate() {
  await mongoClient.connect();
  const db = mongoClient.db('zync');
  
  // Migrate Users
  console.log('Migrating users...');
  const users = await db.collection('users').find().toArray();
  for (const user of users) {
    await prisma.user.create({
      data: {
        firebaseUid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL,
        connections: user.connections || [],
        closeFriends: user.closeFriends || [],
      },
    });
  }
  
  // Migrate Projects
  console.log('Migrating projects...');
  const projects = await db.collection('projects').find().toArray();
  for (const project of projects) {
    const owner = await prisma.user.findUnique({
      where: { firebaseUid: project.ownerId }
    });
    
    await prisma.project.create({
      data: {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        ownerId: owner.id,
        githubRepoUrl: project.githubRepoUrl,
        githubRepoData: project.githubRepoData,
      },
    });
  }
  
  // Migrate Steps and Tasks (similar pattern)
  console.log('Migration complete!');
  
  await prisma.$disconnect();
  await mongoClient.close();
}

migrate().catch(console.error);
```

### Day 4-5: Chat System with Supabase Realtime
**Owner:** Developer 2

**Implementation:**
```javascript
// backend/src/routes/chat.js
module.exports = async function (fastify) {
  // Create or get DM chat room
  fastify.post('/dm/create', async (request, reply) => {
    const { recipientId } = request.body;
    const userId = request.user.id;
    
    // Check if DM already exists
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        isDM: true,
        members: {
          every: {
            userId: { in: [userId, recipientId] }
          }
        }
      },
      include: { members: true }
    });
    
    if (existingRoom) {
      return { chatRoomId: existingRoom.id };
    }
    
    // Create new DM room
    const room = await prisma.chatRoom.create({
      data: {
        isDM: true,
        members: {
          create: [
            { userId },
            { userId: recipientId }
          ]
        }
      }
    });
    
    return { chatRoomId: room.id };
  });
  
  // Send message
  fastify.post('/message/send', async (request, reply) => {
    const { chatRoomId, content, fileUrl, fileName, fileType } = request.body;
    const user = request.user;
    
    // Verify user is member of chat room
    const membership = await prisma.chatRoomMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId: user.id,
          chatRoomId
        }
      }
    });
    
    if (!membership) {
      return reply.code(403).send({ error: 'Not a member of this chat' });
    }
    
    // Create message (Supabase Realtime will broadcast this automatically)
    const message = await prisma.chatMessage.create({
      data: {
        content,
        chatRoomId,
        senderId: user.firebaseUid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        fileUrl,
        fileName,
        fileType,
      }
    });
    
    return message;
  });
  
  // Get chat history (paginated)
  fastify.get('/messages/:chatRoomId', async (request, reply) => {
    const { chatRoomId } = request.params;
    const { before, limit = 50 } = request.query;
    
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId,
        ...(before && { createdAt: { lt: new Date(before) } })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return messages.reverse(); // Return in chronological order
  });
};
```

**Frontend (Supabase Realtime Client):**
```typescript
// frontend/src/hooks/useChat.ts
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useChat(chatRoomId: string) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Load initial messages
    fetch(`/api/chat/messages/${chatRoomId}`)
      .then(res => res.json())
      .then(setMessages);
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ChatMessage',
          filter: `chatRoomId=eq.${chatRoomId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId]);
  
  return { messages };
}
```

### Day 6-7: Gmail API Email System
**Owner:** Developer 3

**Dependencies:**
```bash
npm install googleapis nodemailer
```

**Gmail API Setup:**
1. Go to Google Cloud Console
2. Create project: "Zync Email Service"
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs: `http://localhost:3000/oauth2callback`
6. Download `credentials.json`

**Generate Refresh Token (One-Time Setup):**
```javascript
// scripts/generate-gmail-token.js
const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  
  console.log('Authorize this app by visiting this url:', authUrl);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log('Token stored to', TOKEN_PATH);
      console.log('\nAdd these to your .env:');
      console.log(`GMAIL_CLIENT_ID=${client_id}`);
      console.log(`GMAIL_CLIENT_SECRET=${client_secret}`);
      console.log(`GMAIL_REFRESH_TOKEN=${token.refresh_token}`);
    });
  });
}

authorize();
```

**Run to generate token:**
```bash
node scripts/generate-gmail-token.js
# Follow the URL, authorize, paste code
# Copy the env vars to .env
```

**Backend Email Service:**
```javascript
// backend/src/services/emailService.js
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // Doesn't matter for refresh tokens
    );
    
    this.oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }
  
  async getTransporter() {
    try {
      const accessToken = await this.oAuth2Client.getAccessToken();
      
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER, // Your Gmail address
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken.token,
        },
      });
    } catch (error) {
      console.error('Failed to create transporter:', error);
      throw error;
    }
  }
  
  async sendTaskAssignment(to, taskDetails) {
    const transporter = await this.getTransporter();
    
    const mailOptions = {
      from: `Zync <${process.env.GMAIL_USER}>`,
      to,
      subject: `New Task Assigned: ${taskDetails.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E75B6;">New Task Assigned</h2>
          <p>You've been assigned a new task in <strong>${taskDetails.projectName}</strong>:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${taskDetails.title}</h3>
            <p>${taskDetails.description || 'No description provided'}</p>
            <p><strong>Due:</strong> ${taskDetails.dueDate || 'No due date'}</p>
            <p><strong>Priority:</strong> ${taskDetails.priority}</p>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/projects/${taskDetails.projectId}" 
             style="display: inline-block; background: #2E75B6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Task
          </a>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from Zync. Please do not reply to this email.
          </p>
        </div>
      `,
    };
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
  
  async sendMeetingInvite(to, meetingDetails) {
    const transporter = await this.getTransporter();
    
    // Create ICS calendar event
    const icsContent = this.generateICS(meetingDetails);
    
    const mailOptions = {
      from: `Zync <${process.env.GMAIL_USER}>`,
      to,
      subject: `Meeting Invitation: ${meetingDetails.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E75B6;">You're Invited to a Meeting</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${meetingDetails.title}</h3>
            <p><strong>When:</strong> ${new Date(meetingDetails.startTime).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${meetingDetails.duration} minutes</p>
            ${meetingDetails.description ? `<p>${meetingDetails.description}</p>` : ''}
          </div>
          
          <a href="${meetingDetails.meetLink}" 
             style="display: inline-block; background: #2E75B6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Join Meeting
          </a>
        </div>
      `,
      icalEvent: {
        filename: 'meeting.ics',
        method: 'REQUEST',
        content: icsContent,
      },
    };
    
    const result = await transporter.sendMail(mailOptions);
    return result;
  }
  
  async sendFriendRequest(to, fromUser) {
    const transporter = await this.getTransporter();
    
    const mailOptions = {
      from: `Zync <${process.env.GMAIL_USER}>`,
      to,
      subject: `${fromUser.displayName} wants to connect on Zync`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E75B6;">New Connection Request</h2>
          <p><strong>${fromUser.displayName}</strong> wants to connect with you on Zync.</p>
          
          <a href="${process.env.FRONTEND_URL}/connections" 
             style="display: inline-block; background: #2E75B6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Request
          </a>
        </div>
      `,
    };
    
    const result = await transporter.sendMail(mailOptions);
    return result;
  }
  
  async sendVerificationCode(to, code) {
    const transporter = await this.getTransporter();
    
    const mailOptions = {
      from: `Zync <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Your Zync Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E75B6;">Verification Code</h2>
          <p>Your verification code is:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="letter-spacing: 8px; margin: 0; font-size: 36px; color: #2E75B6;">${code}</h1>
          </div>
          
          <p style="color: #666;">This code will expire in 10 minutes.</p>
        </div>
      `,
    };
    
    const result = await transporter.sendMail(mailOptions);
    return result;
  }
  
  generateICS(meeting) {
    const start = new Date(meeting.startTime);
    const end = new Date(start.getTime() + meeting.duration * 60000);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Zync//Meeting Invite//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${meeting.id}@zync.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${meeting.title}
DESCRIPTION:${meeting.description || ''}
LOCATION:${meeting.meetLink}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
  }
}

module.exports = new EmailService();
```

**Usage in Routes:**
```javascript
// backend/src/routes/tasks.js
const emailService = require('../services/emailService');

fastify.post('/assign', async (request, reply) => {
  const { taskId, assigneeId } = request.body;
  
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    include: {
      assignee: true,
      step: {
        include: {
          project: true
        }
      }
    }
  });
  
  // Send email notification
  await emailService.sendTaskAssignment(task.assignee.email, {
    title: task.title,
    description: task.description,
    projectName: task.step.project.title,
    projectId: task.step.project.id,
    dueDate: task.dueDate,
    priority: task.priority,
  });
  
  return task;
});
```

**Rate Limiting for Gmail (500/day limit):**
```javascript
// backend/src/middleware/emailRateLimit.js
const redis = require('../utils/redis');

async function checkEmailQuota() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `email:quota:${today}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    // Set expiry to end of day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttl = Math.floor((tomorrow - new Date()) / 1000);
    await redis.expire(key, ttl);
  }
  
  if (count > 500) {
    throw new Error('Daily email quota exceeded (500/day)');
  }
  
  return count;
}

module.exports = { checkEmailQuota };
```

**Environment Variables:**
```bash
# .env
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REFRESH_TOKEN="your-refresh-token"
GMAIL_USER="your-email@gmail.com"
FRONTEND_URL="https://zync.app"
```

**Gmail API Quota Monitoring:**
```javascript
// backend/src/routes/admin/email-stats.js
module.exports = async function (fastify) {
  fastify.get('/email-stats', async (request, reply) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `email:quota:${today}`;
    
    const sent = await redis.get(key) || 0;
    
    return {
      sent: parseInt(sent),
      limit: 500,
      remaining: 500 - parseInt(sent),
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    };
  });
};
```

**Fallback Strategy (If Quota Exceeded):**
```javascript
// backend/src/services/emailService.js (add this method)
async sendEmail(type, to, data) {
  try {
    await checkEmailQuota();
    
    switch (type) {
      case 'task_assignment':
        return await this.sendTaskAssignment(to, data);
      case 'meeting_invite':
        return await this.sendMeetingInvite(to, data);
      case 'friend_request':
        return await this.sendFriendRequest(to, data);
      case 'verification':
        return await this.sendVerificationCode(to, data);
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  } catch (error) {
    if (error.message.includes('quota exceeded')) {
      // Fallback: Store in database for later sending
      await prisma.emailQueue.create({
        data: {
          type,
          to,
          data: JSON.stringify(data),
          status: 'queued',
        }
      });
      
      console.warn('Email queued due to quota limit');
      return { queued: true };
    }
    throw error;
  }
}
```

**Cron Job to Process Queued Emails:**
```javascript
// backend/src/cron.js (add this)
const cron = require('node-cron');
const emailService = require('./services/emailService');

// Run every hour
cron.schedule('0 * * * *', async () => {
  const queuedEmails = await prisma.emailQueue.findMany({
    where: { status: 'queued' },
    take: 50, // Process 50 at a time
  });
  
  for (const email of queuedEmails) {
    try {
      await emailService.sendEmail(
        email.type,
        email.to,
        JSON.parse(email.data)
      );
      
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { status: 'sent' }
      });
    } catch (error) {
      console.error(`Failed to send queued email ${email.id}:`, error);
      
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { 
          status: 'failed',
          error: error.message
        }
      });
    }
  }
});
```

**Database Schema Addition:**
```prisma
// Add to prisma/schema.prisma
model EmailQueue {
  id        String   @id @default(uuid())
  type      String   // 'task_assignment', 'meeting_invite', etc.
  to        String   // Recipient email
  data      String   // JSON stringified data
  status    String   @default("queued") // 'queued', 'sent', 'failed'
  error     String?  // Error message if failed
  createdAt DateTime @default(now())
  
  @@index([status, createdAt])
}
```

**Testing Gmail Setup:**
```javascript
// scripts/test-gmail.js
const emailService = require('../backend/src/services/emailService');

async function test() {
  try {
    await emailService.sendTaskAssignment('test@example.com', {
      title: 'Test Task',
      description: 'This is a test',
      projectName: 'Test Project',
      projectId: '123',
      dueDate: new Date().toISOString(),
      priority: 'HIGH',
    });
    
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

test();
```

---

## Gmail API Free Tier Limits

| Limit | Free Tier |
|-------|----------|
| **Emails/day** | 500 (per Gmail account) |
| **Quota refresh** | Daily at midnight PT |
| **Attachment size** | 25MB per email |
| **Recipients/email** | 500 |

**Strategies to Stay Under 500/day:**

1. **Batch Notifications**
   - Don't send email for every task comment
   - Send digest: "You have 5 new updates" once/day

2. **User Preferences**
   - Let users choose email frequency
   - Options: Real-time, Daily digest, Weekly digest, Never

3. **Priority-Based Sending**
   - Critical: Task assignments, meeting invites
   - Low priority: Friend requests (queue if quota reached)

4. **Multiple Gmail Accounts**
   - Create 2-3 Gmail accounts
   - Rotate between them
   - Total: 1000-1500 emails/day
### Day 8-9 (Bonus): File Upload to Firebase Storage
**Owner:** Developer 3

**Backend Signed URL Generation:**
```javascript
// backend/src/routes/storage.js
const { getStorage } = require('firebase-admin/storage');

module.exports = async function (fastify) {
  fastify.post('/upload-url', async (request, reply) => {
    const { fileName, fileType } = request.body;
    const user = request.user;
    
    const bucket = getStorage().bucket();
    const filePath = `uploads/${user.id}/${Date.now()}_${fileName}`;
    const file = bucket.file(filePath);
    
    // Generate signed upload URL (valid for 15 minutes)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: fileType,
    });
    
    return { uploadUrl: url, filePath };
  });
  
  fastify.post('/download-url', async (request, reply) => {
    const { filePath } = request.body;
    
    const bucket = getStorage().bucket();
    const file = bucket.file(filePath);
    
    // Generate signed download URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });
    
    return { downloadUrl: url };
  });
};
```

**Frontend Upload:**
```typescript
// frontend/src/utils/uploadFile.ts
export async function uploadFile(file: File) {
  // 1. Get signed upload URL
  const { uploadUrl, filePath } = await fetch('/api/storage/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getFirebaseToken()}`
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type
    })
  }).then(r => r.json());
  
  // 2. Upload directly to Firebase Storage
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
  
  // 3. Get download URL
  const { downloadUrl } = await fetch('/api/storage/download-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getFirebaseToken()}`
    },
    body: JSON.stringify({ filePath })
  }).then(r => r.json());
  
  return downloadUrl;
}
```

---

## WEEK 3: REAL-TIME COLLABORATION

### Day 1-3: Yjs Collaborative Notes
**Owner:** Developer 1

**Backend (y-websocket server):**
```javascript
// backend/src/sockets/collaboration.js
const Y = require('yjs');
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const docs = new Map(); // noteId -> Y.Doc

module.exports = async function (fastify) {
  const wss = new WebSocketServer({ 
    noServer: true,
    path: '/collaboration'
  });
  
  fastify.server.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/collaboration')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
  
  wss.on('connection', (conn, req) => {
    const noteId = new URL(req.url, 'http://localhost').searchParams.get('noteId');
    
    if (!noteId) {
      conn.close();
      return;
    }
    
    // Load or create Y.Doc
    if (!docs.has(noteId)) {
      const ydoc = new Y.Doc();
      docs.set(noteId, ydoc);
      
      // Load from database
      prisma.note.findUnique({ where: { id: noteId } })
        .then(note => {
          if (note?.yjsState) {
            Y.applyUpdate(ydoc, note.yjsState);
          }
        });
      
      // Debounced save (5 seconds after last edit)
      let saveTimer;
      ydoc.on('update', () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          const state = Y.encodeStateAsUpdate(ydoc);
          await prisma.note.update({
            where: { id: noteId },
            data: { yjsState: state }
          });
        }, 5000);
      });
    }
    
    setupWSConnection(conn, req, { doc: docs.get(noteId) });
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Saving all notes...');
    for (const [noteId, ydoc] of docs) {
      const state = Y.encodeStateAsUpdate(ydoc);
      await prisma.note.update({
        where: { id: noteId },
        data: { yjsState: state }
      });
    }
    process.exit(0);
  });
};
```

**Frontend (Yjs + React):**
```typescript
// frontend/src/components/CollaborativeEditor.tsx
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

export function CollaborativeEditor({ noteId, user }) {
  const [provider, setProvider] = useState(null);
  
  useEffect(() => {
    const ydoc = new Y.Doc();
    const wsProvider = new WebsocketProvider(
      'wss://api.zync.app',
      `/collaboration?noteId=${noteId}`,
      ydoc
    );
    
    setProvider(wsProvider);
    
    return () => {
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [noteId]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({
        document: provider?.doc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: user.displayName,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        },
      }),
    ],
  });
  
  if (!editor) return <div>Loading...</div>;
  
  return <EditorContent editor={editor} />;
}
```

### Day 4-5: Activity Logs with Auto-Cleanup
**Owner:** Developer 2

**Implementation:**
```javascript
// backend/src/utils/activityLogger.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function logActivity(userId, action, entityType, entityId, metadata = {}) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      metadata,
    }
  });
}

// Automatic cleanup (run daily via cron)
async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const deleted = await prisma.activityLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo }
    }
  });
  
  console.log(`Deleted ${deleted.count} old activity logs`);
}

module.exports = { logActivity, cleanupOldLogs };
```

**Cron Setup (PM2):**
```javascript
// backend/src/cron.js
const cron = require('node-cron');
const { cleanupOldLogs } = require('./utils/activityLogger');

// Run daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running activity log cleanup...');
  await cleanupOldLogs();
});
```

### Day 6-7: GitHub Webhooks
**Owner:** Developer 3

**Setup GitHub App:**
1. Go to GitHub Settings → Developer Settings → GitHub Apps
2. Create new app with permissions:
   - Repository contents: Read-only
   - Webhooks: Read & Write
3. Set webhook URL: `https://api.zync.app/webhooks/github`
4. Generate private key

**Backend Webhook Handler:**
```javascript
// backend/src/routes/webhooks/github.js
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

module.exports = async function (fastify) {
  fastify.post('/github', async (request, reply) => {
    const signature = request.headers['x-hub-signature-256'];
    const payload = JSON.stringify(request.body);
    
    if (!verifySignature(payload, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
      return reply.code(401).send({ error: 'Invalid signature' });
    }
    
    const event = request.headers['x-github-event'];
    
    if (event === 'push') {
      const { repository, commits } = request.body;
      
      // Find project linked to this repo
      const project = await prisma.project.findFirst({
        where: { githubRepoUrl: repository.html_url }
      });
      
      if (project) {
        // Trigger AI re-analysis
        await analyzeGitHubRepo(project.id, repository.full_name);
      }
    }
    
    return reply.code(200).send({ status: 'ok' });
  });
};

async function analyzeGitHubRepo(projectId, repoFullName) {
  // Fetch file tree from GitHub API
  // Feed to Google Gemini
  // Update project.githubRepoData
  // (Implementation from your existing code)
}
```

---

## WEEK 4: CACHING & PERFORMANCE

### Day 1-2: Redis Caching Layer
**Owner:** Developer 1

**Setup Redis Client:**
```javascript
// backend/src/utils/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

module.exports = redis;
```

**Cache Strategies:**
```javascript
// backend/src/middleware/cache.js
const redis = require('../utils/redis');

// Cache user lookups (5 minutes)
async function getCachedUser(firebaseUid) {
  const cached = await redis.get(`user:${firebaseUid}`);
  if (cached) return JSON.parse(cached);
  
  const user = await prisma.user.findUnique({
    where: { firebaseUid }
  });
  
  if (user) {
    await redis.setex(`user:${firebaseUid}`, 300, JSON.stringify(user));
  }
  
  return user;
}

// Cache project details (10 minutes)
async function getCachedProject(projectId) {
  const cached = await redis.get(`project:${projectId}`);
  if (cached) return JSON.parse(cached);
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      steps: {
        include: { tasks: true }
      }
    }
  });
  
  if (project) {
    await redis.setex(`project:${projectId}`, 600, JSON.stringify(project));
  }
  
  return project;
}

// Invalidate cache on update
async function invalidateProjectCache(projectId) {
  await redis.del(`project:${projectId}`);
}

module.exports = { getCachedUser, getCachedProject, invalidateProjectCache };
```

### Day 3-4: Database Query Optimization
**Owner:** Developer 2

**Add Indexes:**
```prisma
// prisma/schema.prisma (add these to existing models)

model User {
  // ... existing fields
  
  @@index([firebaseUid])
  @@index([email])
}

model Project {
  // ... existing fields
  
  @@index([ownerId])
  @@index([createdAt])
}

model Task {
  // ... existing fields
  
  @@index([stepId])
  @@index([assigneeId])
  @@index([status])
  @@index([createdAt])
}

model ChatMessage {
  // ... existing fields
  
  @@index([chatRoomId, createdAt(sort: Desc)]) // Composite for pagination
  @@index([senderId])
}

model ActivityLog {
  // ... existing fields
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([createdAt]) // For cleanup queries
}
```

**Optimize Queries with Select:**
```javascript
// Before (fetches all fields)
const users = await prisma.user.findMany();

// After (only needed fields)
const users = await prisma.user.findMany({
  select: {
    id: true,
    displayName: true,
    photoURL: true,
  }
});

// Use pagination for large datasets
const tasks = await prisma.task.findMany({
  where: { stepId },
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' }
});
```

### Day 5-7: Frontend Performance
**Owner:** Developer 3

**Implement React Query for Caching:**
```typescript
// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// frontend/src/hooks/useProject.ts
import { useQuery } from '@tanstack/react-query';

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

**Code Splitting:**
```typescript
// frontend/src/app/projects/[id]/page.tsx
import dynamic from 'next/dynamic';

const CollaborativeEditor = dynamic(
  () => import('@/components/CollaborativeEditor'),
  { ssr: false, loading: () => <div>Loading editor...</div> }
);

const ChatPanel = dynamic(
  () => import('@/components/ChatPanel'),
  { ssr: false }
);
```

**Image Optimization:**
```typescript
// frontend/src/components/Avatar.tsx
import Image from 'next/image';

export function Avatar({ src, name }: { src?: string; name: string }) {
  return (
    <Image
      src={src || '/default-avatar.png'}
      alt={name}
      width={40}
      height={40}
      className="rounded-full"
      loading="lazy"
      quality={75}
    />
  );
}
```

---

## WEEK 5: MONITORING & SECURITY

### Day 1-2: BetterStack Monitoring
**Owner:** Developer 1

**Setup:**
1. Create BetterStack account (free tier: 10 monitors)
2. Add monitors:
   - API uptime: `https://api.zync.app/health`
   - Supabase DB health
   - Redis health
   - Yjs WebSocket health

**Health Endpoint:**
```javascript
// backend/src/routes/health.js
module.exports = async function (fastify) {
  fastify.get('/health', async (request, reply) => {
    const checks = {
      api: 'ok',
      database: 'unknown',
      redis: 'unknown',
      yjs: 'unknown',
    };
    
    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch (err) {
      checks.database = 'error';
    }
    
    // Check Redis
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch (err) {
      checks.redis = 'error';
    }
    
    // Check Yjs (active connections)
    checks.yjs = docs.size > 0 ? 'ok' : 'idle';
    
    const allOk = Object.values(checks).every(v => v === 'ok' || v === 'idle');
    
    return reply.code(allOk ? 200 : 503).send(checks);
  });
};
```

### Day 3-4: Security Hardening
**Owner:** Developer 2

**Rate Limiting:**
```javascript
// backend/src/plugins/rateLimit.js
const rateLimit = require('@fastify/rate-limit');

module.exports = async function (fastify) {
  await fastify.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '1 minute',
    redis, // Use Redis for distributed rate limiting
    errorResponseBuilder: (req, context) => ({
      error: 'Too many requests',
      retryAfter: context.after
    })
  });
};
```

**CORS Configuration:**
```javascript
// backend/src/plugins/cors.js
const cors = require('@fastify/cors');

module.exports = async function (fastify) {
  await fastify.register(cors, {
    origin: [
      'https://zync.app',
      'https://www.zync.app',
      /\.zync\.app$/, // Allow all subdomains
    ],
    credentials: true,
  });
};
```

**Input Validation:**
```javascript
// backend/src/schemas/project.js
const createProjectSchema = {
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      githubRepoUrl: { type: 'string', format: 'uri' },
    },
  },
};

// In route
fastify.post('/create', { schema: createProjectSchema }, async (request, reply) => {
  // Fastify validates automatically
  const { title, description } = request.body;
  // ...
});
```

**Environment Variables Security:**
```bash
# .env.production (NEVER commit this!)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
GITHUB_WEBHOOK_SECRET="..."
REDIS_PASSWORD="..."
GOOGLE_AI_API_KEY="..."
```

### Day 5-7: Load Testing
**Owner:** Developer 3

**Install K6:**
```bash
sudo apt install k6
```

**Load Test Script:**
```javascript
// tests/load/chat.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json')); // 1000 test users
});

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 500 },  // Ramp up to 500 users
    { duration: '5m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const user = users[__VU % users.length];
  
  // Authenticate
  const authRes = http.post('https://api.zync.app/api/auth/login', 
    JSON.stringify({ token: user.token }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(authRes, { 'auth success': (r) => r.status === 200 });
  
  const token = authRes.json('token');
  
  // Send message
  const msgRes = http.post('https://api.zync.app/api/chat/message/send',
    JSON.stringify({
      chatRoomId: user.chatRoomId,
      content: 'Test message'
    }),
    { headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }}
  );
  
  check(msgRes, { 'message sent': (r) => r.status === 200 });
  
  sleep(1);
}
```

**Run Test:**
```bash
k6 run tests/load/chat.js
```

**Expected Results (Target):**
- ✅ < 200ms average response time
- ✅ < 1% error rate
- ✅ 1000 concurrent users sustained

---

## WEEK 6: DEPLOYMENT & FINAL POLISH

### Day 1-2: Production Deployment
**Owner:** Developer 1

**Backend Deployment to Oracle Cloud:**
```bash
# On Oracle VM 1
git clone https://github.com/yourteam/zync-backend.git
cd zync-backend
npm install --production

# Create .env.production
nano .env.production
# Add all production env vars

# Start with PM2
pm2 start src/server.js --name zync-api --env production
pm2 startup # Enable auto-start on reboot
pm2 save

# Configure Cloudflare Tunnel
nano ~/.cloudflared/config.yml
```

**cloudflared config:**
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/ubuntu/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.zync.app
    service: http://localhost:3000
  - service: http_status:404
```

**Start tunnel:**
```bash
pm2 start cloudflared -- tunnel run
pm2 save
```

### Day 3-4: Frontend Deployment to Vercel
**Owner:** Developer 2

**Configure Next.js:**
```typescript
// frontend/next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_FIREBASE_CONFIG: process.env.NEXT_PUBLIC_FIREBASE_CONFIG,
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
};
```

**Deploy:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod

# Add environment variables in Vercel dashboard
```

### Day 5: Documentation & Runbooks
**Owner:** Developer 3

**Create Operational Runbooks:**

**1. Database Backup:**
```bash
# Automated daily backup (add to cron)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/zync_$(date +\%Y\%m\%d).sql.gz
```

**2. Scaling Guide:**
```markdown
# When to Scale

## Supabase (500MB → Paid)
Trigger: Database size > 450MB
Action:
1. Upgrade to Pro ($25/mo for 8GB)
2. Or: Archive old data to S3

## Firebase Storage (5GB → Blaze)
Trigger: Storage > 4.5GB
Action:
1. Enable Blaze pay-as-you-go
2. Set spending limit at $10/mo
3. Or: Migrate to Cloudflare R2 (10GB free)

## Oracle Cloud (1GB RAM → More)
Trigger: Memory usage > 80% consistently
Action:
1. Upgrade to 2GB ARM instances (still free)
2. Or: Add third VM (free tier allows 4 total)
```

**3. Incident Response:**
```markdown
# Common Issues

## API Down
1. Check Oracle VM status
2. Check PM2 processes: `pm2 list`
3. Check logs: `pm2 logs zync-api --lines 100`
4. Restart if needed: `pm2 restart zync-api`

## Database Connection Errors
1. Check Supabase dashboard for outages
2. Check connection pool: `SELECT count(*) FROM pg_stat_activity`
3. If > 60 connections, restart backend

## Redis Down
1. Check Redis: `redis-cli ping`
2. Restart: `sudo systemctl restart redis`
3. If persistent, restart backend (will recreate connection)
```

### Day 6-7: Beta Launch Prep
**Owner:** All Developers

**Pre-Launch Checklist:**
- [ ] Load test passed (1000 concurrent users)
- [ ] All environment variables set
- [ ] Firebase Storage configured
- [ ] Supabase Row Level Security enabled
- [ ] Rate limiting active
- [ ] Monitoring alerts configured
- [ ] Backup automation running
- [ ] Error tracking (Sentry) setup
- [ ] Analytics (PostHog/Plausible) integrated
- [ ] GDPR compliance (privacy policy, data deletion)

**Launch Day Tasks:**
1. Enable Supabase RLS (Row Level Security)
2. Monitor BetterStack dashboard
3. Watch error logs in real-time
4. Have rollback plan ready
5. Celebrate! 🎉

---

# FREE TIER USAGE TRACKING

## Monthly Monitoring Dashboard

Create a simple admin page to track usage:

```typescript
// frontend/src/app/admin/usage/page.tsx
export default function UsagePage() {
  const [usage, setUsage] = useState(null);
  
  useEffect(() => {
    fetch('/api/admin/usage').then(r => r.json()).then(setUsage);
  }, []);
  
  if (!usage) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Free Tier Usage</h1>
      
      <div>
        <h2>Supabase</h2>
        <Progress value={usage.supabase.storage / 500} label="Storage (MB)" />
        <Progress value={usage.supabase.mau / 50000} label="MAU" />
      </div>
      
      <div>
        <h2>Firebase</h2>
        <Progress value={usage.firebase.storage / 5000} label="Storage (MB)" />
        <Progress value={usage.firebase.bandwidth / 1000} label="Bandwidth (MB)" />
      </div>
      
      <div>
        <h2>Oracle Cloud</h2>
        <Progress value={usage.oracle.cpu} label="CPU %" />
        <Progress value={usage.oracle.memory} label="Memory %" />
      </div>
    </div>
  );
}
```

**Backend Endpoint:**
```javascript
// backend/src/routes/admin/usage.js
fastify.get('/usage', async (request, reply) => {
  // Check user is admin
  if (request.user.role !== 'admin') {
    return reply.code(403).send({ error: 'Forbidden' });
  }
  
  // Query database size
  const dbSize = await prisma.$queryRaw`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `;
  
  // Query user count
  const userCount = await prisma.user.count();
  
  // Query storage usage (Firebase Admin SDK)
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles();
  const storageBytes = files.reduce((sum, file) => sum + file.metadata.size, 0);
  
  return {
    supabase: {
      storage: parseInt(dbSize[0].size), // Parse MB
      mau: userCount,
    },
    firebase: {
      storage: storageBytes / (1024 * 1024),
      bandwidth: 0, // Firebase doesn't expose this via API
    },
    oracle: {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage().heapUsed / 1024 / 1024,
    },
  };
});
```

---

# COST PROJECTION (Realistic)

## True Free Tier (Months 1-3)
**Expected:** 100-300 users
- Supabase: $0 (well under limits)
- Firebase: $0 (Auth unlimited, Storage < 5GB)
- Oracle: $0 (always free)
- **Total: $0/month**

## Growth Phase (Months 4-6)
**Expected:** 500-800 users
- Supabase: $0 (still under 500MB DB)
- Firebase: $0-5 (might exceed 10GB bandwidth)
- Oracle: $0
- **Total: $0-5/month**

## Scale Phase (Months 7-12)
**Expected:** 1000+ users
- Supabase: $25/month (Pro for 8GB DB)
- Firebase: $10/month (Blaze pay-as-you-go)
- Oracle: $0
- **Total: $35/month**

**Break-even point:** ~500 users paying $1/month (freemium model)

---

# SUCCESS METRICS

## Week 1 Goals
- [ ] Supabase database operational
- [ ] Oracle Cloud VMs running
- [ ] Backend restructured (Fastify + Prisma only)

## Week 2 Goals
- [ ] All data migrated from MongoDB
- [ ] Chat system live on Supabase Realtime
- [ ] File uploads working via Firebase Storage

## Week 3 Goals
- [ ] Collaborative notes functional (Yjs)
- [ ] GitHub webhooks receiving events
- [ ] Activity logs auto-cleanup working

## Week 4 Goals
- [ ] Redis caching active (90% cache hit rate)
- [ ] Database queries optimized (< 50ms average)
- [ ] Frontend lazy loading implemented

## Week 5 Goals
- [ ] BetterStack monitoring live
- [ ] Rate limiting active
- [ ] Load test passed (1000 users, < 200ms)

## Week 6 Goals
- [ ] Production deployment complete
- [ ] Runbooks documented
- [ ] Beta users onboarded (target: 50 users)

---

# FINAL NOTES

## What Makes This Plan Work

1. **Supabase is the Game-Changer**
   - Real-time built-in (replaces Socket.io for chat)
   - PostgreSQL is more efficient than MongoDB for your relational data
   - Connection pooling solves the "100 connection" problem

2. **Oracle Cloud is Underrated**
   - 2GB RAM total (2x 1GB VMs) is MORE than Fly.io/Railway free tiers
   - No spin-down (unlike Render)
   - 200GB storage for logs/backups

3. **Firebase is Only for Auth + Storage**
   - Don't use Firestore (expensive reads)
   - Don't use RTDB (connection limits)
   - Just use what Firebase does best

4. **Redis on Oracle VM**
   - Self-hosted saves $10/month vs Upstash paid tier
   - 1GB RAM is enough for caching user/project data

## Potential Pitfalls to Avoid

1. **Don't over-normalize Supabase**
   - Denormalize chat messages (store sender name/photo)
   - Reduces joins, speeds up queries

2. **Monitor storage growth**
   - Images in Firebase (not DB)
   - Auto-delete activity logs after 30 days
   - Archive old projects

3. **Connection pool tuning**
   - Supabase max connections: 60 (free tier)
   - Set Prisma pool size: `connection_limit=10`
   - Use pgbouncer (Supabase provides this)

4. **Yjs persistence is critical**
   - ALWAYS save on shutdown
   - Debounce saves (5 seconds)
   - Test recovery scenarios

## When to Pay for Services

**Month 3-4: Enable Firebase Blaze**
- Reason: Chat bandwidth might exceed 10GB
- Cost: ~$5/month for 20GB bandwidth

**Month 6: Upgrade Supabase to Pro**
- Reason: Database might exceed 500MB
- Cost: $25/month for 8GB storage

**Never Pay For:**
- Oracle Cloud (free tier is permanent)
- Vercel (free tier handles 100GB bandwidth)
- BetterStack (10 monitors free is enough)

---

# CONCLUSION

This plan gives you a **production-ready, scalable architecture for 1000+ concurrent users** using only free tiers initially, with a clear path to paid tiers as you grow.

**Key Wins:**
✅ No vendor lock-in (Supabase is self-hostable)  
✅ True free tier for MVP (Months 1-3: $0)  
✅ Clear scaling path (Month 6: ~$35/month)  
✅ Better performance than current Firestore/MongoDB hybrid  
✅ Simpler codebase (one ORM, one database)  

**Total Implementation Time:** 6 weeks with 3 developers  
**Estimated Cost (Year 1):** $0-250 ($0 for 3 months, then ~$35/month)  

Good luck with the rebuild! 🚀