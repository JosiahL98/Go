import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { verifyToken } from './auth.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';
import userRoutes from './routes/users.js';
import handleConnection from './socket/gameHandler.js';

// Ensure data directory exists
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

// Import db to trigger schema creation
import './db.js';

const app = express();
const server = createServer(app);

// V-14: Configurable CORS origin
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

// V-20: Security headers
app.use(helmet());

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// V-09: Explicit JSON body size limit
app.use(express.json({ limit: '10kb' }));

// V-04: Global rate limit (100 requests per minute per IP)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}));

// V-03: Strict rate limit on auth endpoints (5 attempts per minute)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token || typeof token !== 'string') return next(new Error('Authentication required'));
  try {
    socket.user = verifyToken(token);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  handleConnection(socket, io);
});

// In production, serve the built React client
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// V-19: Global error handler — never leak stack traces
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Go server running on http://localhost:${PORT}`);
});
