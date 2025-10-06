const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// POST /follows/:authorId - Follow an author
router.post('/:authorId', auth, async (req, res, next) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO follows (follower_id, author_id, created_at) VALUES (?, ?, NOW())',
      [req.user.id, req.params.authorId]
    );

    res.json({ ok: true, message: 'Now following author' });
  } catch (err) {
    next(err);
  }
});

// DELETE /follows/:authorId - Unfollow an author
router.delete('/:authorId', auth, async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND author_id = ?',
      [req.user.id, req.params.authorId]
    );

    res.json({ ok: true, message: 'Unfollowed author' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
