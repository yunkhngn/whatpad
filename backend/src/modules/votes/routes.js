const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /chapters/:id/vote/check - Check if user has voted
router.get('/chapters/:id/vote/check', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM votes WHERE chapter_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ ok: true, hasVoted: rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

// POST /chapters/:id/vote - Vote (like) a chapter
router.post('/chapters/:id/vote', auth, async (req, res, next) => {
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

// DELETE /chapters/:id/vote - Remove vote
router.delete('/chapters/:id/vote', auth, async (req, res, next) => {
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
