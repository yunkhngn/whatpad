const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');
const { slugify } = require('../../utils/slugify');

const router = express.Router();

// POST /stories/:id/tags - Add tags to story (owner only)
router.post('/stories/:id/tags', auth, async (req, res, next) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ ok: false, message: 'Tags must be an array', errorCode: 'INVALID_TAGS' });
    }
    
    // Check ownership
    const [ownerCheck] = await pool.query(
      'SELECT id FROM stories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    // Upsert tags
    for (const tagName of tags) {
      const slug = slugify(tagName);
      await pool.query(
        'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name',
        [slug]
      );
      
      const [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [slug]);
      const tagId = tagRows[0].id;
      
      await pool.query(
        'INSERT IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)',
        [req.params.id, tagId]
      );
    }

    res.json({ ok: true, message: 'Tags added' });
  } catch (err) {
    next(err);
  }
});

// DELETE /stories/:id/tags/:tagId - Remove tag from story (owner only)
router.delete('/stories/:id/tags/:tagId', auth, async (req, res, next) => {
  try {
    // Check ownership
    const [ownerCheck] = await pool.query(
      'SELECT id FROM stories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.query(
      'DELETE FROM story_tags WHERE story_id = ? AND tag_id = ?',
      [req.params.id, req.params.tagId]
    );

    res.json({ ok: true, message: 'Tag removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
