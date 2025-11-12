const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /me/reading-history - Get reading history
router.get('/me/reading-history', auth, async (req, res, next) => {
  try {
    const { story_id } = req.query;
    
    // Get the most recent reading record for each unique story
    let query = `
      SELECT 
        rh.*,
        s.id as story_id,
        s.title as story_title,
        s.description as story_description,
        s.cover_url as story_cover_url,
        s.status as story_status,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count,
        (SELECT COUNT(*) FROM votes v 
         JOIN chapters ch ON v.chapter_id = ch.id 
         WHERE ch.story_id = s.id) as vote_count,
        (SELECT COUNT(*) FROM story_reads WHERE story_id = s.id) as read_count,
        c.id as chapter_id,
        c.title as chapter_title,
        c.chapter_order,
        u.username as author_username,
        u.id as author_id
      FROM reading_history rh
      INNER JOIN (
        SELECT story_id, MAX(updated_at) as max_updated
        FROM reading_history
        WHERE user_id = ?
        GROUP BY story_id
      ) latest ON rh.story_id = latest.story_id AND rh.updated_at = latest.max_updated
      JOIN stories s ON rh.story_id = s.id
      LEFT JOIN chapters c ON rh.last_chapter_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE rh.user_id = ?
    `;
    
    const params = [req.user.id, req.user.id];
    
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
    
    // Update reading history
    await pool.query(
      `INSERT INTO reading_history (user_id, story_id, last_chapter_id, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_chapter_id = ?, updated_at = NOW()`,
      [req.user.id, story_id, last_chapter_id, last_chapter_id]
    );

    // Also record in story_reads for analytics (read count)
    await pool.query(
      `INSERT INTO story_reads (user_id, story_id, chapter_id, created_at)
       VALUES (?, ?, ?, NOW())`,
      [req.user.id, story_id, last_chapter_id]
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

// GET /followed-stories/:storyId/check - Check if current user follows a story
router.get('/followed-stories/:storyId/check', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT 1 FROM followed_stories WHERE user_id = ? AND story_id = ?',
      [req.user.id, req.params.storyId]
    );

    res.json({ ok: true, isFollowing: rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

// GET /followed-stories - Get all stories followed by current user
// GET /followed-stories - Get all stories followed by current user
router.get('/followed-stories', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        s.id,
        s.title,
        s.description,
        s.cover_url,
        s.status,
        s.created_at,
        s.updated_at,
        u.id as user_id,
        u.username as author_name,
        u.avatar_url as author_avatar,
        fs.created_at as followed_at,
        COUNT(DISTINCT c.id) as chapter_count,
        COUNT(DISTINCT v.user_id) as vote_count,
        COUNT(DISTINCT sr.id) as read_count
      FROM followed_stories fs
      INNER JOIN stories s ON fs.story_id = s.id
      INNER JOIN users u ON s.user_id = u.id
      LEFT JOIN chapters c ON s.id = c.story_id AND c.is_published = 1
      LEFT JOIN votes v ON c.id = v.chapter_id
      LEFT JOIN story_reads sr ON s.id = sr.story_id
      WHERE fs.user_id = ?
      GROUP BY s.id, fs.created_at
      ORDER BY fs.created_at DESC`,
      [req.user.id]
    );

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
