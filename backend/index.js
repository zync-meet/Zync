const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const { Server } = require("socket.io");
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();


app.get('/favicon.ico', (req, res) => res.status(204).end());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081', // Vite dev server (see vite.config.ts; Electron loads this URL)
  'http://127.0.0.1:8081',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {return callback(null, true);}
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});


app.set('io', io);


require('./sockets/noteSocketHandler')(io);
require('./sockets/presenceSocketHandler')(io);
require('./sockets/chatSocketHandler')(io);


const PORT = process.env.PORT || 5000;


const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const designRoutes = require('./routes/designRoutes');
const inspirationRoutes = require('./routes/inspirationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const generationRoutes = require('./routes/generateProjectRoutes');
const githubRoutes = require('./routes/github');
const linkRoutes = require('./routes/linkRoutes');
const githubAppWebhook = require('./routes/githubAppWebhook');
const noteRoutes = require('./routes/noteRoutes');
const chatRoutes = require('./routes/chatRoutes');
const calendarRoutes = require('./routes/calendarRoutes');


app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "https://apis.google.com", "https://www.googleapis.com", "https://www.gstatic.com", "https://www.google.com"],
        "connect-src": ["'self'", "https://github.com", "https://api.github.com", "http://localhost:*", "ws://localhost:*", "wss://*.glitch.me", "https://*.googleapis.com", "https://www.google.com", "https://www.gstatic.com", "https://*.firebaseio.com", "https://*.firebase.google.com"],
        "img-src": ["'self'", "data:", "https://avatars.githubusercontent.com", "https://*.githubusercontent.com", "https://*.googleusercontent.com", "https://*.google.com", "blob:", "https://ui-avatars.com", "https://res.cloudinary.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "worker-src": ["'self'", "blob:"],
        "frame-src": ["'self'", "https://github.com", "https://*.firebaseapp.com", "https://*.google.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
    status: 429
  }
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/projects', projectRoutes);
app.use('/api/generate-project', generationRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/link', linkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/design', designRoutes);
app.use('/api/inspiration', inspirationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/github-app', githubAppWebhook);
app.use('/api/meet', require('./routes/meetRoutes'));
app.use('/api/linkedin', require('./routes/linkedinRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/google', require('./routes/googleRoutes'));
app.use('/api/calendar', calendarRoutes);
app.use('/api/cache/sample', require('./routes/redisCacheSampleRoutes'));


// ── Database connection with automatic retry ──────────────────────────
const MONGO_OPTIONS = {
  dbName: 'ZYNC_USER',            // Oracle schema name = database name
  retryWrites: false,              // Oracle does not support retryable writes
  tls: true,
  tlsAllowInvalidCertificates: true, // Oracle ADB uses certs not in default CA bundle
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  autoCreate: false,
  autoIndex: false,
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectWithRetry(attempt = 1) {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    console.log(`✅ Oracle ADB Connected: ${conn.connection.host}`);
    console.log(`   Database Name: ${conn.connection.name}`);
  } catch (err) {
    console.error(`❌ Oracle ADB Connection Error (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
    if (attempt < MAX_RETRIES) {
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }
    console.error('⚠️  All DB connection attempts failed — server continues without DB.');
  }
}

connectWithRetry();

// ── Redis connection (non-blocking) ────────────────────────────────────
const { connectRedis } = require('./utils/redisClient');
connectRedis();

app.get('/', (req, res) => {
  res.send('API is running...');
});

const startServer = (port, retriesLeft = 10) => {
  const onError = (error) => {
    server.off('error', onError);

    if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
      console.warn(`⚠️ Port ${port} is in use, trying ${port + 1}...`);
      setTimeout(() => startServer(port + 1, retriesLeft - 1), 100);
      return;
    }

    console.error('Failed to start backend server:', error);
    process.exit(1);
  };

  server.once('error', onError);

  server.listen(port, '0.0.0.0', () => {
    server.off('error', onError);
    console.log(`🚀 Server successfully started on port ${port}`);
  });
};

startServer(PORT);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
