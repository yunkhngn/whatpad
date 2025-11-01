const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');
const { getPagination } = require('../../utils/paging');
const { checkStoryOwnership, getStoryWithTags } = require('./service');

const router = express.Router();

// GET /stories - List stories with search and pagination
router.get('/', async (req, res, next) => {
  try {
    const { page, size, offset } = getPagination(req);
    const { q, tag, user_id, status } = req.query;
    
    let query = `
      SELECT DISTINCT s.*, u.username as author_name,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by user_id if provided
    if (user_id) {
      query += ` AND s.user_id = ?`;
      params.push(user_id);
    } else {
      // Only show published stories if not filtering by user
      query += ` AND s.status = 'published'`;
    }
    
    // Filter by status if provided (useful for user's own stories)
    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    
    if (q) {
      query += ` AND (s.title LIKE ? OR s.description LIKE ? OR u.username LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    
    if (tag) {
      query += `
        AND EXISTS (
          SELECT 1 FROM story_tags st
          JOIN tags t ON st.tag_id = t.id
          WHERE st.story_id = s.id AND t.name = ?
        )
      `;
      params.push(tag);
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
    params.push(size, offset);
    
    const [rows] = await pool.query(query, params);

    // Fetch tags for each story
    for (const story of rows) {
      const [tags] = await pool.query(`
        SELECT t.id, t.name 
        FROM tags t
        JOIN story_tags st ON t.id = st.tag_id
        WHERE st.story_id = ?
      `, [story.id]);
      story.tags = tags;
    }

    res.json({ ok: true, stories: rows, page, size });
  } catch (err) {
    next(err);
  }
});

// GET /users/:userId/stories - Get stories by user (nested route)
router.get('/users/:userId/stories', async (req, res, next) => {
  try {
    const { page, size, offset } = getPagination(req);
    const { status } = req.query;
    const userId = req.params.userId;
    
    let query = `
      SELECT s.*, u.username as author_name,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;
    
    const params = [userId];
    
    // Filter by status if provided
    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
    params.push(size, offset);
    
    const [rows] = await pool.query(query, params);

    // Fetch tags for each story
    for (const story of rows) {
      const [tags] = await pool.query(`
        SELECT t.id, t.name 
        FROM tags t
        JOIN story_tags st ON t.id = st.tag_id
        WHERE st.story_id = ?
      `, [story.id]);
      story.tags = tags;
    }

    res.json({ ok: true, stories: rows, page, size, user_id: userId });
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
    
    // Insert story
    const [result] = await pool.query(
      `INSERT INTO stories (user_id, title, description, cover_url, status, created_at)
       VALUES (?, ?, ?, ?, 'draft', NOW())`,
      [req.user.id, title, description || null, cover_url || null]
    );
    
    const [stories] = await pool.query('SELECT * FROM stories WHERE id = ?', [result.insertId]);
    const story = stories[0];
    
    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        // Upsert tag
        await pool.query(
          'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name',
          [tagName]
        );
        
        const [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [tagName]);
        const tagId = tagRows[0].id;
        
        // Insert story_tag
        await pool.query(
          'INSERT IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)',
          [story.id, tagId]
        );
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
    
    const updates = [];
    const values = [];
    
    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (cover_url !== undefined) {
      updates.push('cover_url = ?');
      values.push(cover_url);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    updates.push('updated_at = NOW()');
    values.push(req.params.id);
    
    await pool.query(
      `UPDATE stories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [stories] = await pool.query('SELECT * FROM stories WHERE id = ?', [req.params.id]);

    res.json({ ok: true, data: stories[0] });
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
    
    await pool.query(
      `UPDATE stories SET status = 'published', updated_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    
    const [stories] = await pool.query('SELECT * FROM stories WHERE id = ?', [req.params.id]);

    res.json({ ok: true, data: stories[0] });
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
    
    await pool.query('DELETE FROM stories WHERE id = ?', [req.params.id]);

    res.json({ ok: true, message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
