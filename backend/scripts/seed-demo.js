/**
 * @fileoverview seed-demo.js
 * Seeds a believable, populated demo workspace for local development and portfolio showcases.
 * 
 * Safety:
 * - Refuses to run unless MONGO_URI is local (127.0.0.1 or localhost)
 * - Refuses to run unless FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST are set
 * - Refuses to run unless GCLOUD_PROJECT starts with "demo-"
 * - Fully idempotent (cleans up previous demo data before inserting)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

// --- 1. SAFETY CHECKS ---
const mongoUri = process.env.MONGO_URI || '';
const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const gcloudProject = process.env.GCLOUD_PROJECT || '';

const isLocalMongo = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
const isAuthEmulator = Boolean(authEmulatorHost);
const isFirestoreEmulator = Boolean(firestoreEmulatorHost);
const isDemoProject = gcloudProject.startsWith('demo-');

if (!isLocalMongo || !isAuthEmulator || !isFirestoreEmulator || !isDemoProject) {
  console.error('\n❌ SAFETY CHECK FAILED: seed-demo can ONLY run against local development emulators.');
  console.error('Violations detected:');
  if (!isLocalMongo) console.error(`  - MONGO_URI must point to 127.0.0.1 or localhost (current: "${mongoUri}")`);
  if (!isAuthEmulator) console.error('  - FIREBASE_AUTH_EMULATOR_HOST must be set (e.g. 127.0.0.1:9099)');
  if (!isFirestoreEmulator) console.error('  - FIRESTORE_EMULATOR_HOST must be set (e.g. 127.0.0.1:8088)');
  if (!isDemoProject) console.error(`  - GCLOUD_PROJECT must start with "demo-" (current: "${gcloudProject}")`);
  console.error('\nAborting seed to protect non-local environments.\n');
  process.exit(1);
}

// Models
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Step = require('../models/Step');
const ProjectTask = require('../models/ProjectTask');
const Note = require('../models/Note');
const Message = require('../models/Message');
const Meeting = require('../models/Meeting');
const Session = require('../models/Session');
const Activity = require('../models/Activity');

const DEMO_PASSWORD = 'ZyncDemo#2026';

const DEMO_USERS = [
  {
    email: 'alex@zync.dev',
    displayName: 'Alex Designer',
    firstName: 'Alex',
    lastName: 'Designer',
    role: 'Lead Architect & Designer',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    email: 'priya@zync.dev',
    displayName: 'Priya Sharma',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'Senior Backend Engineer',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    email: 'rahul@zync.dev',
    displayName: 'Rahul Patel',
    firstName: 'Rahul',
    lastName: 'Patel',
    role: 'Mobile & Frontend Engineer',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    email: 'sneha@zync.dev',
    displayName: 'Sneha Rao',
    firstName: 'Sneha',
    lastName: 'Rao',
    role: 'DevOps & QA Specialist',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  },
];

/**
 * Creates or signs in a user in the Firebase Auth Emulator via REST API.
 */
async function syncAuthEmulatorUser(user) {
  const signUpUrl = `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`;
  const signInUrl = `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`;
  const updateUrl = `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/accounts:update?key=demo`;

  let localId = null;
  let idToken = null;

  try {
    const signupRes = await axios.post(signUpUrl, {
      email: user.email,
      password: DEMO_PASSWORD,
      returnSecureToken: true,
    });
    localId = signupRes.data.localId;
    idToken = signupRes.data.idToken;
  } catch (err) {
    const code = err.response?.data?.error?.message;
    if (code === 'EMAIL_EXISTS') {
      const signinRes = await axios.post(signInUrl, {
        email: user.email,
        password: DEMO_PASSWORD,
        returnSecureToken: true,
      });
      localId = signinRes.data.localId;
      idToken = signinRes.data.idToken;
    } else {
      throw err;
    }
  }

  // Set displayName and photoURL in Auth emulator
  if (idToken) {
    try {
      await axios.post(updateUrl, {
        idToken,
        displayName: user.displayName,
        photoUrl: user.photoURL,
        returnSecureToken: true,
      });
    } catch (updateErr) {
      console.warn(`[seed] Failed to update displayName for ${user.email}:`, updateErr.message);
    }
  }

  return localId;
}

/**
 * Writes or updates team document in Firestore Emulator via REST API.
 */
async function syncFirestoreTeam(teamId, teamData) {
  try {
    const url = `http://${firestoreEmulatorHost}/v1/projects/${gcloudProject}/databases/(default)/documents/teams/${teamId}`;
    const fields = {
      name: { stringValue: teamData.name },
      ownerId: { stringValue: teamData.ownerId },
      leaderId: { stringValue: teamData.ownerId },
      inviteCode: { stringValue: teamData.inviteCode },
      type: { stringValue: teamData.type || 'Engineering' },
      logoId: { stringValue: teamData.logoId || '1' },
      createdAt: { stringValue: new Date().toISOString() },
      updatedAt: { stringValue: new Date().toISOString() },
      syncedAt: { stringValue: new Date().toISOString() },
      members: {
        arrayValue: {
          values: teamData.members.map((m) => ({ stringValue: m })),
        },
      },
      admins: {
        arrayValue: {
          values: teamData.admins.map((a) => ({ stringValue: a })),
        },
      },
    };
    await axios.patch(url, { fields }, {
      headers: { Authorization: 'Bearer owner' },
    });
  } catch (err) {
    console.warn(`[seed] Firestore emulator REST write failed: ${err.message}`);
  }
}

