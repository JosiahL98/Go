import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// V-01: Require JWT_SECRET from env or generate a random one per process
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set. Using random secret — tokens will not survive restarts.');
}

// V-08: Short-lived access tokens (1 hour instead of 7 days)
export function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// V-02: JWT_SECRET is no longer exported
