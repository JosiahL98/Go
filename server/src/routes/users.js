import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  const user = await db.get(
    'SELECT id, username, wins, losses, created_at FROM users WHERE id = $1',
    [id]
  );

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
