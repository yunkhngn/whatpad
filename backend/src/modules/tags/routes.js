const express = require('express');
const { sql, poolPromise } = require('../db');
const auth = require('../mw/auth');
const { slugify } = require('../utils/slugify');

const router = express.Router();

// GET /tags - Get all tags
router.get('/', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query('SELECT id, name FROM tags ORDER BY name ASC');

    res.json({ ok: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
});

// POST /tags - Create tag (auth, admin stub)
router.post('/', auth, async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ ok: false, message: 'Name is required', errorCode: 'MISSING_NAME' });
    }

    const slug = slugify(name);
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('name', sql.NVarChar, slug)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM tags WHERE name = @name)
        INSERT INTO tags (name) OUTPUT INSERTED.* VALUES (@name)
        ELSE
        SELECT * FROM tags WHERE name = @name
      `);

    res.status(201).json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// POST /stories/:id/tags - Add tags to story (owner only)
router.post('/stories/:id/tags', auth, async (req, res, next) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ ok: false, message: 'Tags must be an array', errorCode: 'INVALID_TAGS' });
    }

    const pool = await poolPromise;
    
    // Check ownership
    const ownerCheck = await pool.request()
      .input('story_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM stories WHERE id = @story_id AND user_id = @user_id');
    
    if (ownerCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    // Upsert tags
    for (const tagName of tags) {
      const tagResult = await pool.request()
        .input('name', sql.NVarChar, tagName)
        .query(`
          MERGE tags AS target
          USING (SELECT @name AS name) AS source
          ON target.name = source.name
          WHEN NOT MATCHED THEN
            INSERT (name) VALUES (@name)
          OUTPUT INSERTED.id;
        `);
      
      const tagId = tagResult.recordset[0].id;
      
      await pool.request()
        .input('story_id', sql.Int, req.params.id)
        .input('tag_id', sql.Int, tagId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM story_tags WHERE story_id = @story_id AND tag_id = @tag_id)
          INSERT INTO story_tags (story_id, tag_id) VALUES (@story_id, @tag_id)
        `);
    }

    res.json({ ok: true, message: 'Tags added' });
  } catch (err) {
    next(err);
  }
});

// DELETE /stories/:id/tags/:tagId - Remove tag from story (owner only)
router.delete('/stories/:id/tags/:tagId', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Check ownership
    const ownerCheck = await pool.request()
      .input('story_id', sql.Int, req.params.id)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM stories WHERE id = @story_id AND user_id = @user_id');
    
    if (ownerCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.request()
      .input('story_id', sql.Int, req.params.id)
      .input('tag_id', sql.Int, req.params.tagId)
      .query('DELETE FROM story_tags WHERE story_id = @story_id AND tag_id = @tag_id');

    res.json({ ok: true, message: 'Tag removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
