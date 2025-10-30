const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /votes/chapter/:id - Check if user has voted
router.get('/chapter/:id', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT chapter_id, user_id FROM votes WHERE chapter_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ ok: true, hasVoted: rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

// POST /votes/chapter/:id - Vote (like) a chapter
router.post('/chapter/:id', auth, async (req, res, next) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO votes (chapter_id, user_id, created_at) VALUES (?, ?, NOW())',
      [req.params.id, req.user.id]
    );

    res.json({ ok: true, message: 'Vote recorded' });
  } catch (err) {
    next(err);
  }
});

// DELETE /votes/chapter/:id - Remove vote
router.delete('/chapter/:id', auth, async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM votes WHERE chapter_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ ok: true, message: 'Vote removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
