const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /me/reading-history - Get reading history
router.get('/me/reading-history', auth, async (req, res, next) => {
  try {
    const { story_id } = req.query;
    
    let query = `
      SELECT rh.*, s.title as story_title, c.title as chapter_title
      FROM reading_history rh
      JOIN stories s ON rh.story_id = s.id
      LEFT JOIN chapters c ON rh.last_chapter_id = c.id
      WHERE rh.user_id = ?
    `;
    
    const params = [req.user.id];
    
    if (story_id) {
      query += ' AND rh.story_id = ?';
      params.push(story_id);
    }
    
    query += ' ORDER BY rh.updated_at DESC';
    
    const [rows] = await pool.query(query, params);

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /reading-history - Update reading progress (upsert)
router.post('/', auth, async (req, res, next) => {
  try {
    const { story_id, last_chapter_id } = req.body;
    
    if (!story_id || !last_chapter_id) {
      return res.status(400).json({ ok: false, message: 'story_id and last_chapter_id are required', errorCode: 'MISSING_FIELDS' });
    }
    
    await pool.query(
      `INSERT INTO reading_history (user_id, story_id, last_chapter_id, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_chapter_id = ?, updated_at = NOW()`,
      [req.user.id, story_id, last_chapter_id, last_chapter_id]
    );

    res.json({ ok: true, message: 'Reading progress updated' });
  } catch (err) {
    next(err);
  }
});

// POST /followed-stories/:storyId - Follow a story
router.post('/followed-stories/:storyId', auth, async (req, res, next) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO followed_stories (user_id, story_id, created_at) VALUES (?, ?, NOW())',
      [req.user.id, req.params.storyId]
    );

    res.json({ ok: true, message: 'Story followed' });
  } catch (err) {
    next(err);
  }
});

// DELETE /followed-stories/:storyId - Unfollow a story
router.delete('/followed-stories/:storyId', auth, async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM followed_stories WHERE user_id = ? AND story_id = ?',
      [req.user.id, req.params.storyId]
    );

    res.json({ ok: true, message: 'Story unfollowed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
