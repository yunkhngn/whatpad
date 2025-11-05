const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');
const { optionalAuth } = require('../../mw/auth');

const router = express.Router();

// GET /users/:userId/reading-lists - Get user's reading lists
router.get('/users/:userId/reading-lists', optionalAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // If requesting own lists, show all; if requesting others', show only public
    let query = `
      SELECT 
        rl.id,
        rl.user_id,
        rl.name,
        rl.description,
        rl.is_public,
        rl.created_at,
        rl.updated_at,
        COUNT(rls.id) as story_count
      FROM reading_lists rl
      LEFT JOIN reading_list_stories rls ON rl.id = rls.reading_list_id
      WHERE rl.user_id = ?
    `;
    
    const params = [userId];
    
    // Only show public lists if viewing someone else's profile
    if (!req.user || req.user.id != userId) {
      query += ' AND rl.is_public = 1';
    }
    
    query += ' GROUP BY rl.id ORDER BY rl.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /reading-lists - Create new reading list
router.post('/reading-lists', auth, async (req, res, next) => {
  try {
    const { name, description, is_public } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        ok: false, 
        message: 'List name is required', 
        errorCode: 'MISSING_NAME' 
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO reading_lists (user_id, name, description, is_public, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [req.user.id, name.trim(), description || null, is_public ? 1 : 0]
    );
    
    const [newList] = await pool.query(
      `SELECT 
        id, user_id, name, description, is_public, created_at, updated_at,
        0 as story_count
       FROM reading_lists 
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(newList[0]);
  } catch (err) {
    next(err);
  }
});

// GET /reading-lists/:listId/thumbnails - Get up to 3 story thumbnails for a reading list
// NOTE: This MUST come before /reading-lists/:listId/stories to avoid route conflicts
router.get('/reading-lists/:listId/thumbnails', optionalAuth, async (req, res, next) => {
  try {
    const { listId } = req.params;
    
    // Check if list exists and is accessible
    const [lists] = await pool.query(
      'SELECT id, user_id, is_public FROM reading_lists WHERE id = ?',
      [listId]
    );
    
    if (lists.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Reading list not found', 
        errorCode: 'LIST_NOT_FOUND' 
      });
    }
    
    const list = lists[0];
    
    // Check if user can access this list
    if (!list.is_public && (!req.user || req.user.id != list.user_id)) {
      return res.status(403).json({ 
        ok: false, 
        message: 'This list is private', 
        errorCode: 'PRIVATE_LIST' 
      });
    }
    
    // Get up to 3 story thumbnails
    const [thumbnails] = await pool.query(
      `SELECT 
        s.id,
        s.cover_url
      FROM reading_list_stories rls
      INNER JOIN stories s ON rls.story_id = s.id
      WHERE rls.reading_list_id = ?
      ORDER BY rls.display_order ASC, rls.added_at DESC
      LIMIT 3`,
      [listId]
    );

    res.json(thumbnails);
  } catch (err) {
    next(err);
  }
});

// GET /reading-lists/:listId/stories - Get stories in a reading list
router.get('/reading-lists/:listId/stories', optionalAuth, async (req, res, next) => {
  try {
    const { listId } = req.params;
    
    console.log(`Fetching stories for list ${listId}`);
    console.log('User:', req.user);
    
    // Check if list exists and is accessible
    const [lists] = await pool.query(
      'SELECT id, user_id, is_public FROM reading_lists WHERE id = ?',
      [listId]
    );
    
    console.log('List found:', lists[0]);
    
    if (lists.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Reading list not found', 
        errorCode: 'LIST_NOT_FOUND' 
      });
    }
    
    const list = lists[0];
    
    // Check if user can access this list
    if (!list.is_public && (!req.user || req.user.id != list.user_id)) {
      return res.status(403).json({ 
        ok: false, 
        message: 'This list is private', 
        errorCode: 'PRIVATE_LIST' 
      });
    }
    
    // Get stories in the list
    const [stories] = await pool.query(
      `SELECT 
        s.id,
        s.title,
        s.description,
        s.cover_url,
        s.status,
        s.created_at,
        s.updated_at,
        u.id as author_id,
        u.username as author_name,
        u.avatar_url as author_avatar,
        rls.added_at,
        rls.display_order,
        COUNT(DISTINCT c.id) as chapter_count,
        COUNT(DISTINCT sr.id) as review_count,
        COALESCE(AVG(sr.rating), 0) as avg_rating,
        COUNT(DISTINCT v.user_id) as vote_count,
        COUNT(DISTINCT srr.id) as read_count
      FROM reading_list_stories rls
      INNER JOIN stories s ON rls.story_id = s.id
      INNER JOIN users u ON s.user_id = u.id
      LEFT JOIN chapters c ON s.id = c.story_id AND c.is_published = 1
      LEFT JOIN story_reviews sr ON s.id = sr.story_id
      LEFT JOIN votes v ON c.id = v.chapter_id
      LEFT JOIN story_reads srr ON s.id = srr.story_id
      WHERE rls.reading_list_id = ?
      GROUP BY s.id, rls.id
      ORDER BY rls.display_order ASC, rls.added_at DESC`,
      [listId]
    );

    res.json(stories);
  } catch (err) {
    next(err);
  }
});

// POST /reading-lists/:listId/stories - Add story to reading list
router.post('/reading-lists/:listId/stories', auth, async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { story_id } = req.body;
    
    if (!story_id) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Story ID is required', 
        errorCode: 'MISSING_STORY_ID' 
      });
    }
    
    // Check list ownership
    const [lists] = await pool.query(
      'SELECT id, user_id FROM reading_lists WHERE id = ? AND user_id = ?',
      [listId, req.user.id]
    );
    
    if (lists.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Not authorized or list not found', 
        errorCode: 'NOT_AUTHORIZED' 
      });
    }
    
    // Check if story exists
    const [stories] = await pool.query('SELECT id FROM stories WHERE id = ?', [story_id]);
    
    if (stories.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Story not found', 
        errorCode: 'STORY_NOT_FOUND' 
      });
    }
    
    // Add story to list (ignore if already exists)
    try {
      await pool.query(
        `INSERT INTO reading_list_stories (reading_list_id, story_id, added_at) 
         VALUES (?, ?, NOW())`,
        [listId, story_id]
      );
      
      res.status(201).json({ 
        ok: true, 
        message: 'Story added to reading list' 
      });
    } catch (err) {
      // If duplicate key error, story already in list
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          ok: false, 
          message: 'Story already in this reading list', 
          errorCode: 'ALREADY_ADDED' 
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /reading-lists/:listId/stories/:storyId - Remove story from reading list
router.delete('/reading-lists/:listId/stories/:storyId', auth, async (req, res, next) => {
  try {
    const { listId, storyId } = req.params;
    
    // Check list ownership
    const [lists] = await pool.query(
      'SELECT id FROM reading_lists WHERE id = ? AND user_id = ?',
      [listId, req.user.id]
    );
    
    if (lists.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Not authorized or list not found', 
        errorCode: 'NOT_AUTHORIZED' 
      });
    }
    
    await pool.query(
      'DELETE FROM reading_list_stories WHERE reading_list_id = ? AND story_id = ?',
      [listId, storyId]
    );
    
    res.json({ 
      ok: true, 
      message: 'Story removed from reading list' 
    });
  } catch (err) {
    next(err);
  }
});

// PUT /reading-lists/:listId - Update reading list
router.put('/reading-lists/:listId', auth, async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { name, description, is_public } = req.body;
    
    // Check ownership
    const [lists] = await pool.query(
      'SELECT id FROM reading_lists WHERE id = ? AND user_id = ?',
      [listId, req.user.id]
    );
    
    if (lists.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Not authorized or list not found', 
        errorCode: 'NOT_AUTHORIZED' 
      });
    }
    
    const updates = [];
    const values = [];
    
    if (name !== undefined && name.trim() !== '') {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      values.push(is_public ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'No fields to update', 
        errorCode: 'NO_UPDATES' 
      });
    }
    
    updates.push('updated_at = NOW()');
    values.push(listId);
    
    await pool.query(
      `UPDATE reading_lists SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [updated] = await pool.query(
      `SELECT 
        rl.id, rl.user_id, rl.name, rl.description, rl.is_public, 
        rl.created_at, rl.updated_at,
        COUNT(rls.id) as story_count
       FROM reading_lists rl
       LEFT JOIN reading_list_stories rls ON rl.id = rls.reading_list_id
       WHERE rl.id = ?
       GROUP BY rl.id`,
      [listId]
    );
    
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /reading-lists/:listId - Delete reading list
router.delete('/reading-lists/:listId', auth, async (req, res, next) => {
  try {
    const { listId } = req.params;
    
    // Check ownership
    const [lists] = await pool.query(
      'SELECT id FROM reading_lists WHERE id = ? AND user_id = ?',
      [listId, req.user.id]
    );
    
    if (lists.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Not authorized or list not found', 
        errorCode: 'NOT_AUTHORIZED' 
      });
    }
    
    // Delete list (cascade will delete stories in list)
    await pool.query('DELETE FROM reading_lists WHERE id = ?', [listId]);
    
    res.json({ 
      ok: true, 
      message: 'Reading list deleted' 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
