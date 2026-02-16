import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken } from '../auth.js';

const router = Router();

// V-10: Only allow safe username characters
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, _ -)' });
    }
    // V-07: Stronger password policy; NEW-01: cap at 72 (bcrypt max)
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: 'Password must be 8-72 characters' });
    }

    const existing = db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
    const user = { id: result.lastInsertRowid, username };
    const token = generateToken(user);

    res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    // V-18: Log internally but never expose details
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    // NEW-01: Reject oversized passwords before bcrypt.compare
    if (password.length > 72) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
