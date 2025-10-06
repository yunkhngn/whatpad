const express = require('express');
const { sql, poolPromise } = require('../db');
const auth = require('../mw/auth');

const router = express.Router();

// GET /stories/:id/reviews - Get reviews for a story
router.get('/stories/:id/reviews', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('story_id', sql.Int, req.params.id)
      .query(`
        SELECT sr.*, u.username, u.avatar_url,
          (SELECT COUNT(*) FROM review_likes WHERE review_id = sr.id) as likes_count
        FROM story_reviews sr
        JOIN users u ON sr.user_id = u.id
        WHERE sr.story_id = @story_id
        ORDER BY sr.created_at DESC
      `);

    res.json({ ok: true, data: result.recordset });
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

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('story_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .input('rating', sql.Int, rating)
      .input('title', sql.NVarChar, title || null)
      .input('content', sql.NVarChar(2000), content || null)
      .input('is_recommended', sql.Bit, is_recommended || 0)
      .query(`
        INSERT INTO story_reviews (story_id, user_id, rating, title, content, is_recommended, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@story_id, @user_id, @rating, @title, @content, @is_recommended, GETDATE(), GETDATE())
      `);

    res.status(201).json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /reviews/:id - Delete review (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Check ownership
    const ownerCheck = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM story_reviews WHERE id = @id AND user_id = @user_id');
    
    if (ownerCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM story_reviews WHERE id = @id');

    res.json({ ok: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /reviews/:id/likes - Like a review
router.post('/:id/likes', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('review_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM review_likes WHERE review_id = @review_id AND user_id = @user_id)
        INSERT INTO review_likes (review_id, user_id, created_at)
        VALUES (@review_id, @user_id, GETDATE())
      `);

    res.json({ ok: true, message: 'Review liked' });
  } catch (err) {
    next(err);
  }
});

// DELETE /reviews/:id/likes - Unlike a review
router.delete('/:id/likes', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('review_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('DELETE FROM review_likes WHERE review_id = @review_id AND user_id = @user_id');

    res.json({ ok: true, message: 'Review unliked' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
