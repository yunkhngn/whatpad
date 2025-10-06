const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /stories/:id/reviews - Get reviews for a story
router.get('/stories/:id/reviews', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT sr.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM review_likes WHERE review_id = sr.id) as likes_count
      FROM story_reviews sr
      JOIN users u ON sr.user_id = u.id
      WHERE sr.story_id = ?
      ORDER BY sr.created_at DESC
    `, [req.params.id]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /stories/:id/reviews - Create review
router.post('/stories/:id/reviews', auth, async (req, res, next) => {
  try {
    const { rating, title, content, is_recommended } = req.body;
    
    if (!rating) {
      return res.status(400).json({ ok: false, message: 'Rating is required', errorCode: 'MISSING_RATING' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO story_reviews (story_id, user_id, rating, title, content, is_recommended, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [req.params.id, req.user.id, rating, title || null, content || null, is_recommended || 0]
    );
    
    const [reviews] = await pool.query('SELECT * FROM story_reviews WHERE id = ?', [result.insertId]);

    res.status(201).json({ ok: true, data: reviews[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /reviews/:id - Delete review (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    // Check ownership
    const [ownerCheck] = await pool.query(
      'SELECT id FROM story_reviews WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.query('DELETE FROM story_reviews WHERE id = ?', [req.params.id]);

    res.json({ ok: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /reviews/:id/likes - Like a review
router.post('/:id/likes', auth, async (req, res, next) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO review_likes (review_id, user_id, created_at) VALUES (?, ?, NOW())',
      [req.params.id, req.user.id]
    );

    res.json({ ok: true, message: 'Review liked' });
  } catch (err) {
    next(err);
  }
});

// DELETE /reviews/:id/likes - Unlike a review
router.delete('/:id/likes', auth, async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM review_likes WHERE review_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ ok: true, message: 'Review unliked' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
