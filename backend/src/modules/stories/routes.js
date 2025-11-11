const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');
const { getPagination } = require('../../utils/paging');
const { checkStoryOwnership, getStoryWithTags } = require('./service');

const router = express.Router();

// GET /stories - List published stories with search and pagination
router.get('/', async (req, res, next) => {
  try {
    const { page, size, offset } = getPagination(req);
    const { q, tag, sort = 'created_at', order = 'desc' } = req.query;
    
    // Validate sort field
    const validSortFields = ['created_at', 'updated_at', 'title'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    
    // Validate order
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    let query = `
      SELECT DISTINCT s.*, u.username as author_name,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count,
        (SELECT COUNT(*) FROM votes v 
         JOIN chapters c ON v.chapter_id = c.id 
         WHERE c.story_id = s.id) as vote_count,
        (SELECT COUNT(*) FROM story_reads WHERE story_id = s.id) as read_count
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'published'
    `;
    
    const params = [];
    
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
    
    query += ` ORDER BY s.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
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

// GET /stories/:id/chapters - List chapters for a story
router.get('/:id/chapters', async (req, res, next) => {
  try {
    const storyId = req.params.id;
    
    // Check if user is the author
    let isAuthor = false;
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
        
        const [authorCheck] = await pool.query(
          'SELECT id FROM stories WHERE id = ? AND user_id = ?',
          [storyId, decoded.id]
        );
        
        isAuthor = authorCheck.length > 0;
      } catch (err) {
        // Token invalid, continue as guest
      }
    }
    
    let query = `
      SELECT id, story_id, title, content, chapter_order, is_published, created_at, updated_at
      FROM chapters
      WHERE story_id = ?
    `;
    
    if (!isAuthor) {
      query += ' AND is_published = 1';
    }
    
    query += ' ORDER BY chapter_order ASC';
    
    const [rows] = await pool.query(query, [storyId]);

    res.json({ ok: true, data: rows });
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
      for (const tagId of tags) {
        // Verify tag exists
        const [tagRows] = await pool.query('SELECT id FROM tags WHERE id = ?', [tagId]);
        
        if (tagRows.length > 0) {
          // Insert story_tag
          await pool.query(
            'INSERT IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)',
            [story.id, tagId]
          );
        }
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

    const { title, description, cover_url, status, tags } = req.body;
    
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
    if (status) {
      // Only allow 'draft' or 'published' status
      if (!['draft', 'published'].includes(status)) {
        return res.status(400).json({ 
          ok: false, 
          message: 'Invalid status value. Must be "draft" or "published"',
          errorCode: 'INVALID_STATUS' 
        });
      }
      updates.push('status = ?');
      values.push(status);
    }
    
    if (updates.length === 0 && !tags) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    // Start a transaction if we have tag updates
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(req.params.id);
        
        await connection.query(
          `UPDATE stories SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
        
        // If story status is being changed, update all chapters accordingly
        if (status) {
          const publishStatus = status === 'published' ? 1 : 0;
          await connection.query(
            `UPDATE chapters SET is_published = ?, updated_at = NOW() WHERE story_id = ?`,
            [publishStatus, req.params.id]
          );
          console.log(`✅ Auto-${status === 'published' ? 'published' : 'unpublished'} all chapters of story ${req.params.id}`);
        }
      }

      // Handle tags update if provided
      if (tags && Array.isArray(tags)) {
        // First remove all existing tags
        await connection.query('DELETE FROM story_tags WHERE story_id = ?', [req.params.id]);
        
        // Then add new tags
        for (const tagName of tags) {
          // Upsert tag
          await connection.query(
            'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name',
            [tagName]
          );
          
          const [tagRows] = await connection.query('SELECT id FROM tags WHERE name = ?', [tagName]);
          const tagId = tagRows[0].id;
          
          // Insert story_tag
          await connection.query(
            'INSERT IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)',
            [req.params.id, tagId]
          );
        }
      }

      await connection.commit();

      // Get updated story with tags
      const story = await getStoryWithTags(req.params.id);
      res.json({ ok: true, data: story });
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
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
    
    // Publish the story
    await pool.query(
      `UPDATE stories SET status = 'published', updated_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    
    // Also publish all chapters
    await pool.query(
      `UPDATE chapters SET is_published = 1, updated_at = NOW() WHERE story_id = ?`,
      [req.params.id]
    );
    
    console.log(`✅ Published story ${req.params.id} and all its chapters`);
    
    const [stories] = await pool.query('SELECT * FROM stories WHERE id = ?', [req.params.id]);

    res.json({ ok: true, data: stories[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /stories/:id - Delete story (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    const isOwner = await checkStoryOwnership(req.params.id, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }
    
    await connection.beginTransaction();
    
    // Delete all chapters associated with the story first
    await connection.query('DELETE FROM chapters WHERE story_id = ?', [req.params.id]);
    
    // Then delete the story
    await connection.query('DELETE FROM stories WHERE id = ?', [req.params.id]);
    
    await connection.commit();

    res.json({ ok: true, message: 'Story deleted' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

module.exports = router;
