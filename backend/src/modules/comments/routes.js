const express = require('express');
const { sql, poolPromise } = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /chapters/:id/comments - Get comments for a chapter
router.get('/chapters/:id/comments', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('chapter_id', sql.Int, req.params.id)
      .query(`
        SELECT c.*, u.username, u.avatar_url
        FROM story_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.chapter_id = @chapter_id
        ORDER BY c.created_at DESC
      `);

    res.json({ ok: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
});

// POST /chapters/:id/comments - Create comment (auth)
router.post('/chapters/:id/comments', auth, async (req, res, next) => {
  try {
    const { content, parent_comment_id } = req.body;
    
    if (!content) {
      return res.status(400).json({ ok: false, message: 'Content is required', errorCode: 'MISSING_CONTENT' });
    }

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('chapter_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .input('content', sql.NVarChar(1000), content)
      .input('parent_comment_id', sql.Int, parent_comment_id || null)
      .query(`
        INSERT INTO story_comments (story_id, chapter_id, user_id, content, parent_comment_id, created_at)
        OUTPUT INSERTED.*
        VALUES (
          (SELECT story_id FROM chapters WHERE id = @chapter_id),
          @chapter_id,
          @user_id,
          @content,
          @parent_comment_id,
          GETDATE()
        )
      `);

    res.status(201).json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /comments/:id - Delete comment (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM story_comments WHERE id = @id AND user_id = @user_id');
    
    if (checkResult.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM story_comments WHERE id = @id');

    res.json({ ok: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
