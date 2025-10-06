const express = require('express');
const { sql, poolPromise } = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// POST /chapters/:id/vote - Vote (like) a chapter
router.post('/chapters/:id/vote', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('chapter_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM votes WHERE chapter_id = @chapter_id AND user_id = @user_id)
        INSERT INTO votes (chapter_id, user_id, created_at)
        VALUES (@chapter_id, @user_id, GETDATE())
      `);

    res.json({ ok: true, message: 'Vote recorded' });
  } catch (err) {
    next(err);
  }
});

// DELETE /chapters/:id/vote - Remove vote
router.delete('/chapters/:id/vote', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('chapter_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('DELETE FROM votes WHERE chapter_id = @chapter_id AND user_id = @user_id');

    res.json({ ok: true, message: 'Vote removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