async function runSeed() {
  console.log('🚀 Starting Zync Local Demo Seed...');
  console.log(`- Project: ${gcloudProject}`);
  console.log(`- Auth Emulator: ${authEmulatorHost}`);
  console.log(`- Firestore Emulator: ${firestoreEmulatorHost}`);
  console.log(`- Mongo URI: ${mongoUri}`);

  // 1. Connect MongoDB
  const mongoOpts = {
    tls: false,
    serverSelectionTimeoutMS: 15000,
  };
  await mongoose.connect(mongoUri, mongoOpts);
  console.log('✅ Connected to local MongoDB.');

  // 2. Auth emulator sync
  console.log('🔑 Provisioning Auth Emulator accounts...');
  const uidMap = {};
  for (const user of DEMO_USERS) {
    const uid = await syncAuthEmulatorUser(user);
    uidMap[user.email] = uid;
    console.log(`   ✓ ${user.email} -> uid: ${uid}`);
  }

  const demoEmails = DEMO_USERS.map((u) => u.email);
  const demoUids = Object.values(uidMap);
  const alexUid = uidMap['alex@zync.dev'];
  const priyaUid = uidMap['priya@zync.dev'];
  const rahulUid = uidMap['rahul@zync.dev'];
  const snehaUid = uidMap['sneha@zync.dev'];

  // 3. IDEMPOTENT CLEANUP
  console.log('🧹 Purging previous demo data for idempotency...');
  const existingUsers = await User.find({ email: { $in: demoEmails } }).lean();
  const existingUserObjIds = existingUsers.map((u) => u._id);

  const existingProjects = await Project.find({
    $or: [{ ownerUid: { $in: demoUids } }, { ownerId: { $in: existingUserObjIds } }],
  }).lean();
  const existingProjectIds = existingProjects.map((p) => p._id);

  const existingSteps = await Step.find({ projectId: { $in: existingProjectIds } }).lean();
  const existingStepIds = existingSteps.map((s) => s._id);

  await ProjectTask.deleteMany({
    $or: [
      { stepId: { $in: existingStepIds } },
      { displayId: /^TASK-\d+$/ },
      { commitCode: /^c-\d+$/ },
    ],
  });
  await Step.deleteMany({ projectId: { $in: existingProjectIds } });
  await Project.deleteMany({ _id: { $in: existingProjectIds } });
  await Team.deleteMany({ $or: [{ name: 'Zync Core' }, { ownerId: { $in: demoUids } }] });
  await Note.deleteMany({ ownerId: { $in: demoUids } });
  await Message.deleteMany({
    $or: [
      { senderId: { $in: demoUids } },
      { receiverId: { $in: demoUids } },
    ],
  });
  await Meeting.deleteMany({ organizerId: { $in: demoUids } });
  await Session.deleteMany({ userId: { $in: demoUids } });
  await Activity.deleteMany({ actorId: { $in: demoUids } });
  await User.deleteMany({ email: { $in: demoEmails } });
  console.log('   ✓ Prior demo records removed.');

  // 4. Create Mongo User docs
  console.log('👤 Creating MongoDB User documents...');
  const createdUsers = {};
  for (const user of DEMO_USERS) {
    const uid = uidMap[user.email];
    const userDoc = await User.create({
      uid,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      photoURL: user.photoURL,
      status: 'online',
      lastSeen: new Date(),
      welcomeNotificationSent: true,
      teamMemberships: [],
    });
    createdUsers[user.email] = userDoc;
  }
  const alexUser = createdUsers['alex@zync.dev'];

  // 5. Create Team ("Zync Core")
  console.log('🏢 Creating Team "Zync Core"...');
  const teamDoc = await Team.create({
    name: 'Zync Core',
    inviteCode: '829401',
    ownerId: alexUid,
    admins: [alexUid],
    members: demoUids,
    pendingMembers: [],
    type: 'Engineering',
    logoId: '1',
  });

  // Link team to user docs
  await User.updateMany(
    { uid: { $in: demoUids } },
    { $set: { teamMemberships: [teamDoc._id.toString()] } }
  );

  // Sync to Firestore emulator
  await syncFirestoreTeam(teamDoc._id.toString(), {
    name: teamDoc.name,
    ownerId: teamDoc.ownerId,
    inviteCode: teamDoc.inviteCode,
    members: teamDoc.members,
    admins: teamDoc.admins,
    type: teamDoc.type,
    logoId: teamDoc.logoId,
  });

  // 6. Create Projects
  console.log('📁 Creating Projects...');
  const project1 = await Project.create({
    name: 'Zync Dashboard',
    description: 'Main web platform with team collaboration, task tracking, and GitHub integration.',
    ownerId: alexUser._id,
    ownerUid: alexUid,
    team: demoUids,
    githubRepo: 'zync-meet/zync-web',
    githubRepoName: 'zync-web',
    githubRepoOwner: 'zync-meet',
    githubRepoIds: ['repo-zync-web'],
    architecture: {
      highLevel: 'Modern full-stack client-server architecture. Decoupled React frontend communicating with Express backend and MongoDB/Redis.',
      frontend: {
        structure: 'Modular React 18 SPA with Vite, Tailwind CSS, Lucide icons, and TanStack React Query.',
        pages: ['Dashboard', 'Workspace', 'Projects', 'Calendar', 'Notes', 'Chat', 'Activity Log'],
        components: ['ProjectDetails', 'TaskBoardView', 'NotesView', 'ChatLayout', 'ActivityLogView'],
        routing: 'React Router DOM v6',
      },
      backend: {
        structure: 'Express REST API with WebSocket clusters for real-time note and chat collaboration.',
        apis: ['/api/projects', '/api/tasks', '/api/notes', '/api/chat', '/api/teams'],
        controllers: ['ProjectController', 'TaskController', 'NoteController'],
        services: ['AuthService', 'TeamFirebaseSync', 'RedisClient'],
        authFlow: 'Firebase Authentication with verifyToken Bearer middleware',
      },
      database: {
        design: 'MongoDB document datastore with Redis caching and session tracking.',
        collections: ['users', 'teams', 'projects', 'steps', 'projecttasks', 'notes', 'messages', 'meetings', 'sessions', 'activities'],
        relationships: ['Team has-many Users', 'User has-many Projects', 'Project has-many Steps', 'Step has-many Tasks'],
      },
      integrations: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'Redis', 'Socket.io', 'Firebase Auth', 'Firestore'],
    },
  });

  const project2 = await Project.create({
    name: 'API Gateway',
    description: 'Central high-performance API gateway and reverse proxy for microservices with Redis rate-limiting.',
    ownerId: alexUser._id,
    ownerUid: alexUid,
    team: demoUids,
    githubRepo: 'zync-meet/api-gateway',
    githubRepoName: 'api-gateway',
    githubRepoOwner: 'zync-meet',
    githubRepoIds: ['repo-api-gateway'],
    architecture: {
      highLevel: 'High-performance API gateway providing authentication verification, rate limiting, and request routing.',
      integrations: ['Node.js', 'Express', 'Redis', 'Docker', 'JWT Auth'],
    },
  });

  const project3 = await Project.create({
    name: 'Mobile App',
    description: 'Cross-platform client for iOS and Android with offline-first synchronization.',
    ownerId: alexUser._id,
    ownerUid: alexUid,
    team: demoUids,
    githubRepo: 'zync-meet/zync-mobile',
    githubRepoName: 'zync-mobile',
    githubRepoOwner: 'zync-meet',
    githubRepoIds: ['repo-zync-mobile'],
    architecture: {
      highLevel: 'Native mobile application with offline-first state synchronisation.',
      integrations: ['React Native', 'Expo', 'TypeScript', 'Firebase Auth', 'Socket.io'],
    },
  });

  const projects = [project1, project2, project3];

  // 7. Create Steps and Tasks
  console.log('📋 Creating Steps and ProjectTasks...');
  let taskCounter = 1;

  const taskDefinitions = [
    // Project 1 Tasks (Zync Dashboard)
    {
      title: 'Implement Dark Mode UI palette and tokens',
      description: 'Configure Tailwind color system with CSS variables for seamless theme switching without flash.',
      status: 'Done',
      assigneeUid: alexUid,
      assigneeName: 'Alex Designer',
    },
    {
      title: 'Migrate Kanban Task Board to Drag and Drop',
      description: 'Implement optimistic drag-and-drop state updates with rollback on network failure.',
      status: 'Done',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Integrate BlockNote rich text collaborative editor',
      description: 'Embed BlockNote editor and hook into socket connection for concurrent editing.',
      status: 'In Progress',
      assigneeUid: alexUid,
      assigneeName: 'Alex Designer',
    },
    {
      title: 'Add Redis sliding-window API rate limiting',
      description: 'Protect all public API endpoints using atomic Lua scripts in Redis.',
      status: 'In Progress',
      assigneeUid: priyaUid,
      assigneeName: 'Priya Sharma',
    },
    {
      title: 'Build Activity Log chart visualizer',
      description: 'Render session duration trends, task velocity, and team member breakdowns.',
      status: 'Review',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Implement Google Meet instant space creation',
      description: 'Connect Google Meet v2 API with OAuth2 refresh tokens for video rooms.',
      status: 'Review',
      assigneeUid: priyaUid,
      assigneeName: 'Priya Sharma',
    },
    {
      title: 'Audit Web Accessibility (WCAG 2.1 AA compliance)',
      description: 'Verify focus rings, color contrast ratios, screen reader announcements, and keyboard traps.',
      status: 'Ready',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },
    {
      title: 'Setup automated E2E test suite in GitHub Actions',
      description: 'Run Playwright test suite against local emulator fixtures on pull requests.',
      status: 'Ready',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },
    {
      title: 'Add responsive drawer navigation for mobile viewports',
      description: 'Ensure sidebar and workspace panels smoothly collapse on viewport widths under 768px.',
      status: 'Done',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Configure Firebase App Check with reCAPTCHA v3',
      description: 'Prevent scraping and abuse on authentication endpoints using App Check tokens.',
      status: 'In Progress',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },

    // Project 2 Tasks (API Gateway)
    {
      title: 'Architect JWT token validation middleware',
      description: 'Verify Bearer tokens against Firebase Admin SDK public keys with 5-minute memory cache.',
      status: 'Done',
      assigneeUid: priyaUid,
      assigneeName: 'Priya Sharma',
    },
    {
      title: 'Configure Reverse Proxy routes for Microservices',
      description: 'Direct traffic across user service, task service, and notification workers.',
      status: 'Done',
      assigneeUid: priyaUid,
      assigneeName: 'Priya Sharma',
    },
    {
      title: 'Implement Load Shedding middleware',
      description: 'Reject excess non-critical traffic under high memory/CPU pressure to maintain latency.',
      status: 'In Progress',
      assigneeUid: priyaUid,
      assigneeName: 'Priya Sharma',
    },
    {
      title: 'Setup Distributed Tracing with OpenTelemetry',
      description: 'Propagate traceparent headers across internal HTTP and WebSocket hops.',
      status: 'Ready',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },
    {
      title: 'Benchmark API latency under 10k RPS load',
      description: 'Run k6 load tests against /api/health and /api/projects with connection pooling.',
      status: 'Review',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },
    {
      title: 'Secure Internal Metrics endpoints with API Secret',
      description: 'Protect /internal/metrics routes with x-internal-secret header validation.',
      status: 'Done',
      assigneeUid: priyaUid,
      assigneeName: 'Priya Sharma',
    },
    {
      title: 'Implement health check readiness and liveness probes',
      description: 'Return 200 when MongoDB and Redis connections are alive; return 503 during warmup.',
      status: 'Done',
      assigneeUid: priyaUid,
      assigneeName: 'Priya Sharma',
    },
    {
      title: 'Add CORS whitelist configuration for staging domains',
      description: 'Validate origin headers against dynamic environment whitelist array.',
      status: 'In Progress',
      assigneeUid: alexUid,
      assigneeName: 'Alex Designer',
    },
    {
      title: 'Containerize Gateway with multi-stage Docker build',
      description: 'Produce slim Alpine Linux container image under 80MB with non-root user execution.',
      status: 'Review',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },
    {
      title: 'Design API Gateway failover runbook',
      description: 'Document disaster recovery steps when primary Redis node fails over.',
      status: 'Ready',
      assigneeUid: alexUid,
      assigneeName: 'Alex Designer',
    },

    // Project 3 Tasks (Mobile App)
    {
      title: 'Initialize Expo React Native project with TypeScript',
      description: 'Setup expo-router, tailwind-react-native, and gesture handler.',
      status: 'Done',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Build Mobile Dashboard Overview Screen',
      description: 'Display quick stats, active sprint progress bar, and upcoming team meetings.',
      status: 'Done',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Implement biometric authentication (FaceID / Fingerprint)',
      description: 'Allow fast local authentication using expo-local-authentication with keychain fallback.',
      status: 'In Progress',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Integrate push notifications via Firebase Cloud Messaging',
      description: 'Handle background and foreground notifications for incoming chat and task assignments.',
      status: 'In Progress',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },
    {
      title: 'Implement offline task cache with WatermelonDB',
      description: 'Allow users to browse and complete tasks with zero network connectivity.',
      status: 'Ready',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Design Mobile Chat thread interface',
      description: 'Optimized flat list rendering for 500+ messages with native keyboard avoidance.',
      status: 'Review',
      assigneeUid: alexUid,
      assigneeName: 'Alex Designer',
    },
    {
      title: 'Add haptic feedback on task completion',
      description: 'Trigger subtle sensory feedback via expo-haptics when marking cards Done.',
      status: 'Done',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
    {
      title: 'Test Android dark theme contrast on OLED screens',
      description: 'Verify deep black backgrounds (#09090b) reduce power draw and prevent eye fatigue.',
      status: 'Review',
      assigneeUid: alexUid,
      assigneeName: 'Alex Designer',
    },
    {
      title: 'Setup automated TestFlight & Play Console builds with EAS',
      description: 'Automate build artifacts generation on main branch git tags.',
      status: 'Ready',
      assigneeUid: snehaUid,
      assigneeName: 'Sneha Rao',
    },
    {
      title: 'Implement Deep Linking for direct project invite URLs',
      description: 'Handle zync://team/invite/:code scheme to auto-join teams on app launch.',
      status: 'Ready',
      assigneeUid: rahulUid,
      assigneeName: 'Rahul Patel',
    },
  ];

  let taskIndex = 0;
  for (const project of projects) {
    const step1 = await Step.create({
      title: 'Sprint 14: Core Features',
      description: 'Core functional requirements and foundational services.',
      order: 1,
      status: 'In Progress',
      projectId: project._id,
      assignedTo: alexUid,
    });
    const step2 = await Step.create({
      title: 'Sprint 15: Integrations & Polishing',
      description: 'Third-party integrations, testing, and UX refinement.',
      order: 2,
      status: 'Ready',
      projectId: project._id,
      assignedTo: priyaUid,
    });
    const step3 = await Step.create({
      title: 'Backlog & Maintenance',
      description: 'Long-term improvements, technical debt, and performance audits.',
      order: 3,
      status: 'Ready',
      projectId: project._id,
      assignedTo: snehaUid,
    });

    const projectSteps = [step1, step2, step3];

    for (let i = 0; i < 10; i++) {
      const taskDef = taskDefinitions[taskIndex++];
      const step = projectSteps[i % 3];
      const displayId = `TASK-${taskCounter}`;
      const commitCode = `c-${taskCounter}`;
      taskCounter++;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + ((i % 14) + 1));

      await ProjectTask.create({
        displayId,
        title: taskDef.title,
        description: taskDef.description,
        status: taskDef.status,
        assignedTo: taskDef.assigneeUid,
        assignedUserIds: [taskDef.assigneeUid],
        assignedToName: taskDef.assigneeName,
        createdBy: alexUid,
        assignedBy: alexUid,
        commitCode,
        commitMessage: `feat(${project.githubRepoName}): ${taskDef.title.toLowerCase()} [${displayId}]`,
        githubBranchName: `feat/${displayId.toLowerCase()}-${taskDef.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.slice(0, 40),
        stepId: step._id,
        repoIds: [project.githubRepoName],
        createdAt: new Date(Date.now() - (10 - (i % 8)) * 86400000),
      });
    }
  }

  // 8. Create Notes
  console.log('📝 Creating Notes...');
  const note1Content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Zync Architecture Plan & RFC', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'This document outlines the core architectural principles, data flow models, and resilience guarantees for the Zync collaboration suite.',
        styles: {},
      }],
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: '1. Decoupled Presentation and Realtime Engine', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'The client application is built on React 18 with Vite, utilizing TanStack Query for cache invalidation and framer-motion for butter-smooth transitions. Collaborative editing is backed by Yjs document state synced over Socket.io clusters.',
        styles: {},
      }],
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: '2. Resilience & Local-First Fallbacks', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'All third-party integrations (Cloudinary, GitHub App, Gmail, Google Sheets) degrade gracefully to local stubs when credentials are not supplied, ensuring seamless local development with zero external dependencies.',
        styles: {},
      }],
    },
  ];

  const note2Content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Sprint 14 Planning & Milestones', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'Sprint 14 targets key usability wins across our task management board and real-time chat infrastructure. Team velocity estimate: 42 story points.',
        styles: {},
      }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Alex: Complete Kanban drag-and-drop animations and Dark Mode tokens.', styles: {} }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Priya: Finalize Redis atomic rate-limiter and API load shedding.', styles: {} }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Rahul: Polish Mobile App dashboard view and offline task queue.', styles: {} }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Sneha: Automate Playwright test matrix and CI pipeline triggers.', styles: {} }],
    },
  ];

  const note3Content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'API Rate-Limit Design & Implementation', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'We employ a sliding window log with Redis atomic INCR and EXPIRE commands. In local development or Redis outages, the gateway fails open with non-blocking warning telemetry.',
        styles: {},
      }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'Default quotas: 600 requests/minute per IP in development, 100 requests/15 minutes in production. Architecture generation is capped per user with a weekly sliding TTL.',
        styles: {},
      }],
    },
  ];

  const note4Content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Developer Onboarding Checklist', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'Welcome to Zync! Follow these steps to get your full environment running locally with complete isolation:',
        styles: {},
      }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Start local Mongo container: docker run -p 27018:27017 mongo:7', styles: {} }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Start local Redis container: docker run -p 6380:6379 redis:7-alpine', styles: {} }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Start Firebase Emulators: firebase emulators:start --only auth,firestore,storage', styles: {} }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Seed test data: npm run seed:demo from the backend directory.', styles: {} }],
    },
  ];

  const note5Content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Security & Authentication Audit', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'Review of cryptographic controls, session token verification, and RBAC enforcement. All API routes require authenticated JWT Bearer headers.',
        styles: {},
      }],
    },
  ];

  const note6Content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Performance Optimization Guide', styles: { bold: true } }],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'Techniques for ensuring sub-100ms UI interactions: TanStack Query persistence, lazy routing chunks, virtualized task lists, and SVG sprite caching.',
        styles: {},
      }],
    },
  ];

  const notesData = [
    { title: 'Architecture Plan', content: note1Content, projectId: project1._id.toString() },
    { title: 'Sprint 14 Planning', content: note2Content, projectId: project1._id.toString() },
    { title: 'API Rate-Limit Design', content: note3Content, projectId: project2._id.toString() },
    { title: 'Onboarding Checklist', content: note4Content, projectId: null },
    { title: 'Security & Auth Audit', content: note5Content, projectId: project2._id.toString() },
    { title: 'Performance Optimization Guide', content: note6Content, projectId: project3._id.toString() },
  ];

  for (const n of notesData) {
    await Note.create({
      title: n.title,
      content: n.content,
      ownerId: alexUid,
      projectId: n.projectId,
      sharedWith: [priyaUid, rahulUid, snehaUid],
    });
  }

  // 9. Create Messages (~33 messages across 3 threads: Alex↔Sneha, Alex↔Rahul, Alex↔Priya)
  console.log('💬 Creating Chat Messages...');
  const chatSnehaId = [alexUid, snehaUid].sort().join('_');
  const chatRahulId = [alexUid, rahulUid].sort().join('_');
  const chatPriyaId = [alexUid, priyaUid].sort().join('_');

  const threadSneha = [
    { sender: alexUid, senderName: 'Alex Designer', text: 'Hey Sneha, how did the accessibility and contrast audit go on the new dashboard components?' },
    { sender: snehaUid, senderName: 'Sneha Rao', text: 'Hey Alex! All the contrast ratios and ARIA landmark roles look great now. Fixed a small focus trap in the mobile drawer yesterday.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Awesome catch. Did you get a chance to run the Playwright test suite against the local emulator fixtures?' },
    { sender: snehaUid, senderName: 'Sneha Rao', text: 'Yes! 48/48 test specs passing in under 45 seconds. CI pipeline integration is fully green on GitHub Actions.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Incredible speed. What is next on your radar for Sprint 14?' },
    { sender: snehaUid, senderName: 'Sneha Rao', text: 'Verifying the Firebase App Check integration with reCAPTCHA v3 tokens to protect our authentication endpoints.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Let me know if you need any adjustments to the client auth headers or token refresh handling.' },
    { sender: snehaUid, senderName: 'Sneha Rao', text: 'Will do! I also reviewed your Architecture Plan note — the offline fallback strategy is rock-solid.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Glad to hear. Let us do a quick walkthrough before the demo on Friday.' },
    { sender: snehaUid, senderName: 'Sneha Rao', text: 'Sounds like a plan! See you in the team sync.' },
  ];

  const threadRahul = [
    { sender: rahulUid, senderName: 'Rahul Patel', text: 'Alex, I just pushed the new mobile navigation drawer component.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Nice! Does it support the smooth gesture dismissal we discussed?' },
    { sender: rahulUid, senderName: 'Rahul Patel', text: 'Yes! Using react-native-gesture-handler with native springs. Feels completely fluid.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'That is great. How is offline task caching looking with WatermelonDB?' },
    { sender: rahulUid, senderName: 'Rahul Patel', text: 'Got the schema synchronized. When offline, changes queue up and sync immediately on reconnect.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Huge win for mobile users. Are we on track for the Sprint 14 demo on Friday?' },
    { sender: rahulUid, senderName: 'Rahul Patel', text: 'Definitely. Just wrapping up haptic feedback triggers on the checkbox items.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Subtle haptics make all the difference. Keep up the great work!' },
    { sender: rahulUid, senderName: 'Rahul Patel', text: 'Thanks! Going to test the build on both iOS and Android emulators tonight.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Catch you in tomorrow morning standup.' },
    { sender: rahulUid, senderName: 'Rahul Patel', text: 'See you tomorrow!' },
  ];

  const threadPriya = [
    { sender: alexUid, senderName: 'Alex Designer', text: 'Hey Priya, how is the API Gateway load shedding implementation coming along?' },
    { sender: priyaUid, senderName: 'Priya Sharma', text: 'Hey Alex! Going really well. The Redis sliding window counter is fully working with atomic Lua scripts.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Awesome. What happens when Redis is briefly restarting or offline?' },
    { sender: priyaUid, senderName: 'Priya Sharma', text: 'It fails open gracefully — requests are allowed through with a telemetry warning so the app never hard-crashes.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Perfect. Did you benchmark the round-trip latency on that?' },
    { sender: priyaUid, senderName: 'Priya Sharma', text: 'Yes, around 1.2ms average overhead per verified request. Super fast.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Love that. I also updated the Architecture Plan note with our latest schema changes.' },
    { sender: priyaUid, senderName: 'Priya Sharma', text: 'Saw that! The component breakdowns look very clean.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Do you need any UI tweaks for the Gateway metrics view on the dashboard?' },
    { sender: priyaUid, senderName: 'Priya Sharma', text: 'Just the chart color contrast for dark mode, but I saw you already tackled that today.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Yup, all tuned to WCAG 2.1 AA standards.' },
    { sender: priyaUid, senderName: 'Priya Sharma', text: 'Great. I will merge the PR before our standup tomorrow.' },
    { sender: alexUid, senderName: 'Alex Designer', text: 'Sounds like a plan! Let me know if you hit any roadblocks.' },
    { sender: priyaUid, senderName: 'Priya Sharma', text: 'Will do! Thanks Alex.' },
  ];

  const nowMs = Date.now();

  // Thread 1: Alex <-> Sneha (recent timestamps, within last ~2 hours)
  let msgTimeSneha = nowMs - (110 * 60 * 1000);
  for (const m of threadSneha) {
    const receiverId = m.sender === alexUid ? snehaUid : alexUid;
    await Message.create({
      chatId: chatSnehaId,
      text: m.text,
      senderId: m.sender,
      senderName: m.senderName,
      receiverId,
      seen: true,
      delivered: true,
      createdAt: new Date(msgTimeSneha),
    });
    msgTimeSneha += 8 * 60 * 1000;
  }

  // Thread 2: Alex <-> Rahul (within last ~6 hours)
  let msgTimeRahul = nowMs - (320 * 60 * 1000);
  for (const m of threadRahul) {
    const receiverId = m.sender === alexUid ? rahulUid : alexUid;
    await Message.create({
      chatId: chatRahulId,
      text: m.text,
      senderId: m.sender,
      senderName: m.senderName,
      receiverId,
      seen: true,
      delivered: true,
      createdAt: new Date(msgTimeRahul),
    });
    msgTimeRahul += 15 * 60 * 1000;
  }

  // Thread 3: Alex <-> Priya (within last ~18 hours)
  let msgTimePriya = nowMs - (18 * 3600 * 1000);
  for (const m of threadPriya) {
    const receiverId = m.sender === alexUid ? priyaUid : alexUid;
    await Message.create({
      chatId: chatPriyaId,
      text: m.text,
      senderId: m.sender,
      senderName: m.senderName,
      receiverId,
      seen: true,
      delivered: true,
      createdAt: new Date(msgTimePriya),
    });
    msgTimePriya += 15 * 60 * 1000;
  }

  // 10. Create Meetings (5 Meetings across this week and next)
  console.log('📅 Creating Meetings...');
  const now = new Date();

  const m1 = new Date(now);
  m1.setHours(10, 0, 0, 0);

  const m2 = new Date(now);
  m2.setDate(m2.getDate() + 1);
  m2.setHours(14, 0, 0, 0);

  const m3 = new Date(now);
  m3.setDate(m3.getDate() + 3);
  m3.setHours(16, 0, 0, 0);

  const m4 = new Date(now);
  m4.setDate(m4.getDate() + 5);
  m4.setHours(11, 0, 0, 0);

  const m5 = new Date(now);
  m5.setDate(m5.getDate() + 8);
  m5.setHours(10, 30, 0, 0);

  const meetingsData = [
    {
      title: 'Daily Standup - Core Team',
      description: 'Quick 15-minute sync on daily blockers, progress, and immediate PR reviews.',
      startTime: m1,
      endTime: new Date(m1.getTime() + 15 * 60000),
      meetLink: 'https://meet.jit.si/zync-daily-standup',
      projectId: project1._id.toString(),
      participants: demoUids,
    },
    {
      title: 'API Architecture & Gateway Review',
      description: 'Deep dive into load shedding parameters, Redis sentinel topology, and distributed tracing.',
      startTime: m2,
      endTime: new Date(m2.getTime() + 45 * 60000),
      meetLink: 'https://meet.jit.si/zync-api-architecture',
      projectId: project2._id.toString(),
      participants: [alexUid, priyaUid],
    },
    {
      title: 'Mobile App Sprint 14 Demo',
      description: 'Live interactive walkthrough of Expo build, gestures, and offline-first queue.',
      startTime: m3,
      endTime: new Date(m3.getTime() + 45 * 60000),
      meetLink: 'https://meet.jit.si/zync-mobile-sprint-demo',
      projectId: project3._id.toString(),
      participants: [alexUid, rahulUid, snehaUid],
    },
    {
      title: 'Sprint 14 Retrospective',
      description: 'Review what went well, what could be improved, and action items for next cycle.',
      startTime: m4,
      endTime: new Date(m4.getTime() + 60 * 60000),
      meetLink: 'https://meet.jit.si/zync-sprint14-retro',
      projectId: project1._id.toString(),
      participants: demoUids,
    },
    {
      title: 'Sprint 15 Planning & Roadmapping',
      description: 'Backlog grooming, user story estimation, and sprint commitment.',
      startTime: m5,
      endTime: new Date(m5.getTime() + 60 * 60000),
      meetLink: 'https://meet.jit.si/zync-sprint15-planning',
      projectId: project1._id.toString(),
      participants: demoUids,
    },
  ];

  for (const meet of meetingsData) {
    await Meeting.create({
      title: meet.title,
      description: meet.description,
      organizerId: alexUid,
      organizerName: 'Alex Designer',
      meetLink: meet.meetLink,
      projectId: meet.projectId,
      status: 'scheduled',
      startTime: meet.startTime,
      endTime: meet.endTime,
      participants: meet.participants,
    });
  }

  // 11. Create Sessions and Activity Logs
  console.log('📊 Creating Sessions and Activity log entries...');
  const activityActions = [
    { actorId: alexUid, action: 'created_project', entityType: 'project', metadata: { title: 'Zync Dashboard', details: 'Created primary project workspace' } },
    { actorId: alexUid, action: 'created_project', entityType: 'project', metadata: { title: 'API Gateway', details: 'Created gateway microservice' } },
    { actorId: alexUid, action: 'created_project', entityType: 'project', metadata: { title: 'Mobile App', details: 'Created client application' } },
    { actorId: priyaUid, action: 'created_task', entityType: 'task', metadata: { title: 'Add Redis sliding-window API rate limiting', taskId: 'TASK-4' } },
    { actorId: rahulUid, action: 'created_task', entityType: 'task', metadata: { title: 'Migrate Kanban Task Board to Drag and Drop', taskId: 'TASK-2' } },
    { actorId: snehaUid, action: 'created_task', entityType: 'task', metadata: { title: 'Audit Web Accessibility', taskId: 'TASK-7' } },
    { actorId: alexUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Implement Dark Mode UI palette', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-1' } },
    { actorId: priyaUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Architect JWT token validation middleware', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-11' } },
    { actorId: rahulUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Initialize Expo React Native project', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-21' } },
    { actorId: alexUid, action: 'shared_note', entityType: 'note', metadata: { title: 'Architecture Plan', sharedWith: 'Zync Core' } },
    { actorId: priyaUid, action: 'committed_code', entityType: 'git', metadata: { repo: 'api-gateway', commit: 'c-11', message: 'feat: jwt auth middleware' } },
    { actorId: rahulUid, action: 'committed_code', entityType: 'git', metadata: { repo: 'zync-mobile', commit: 'c-21', message: 'feat: setup expo-router' } },
    { actorId: snehaUid, action: 'run_tests', entityType: 'ci', metadata: { suite: 'E2E Playwright', passed: 48, failed: 0 } },
    { actorId: alexUid, action: 'scheduled_meeting', entityType: 'meeting', metadata: { title: 'Daily Standup - Core Team' } },
    { actorId: priyaUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Configure Reverse Proxy routes', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-12' } },
    { actorId: rahulUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Build Mobile Dashboard Overview Screen', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-22' } },
    { actorId: snehaUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Benchmark API latency under 10k RPS load', oldStatus: 'Ready', newStatus: 'Review', taskId: 'TASK-15' } },
    { actorId: alexUid, action: 'created_note', entityType: 'note', metadata: { title: 'Sprint 14 Planning' } },
    { actorId: priyaUid, action: 'created_note', entityType: 'note', metadata: { title: 'API Rate-Limit Design' } },
    { actorId: alexUid, action: 'created_note', entityType: 'note', metadata: { title: 'Developer Onboarding Checklist' } },
    { actorId: rahulUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Add responsive drawer navigation', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-9' } },
    { actorId: snehaUid, action: 'security_audit', entityType: 'security', metadata: { target: 'API Gateway', status: 'Passed' } },
    { actorId: priyaUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Implement health check readiness probes', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-17' } },
    { actorId: rahulUid, action: 'updated_status', entityType: 'task', metadata: { title: 'Add haptic feedback on task completion', oldStatus: 'In Progress', newStatus: 'Done', taskId: 'TASK-27' } },
    { actorId: alexUid, action: 'reviewed_task', entityType: 'task', metadata: { title: 'Build Activity Log chart visualizer', taskId: 'TASK-5' } },
    { actorId: snehaUid, action: 'tested_build', entityType: 'mobile', metadata: { platform: 'Android', target: 'OLED contrast' } },
    { actorId: alexUid, action: 'pinned_note', entityType: 'note', metadata: { title: 'Architecture Plan' } },
    { actorId: priyaUid, action: 'cache_cleared', entityType: 'cache', metadata: { namespace: 'gh:*' } },
    { actorId: rahulUid, action: 'started_session', entityType: 'session', metadata: { platform: 'Mobile (iOS Simulator)' } },
    { actorId: alexUid, action: 'started_session', entityType: 'session', metadata: { platform: 'Desktop (Linux/Chrome)' } },
  ];

  for (let i = 0; i < activityActions.length; i++) {
    const act = activityActions[i];
    const timestamp = new Date(Date.now() - (10 - Math.floor(i / 3)) * 86400000 + (i % 8) * 3600000);
    await Activity.create({
      teamId: teamDoc._id.toString(),
      actorId: act.actorId,
      action: act.action,
      entityType: act.entityType,
      metadata: act.metadata,
      createdAt: timestamp,
    });
  }

  // Sessions for Alex and team (for ActivityLogView charts & stats)
  for (let dayOffset = 9; dayOffset >= 0; dayOffset--) {
    const sessionDate = new Date(Date.now() - dayOffset * 86400000);
    const dateStr = sessionDate.toISOString().split('T')[0];

    const sessionDurationSeconds = 7200 + Math.floor(Math.random() * 7200);
    const activeDurationSeconds = Math.floor(sessionDurationSeconds * 0.82);

    const startTime = new Date(sessionDate);
    startTime.setHours(9, 30, 0, 0);

    const endTime = new Date(startTime.getTime() + sessionDurationSeconds * 1000);

    await Session.create({
      userId: alexUid,
      startTime,
      endTime,
      duration: sessionDurationSeconds,
      activeDuration: activeDurationSeconds,
      date: dateStr,
      deviceInfo: 'Desktop (Linux/Chrome 126)',
      eventType: 'session',
      title: 'Zync Core Workspace Session',
      actorName: 'Alex Designer',
      metadata: { tasksCompleted: 1 + (dayOffset % 3), notesEdited: 2 },
      createdAt: startTime,
    });

    if (dayOffset % 2 === 0) {
      await Session.create({
        userId: priyaUid,
        startTime,
        endTime,
        duration: sessionDurationSeconds - 1200,
        activeDuration: activeDurationSeconds - 900,
        date: dateStr,
        deviceInfo: 'Desktop (macOS/Chrome)',
        eventType: 'session',
        title: 'Backend Engineering Session',
        actorName: 'Priya Sharma',
        createdAt: startTime,
      });
    }
  }

  // 12. SUMMARY COUNTS
  const [
    userCount,
    teamCount,
    projectCount,
    stepCount,
    taskCount,
    noteCount,
    messageCount,
    meetingCount,
    sessionCount,
    activityCount,
  ] = await Promise.all([
    User.countDocuments({ email: { $in: demoEmails } }),
    Team.countDocuments({ name: 'Zync Core' }),
    Project.countDocuments({ ownerUid: alexUid }),
    Step.countDocuments({}),
    ProjectTask.countDocuments({ displayId: /^TASK-/ }),
    Note.countDocuments({ ownerId: alexUid }),
    Message.countDocuments({ $or: [{ senderId: { $in: demoUids } }, { receiverId: { $in: demoUids } }] }),
    Meeting.countDocuments({ organizerId: alexUid }),
    Session.countDocuments({ userId: { $in: demoUids } }),
    Activity.countDocuments({ teamId: teamDoc._id.toString() }),
  ]);

  console.log('\n========================================================');
  console.log('🎉 ZYNC DEMO SEED COMPLETED SUCCESSFULLY!');
  console.log('========================================================');
  console.log('🔑 Login Credentials:');
  console.log(`   Email:    alex@zync.dev`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log('--------------------------------------------------------');
  console.log('📦 Database Records Seeded:');
  console.log(`   - Users:        ${userCount}`);
  console.log(`   - Teams:        ${teamCount}`);
  console.log(`   - Projects:     ${projectCount}`);
  console.log(`   - Steps:        ${stepCount}`);
  console.log(`   - Tasks:        ${taskCount}`);
  console.log(`   - Notes:        ${noteCount}`);
  console.log(`   - Messages:     ${messageCount}`);
  console.log(`   - Meetings:     ${meetingCount}`);
  console.log(`   - Sessions:     ${sessionCount}`);
  console.log(`   - Activities:   ${activityCount}`);
  console.log('========================================================\n');

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('\n❌ Unhandled error during seed-demo:', err);
  process.exit(1);
});
