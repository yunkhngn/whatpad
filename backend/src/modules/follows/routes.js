const express = require('express');
const { sql, poolPromise } = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// POST /follows/:authorId - Follow an author
router.post('/:authorId', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('follower_id', sql.Int, req.user.id)
      .input('author_id', sql.Int, req.params.authorId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM follows WHERE follower_id = @follower_id AND author_id = @author_id)
        INSERT INTO follows (follower_id, author_id, created_at)
        VALUES (@follower_id, @author_id, GETDATE())
      `);

    res.json({ ok: true, message: 'Now following author' });
  } catch (err) {
    next(err);
  }
});

// DELETE /follows/:authorId - Unfollow an author
router.delete('/:authorId', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('follower_id', sql.Int, req.user.id)
      .input('author_id', sql.Int, req.params.authorId)
      .query('DELETE FROM follows WHERE follower_id = @follower_id AND author_id = @author_id');

    res.json({ ok: true, message: 'Unfollowed author' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
