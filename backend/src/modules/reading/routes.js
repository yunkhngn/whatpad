const express = require('express');
const { sql, poolPromise } = require('../db');
const auth = require('../mw/auth');

const router = express.Router();

// GET /me/reading-history - Get reading history
router.get('/me/reading-history', auth, async (req, res, next) => {
  try {
    const { story_id } = req.query;
    const pool = await poolPromise;
    
    let query = `
      SELECT rh.*, s.title as story_title, c.title as chapter_title
      FROM reading_history rh
      JOIN stories s ON rh.story_id = s.id
      LEFT JOIN chapters c ON rh.last_chapter_id = c.id
      WHERE rh.user_id = @user_id
    `;
    
    const request = pool.request().input('user_id', sql.Int, req.user.id);
    
    if (story_id) {
      query += ' AND rh.story_id = @story_id';
      request.input('story_id', sql.Int, story_id);
    }
    
    query += ' ORDER BY rh.updated_at DESC';
    
    const result = await request.query(query);

    res.json({ ok: true, data: result.recordset });
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

    const pool = await poolPromise;
    
    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('story_id', sql.Int, story_id)
      .input('last_chapter_id', sql.Int, last_chapter_id)
      .query(`
        MERGE reading_history AS target
        USING (SELECT @user_id AS user_id, @story_id AS story_id) AS source
        ON target.user_id = source.user_id AND target.story_id = source.story_id
        WHEN MATCHED THEN
          UPDATE SET last_chapter_id = @last_chapter_id, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, story_id, last_chapter_id, updated_at)
          VALUES (@user_id, @story_id, @last_chapter_id, GETDATE());
      `);

    res.json({ ok: true, message: 'Reading progress updated' });
  } catch (err) {
    next(err);
  }
});

// POST /followed-stories/:storyId - Follow a story
router.post('/followed-stories/:storyId', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('story_id', sql.Int, req.params.storyId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM followed_stories WHERE user_id = @user_id AND story_id = @story_id)
        INSERT INTO followed_stories (user_id, story_id, created_at)
        VALUES (@user_id, @story_id, GETDATE())
      `);

    res.json({ ok: true, message: 'Story followed' });
  } catch (err) {
    next(err);
  }
});

// DELETE /followed-stories/:storyId - Unfollow a story
router.delete('/followed-stories/:storyId', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('story_id', sql.Int, req.params.storyId)
      .query('DELETE FROM followed_stories WHERE user_id = @user_id AND story_id = @story_id');

    res.json({ ok: true, message: 'Story unfollowed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
