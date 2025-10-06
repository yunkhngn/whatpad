const express = require('express');
const { sql, poolPromise } = require('../../db');
const auth = require('../../mw/auth');
const { getPagination } = require('../../utils/paging');
const { checkStoryOwnership, getStoryWithTags } = require('./service');

const router = express.Router();

// GET /stories - List published stories with search and pagination
router.get('/', async (req, res, next) => {
  try {
    const { page, size, offset } = getPagination(req);
    const { q, tag } = req.query;
    const pool = await poolPromise;
    
    let query = `
      SELECT DISTINCT s.*, u.username as author_name
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'published'
    `;
    
    const request = pool.request();
    
    if (q) {
      query += ` AND (s.title LIKE @search OR s.description LIKE @search)`;
      request.input('search', sql.NVarChar, `%${q}%`);
    }
    
    if (tag) {
      query += `
        AND EXISTS (
          SELECT 1 FROM story_tags st
          JOIN tags t ON st.tag_id = t.id
          WHERE st.story_id = s.id AND t.name = @tag
        )
      `;
      request.input('tag', sql.NVarChar, tag);
    }
    
    query += ` ORDER BY s.created_at DESC OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY`;
    
    request.input('offset', sql.Int, offset);
    request.input('size', sql.Int, size);
    
    const result = await request.query(query);

    res.json({ ok: true, data: result.recordset, page, size });
  } catch (err) {
    next(err);
  }
});

// GET /stories/:id - Get story with tags
router.get('/:id', async (req, res, next) => {
  try {
    const story = await getStoryWithTags(req.params.id);
    
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found', errorCode: 'STORY_NOT_FOUND' });
    }

    res.json({ ok: true, data: story });
  } catch (err) {
    next(err);
  }
});

// POST /stories - Create new story (draft)
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, description, cover_url, tags } = req.body;
    
    if (!title) {
      return res.status(400).json({ ok: false, message: 'Title is required', errorCode: 'MISSING_TITLE' });
    }

    const pool = await poolPromise;
    
    // Insert story
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || null)
      .input('cover_url', sql.NVarChar, cover_url || null)
      .query(`
        INSERT INTO stories (user_id, title, description, cover_url, status, created_at)
        OUTPUT INSERTED.*
        VALUES (@user_id, @title, @description, @cover_url, 'draft', GETDATE())
      `);
    
    const story = result.recordset[0];
    
    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        // Upsert tag
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
        
        // Insert story_tag
        await pool.request()
          .input('story_id', sql.Int, story.id)
          .input('tag_id', sql.Int, tagId)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM story_tags WHERE story_id = @story_id AND tag_id = @tag_id)
            INSERT INTO story_tags (story_id, tag_id) VALUES (@story_id, @tag_id)
          `);
      }
    }

    res.status(201).json({ ok: true, data: story });
  } catch (err) {
    next(err);
  }
});

// PUT /stories/:id - Update story (owner only)
router.put('/:id', auth, async (req, res, next) => {
  try {
    const isOwner = await checkStoryOwnership(req.params.id, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const { title, description, cover_url } = req.body;
    const pool = await poolPromise;
    
    const updates = [];
    const request = pool.request().input('id', sql.Int, req.params.id);
    
    if (title) {
      updates.push('title = @title');
      request.input('title', sql.NVarChar, title);
    }
    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar, description);
    }
    if (cover_url !== undefined) {
      updates.push('cover_url = @cover_url');
      request.input('cover_url', sql.NVarChar, cover_url);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    updates.push('updated_at = GETDATE()');
    
    const result = await request.query(`
      UPDATE stories 
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    res.json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// POST /stories/:id/publish - Publish story (owner only)
router.post('/:id/publish', auth, async (req, res, next) => {
  try {
    const isOwner = await checkStoryOwnership(req.params.id, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE stories 
        SET status = 'published', updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /stories/:id - Delete story (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const isOwner = await checkStoryOwnership(req.params.id, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM stories WHERE id = @id');

    res.json({ ok: true, message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
