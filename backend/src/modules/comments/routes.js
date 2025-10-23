const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /comments/story/:id - Get all comments for a story (from all chapters)
router.get('/story/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.username, u.avatar_url, ch.title as chapter_title, ch.chapter_order
      FROM story_comments c
      JOIN users u ON c.user_id = u.id
      JOIN chapters ch ON c.chapter_id = ch.id
      WHERE ch.story_id = ?
      ORDER BY c.created_at DESC
      LIMIT 50
    `, [req.params.id]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /comments/chapter/:id - Get comments for a chapter
router.get('/chapter/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.username, u.avatar_url
      FROM story_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.chapter_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /comments/chapter/:id - Create comment (auth)
router.post('/chapter/:id', auth, async (req, res, next) => {
  try {
    const { content, parent_comment_id } = req.body;
    
    if (!content) {
      return res.status(400).json({ ok: false, message: 'Content is required', errorCode: 'MISSING_CONTENT' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO story_comments (story_id, chapter_id, user_id, content, parent_comment_id, created_at)
       VALUES ((SELECT story_id FROM chapters WHERE id = ?), ?, ?, ?, ?, NOW())`,
      [req.params.id, req.params.id, req.user.id, content, parent_comment_id || null]
    );
    
    const [comments] = await pool.query('SELECT * FROM story_comments WHERE id = ?', [result.insertId]);

    res.status(201).json({ ok: true, data: comments[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /comments/:id - Delete comment (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    // Check ownership
    const [checkRows] = await pool.query(
      'SELECT id FROM story_comments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (checkRows.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.query('DELETE FROM story_comments WHERE id = ?', [req.params.id]);

    res.json({ ok: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
