const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /users/:id - Get user profile
router.get('/:id', async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found', errorCode: 'USER_NOT_FOUND' });
    }

    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /me - Update own profile
router.put('/me', auth, async (req, res, next) => {
  try {
    const { username, bio, avatar_url } = req.body;
    
    const updates = [];
    const values = [];
    
    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    values.push(req.user.id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [users] = await pool.query(
      'SELECT id, username, email, bio, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ ok: true, data: users[0] });
  } catch (err) {
    next(err);
  }
});

// GET /users/:id/followers
router.get('/:id/followers', async (req, res, next) => {
  try {    
    const [followers] = await pool.query(`
      SELECT u.id, u.username, u.avatar_url, f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.author_id = ?
      ORDER BY f.created_at DESC
    `, [req.params.id]);

    res.json({ ok: true, data: followers });
  } catch (err) {
    next(err);
  }
});

// GET /users/:id/following
router.get('/:id/following', async (req, res, next) => {
  try {    
    const [following] = await pool.query(`
      SELECT u.id, u.username, u.avatar_url, f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.author_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `, [req.params.id]);

    res.json({ ok: true, data: following });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
