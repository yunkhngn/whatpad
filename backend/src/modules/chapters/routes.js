const express = require('express');
const { sql, poolPromise } = require('../db');
const auth = require('../mw/auth');
const { checkChapterOwnership, checkStoryOwnershipByStoryId } = require('./service');

const router = express.Router();

// GET /stories/:storyId/chapters - List chapters for a story
router.get('/stories/:storyId/chapters', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const storyId = req.params.storyId;
    
    // Check if user is the author
    let isAuthor = false;
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
        
        const authorCheck = await pool.request()
          .input('story_id', sql.Int, storyId)
          .input('user_id', sql.Int, decoded.id)
          .query('SELECT id FROM stories WHERE id = @story_id AND user_id = @user_id');
        
        isAuthor = authorCheck.recordset.length > 0;
      } catch (err) {
        // Token invalid, continue as guest
      }
    }
    
    let query = `
      SELECT id, story_id, title, content, chapter_order, is_published, created_at, updated_at
      FROM chapters
      WHERE story_id = @story_id
    `;
    
    if (!isAuthor) {
      query += ' AND is_published = 1';
    }
    
    query += ' ORDER BY chapter_order ASC';
    
    const result = await pool.request()
      .input('story_id', sql.Int, storyId)
      .query(query);

    res.json({ ok: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
});

// GET /chapters/:id - Get single chapter
router.get('/:id', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM chapters WHERE id = @id');
    
    const chapter = result.recordset[0];
    
    if (!chapter) {
      return res.status(404).json({ ok: false, message: 'Chapter not found', errorCode: 'CHAPTER_NOT_FOUND' });
    }

    res.json({ ok: true, data: chapter });
  } catch (err) {
    next(err);
  }
});

// POST /chapters - Create chapter (owner of story only)
router.post('/', auth, async (req, res, next) => {
  try {
    const { story_id, title, content, chapter_order, is_published } = req.body;
    
    if (!story_id || !title || !content) {
      return res.status(400).json({ ok: false, message: 'Missing required fields', errorCode: 'MISSING_FIELDS' });
    }

    const isOwner = await checkStoryOwnershipByStoryId(story_id, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('story_id', sql.Int, story_id)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('chapter_order', sql.Int, chapter_order || 1)
      .input('is_published', sql.Bit, is_published || 0)
      .query(`
        INSERT INTO chapters (story_id, title, content, chapter_order, is_published, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@story_id, @title, @content, @chapter_order, @is_published, GETDATE(), GETDATE())
      `);

    res.status(201).json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /chapters/:id - Update chapter (owner only)
router.put('/:id', auth, async (req, res, next) => {
  try {
    const isOwner = await checkChapterOwnership(req.params.id, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const { title, content, chapter_order, is_published } = req.body;
    const pool = await poolPromise;
    
    const updates = [];
    const request = pool.request().input('id', sql.Int, req.params.id);
    
    if (title) {
      updates.push('title = @title');
      request.input('title', sql.NVarChar, title);
    }
    if (content) {
      updates.push('content = @content');
      request.input('content', sql.NVarChar(sql.MAX), content);
    }
    if (chapter_order !== undefined) {
      updates.push('chapter_order = @chapter_order');
      request.input('chapter_order', sql.Int, chapter_order);
    }
    if (is_published !== undefined) {
      updates.push('is_published = @is_published');
      request.input('is_published', sql.Bit, is_published);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    updates.push('updated_at = GETDATE()');
    
    const result = await request.query(`
      UPDATE chapters 
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    res.json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /chapters/:id - Delete chapter (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const isOwner = await checkChapterOwnership(req.params.id, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM chapters WHERE id = @id');

    res.json({ ok: true, message: 'Chapter deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
