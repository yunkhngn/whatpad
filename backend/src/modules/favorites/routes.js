const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /me/favorite-lists - Get user's favorite lists
router.get('/me/favorite-lists', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, user_id, name, is_private, created_at
      FROM favorite_lists
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /me/favorite-lists - Create favorite list
router.post('/me/favorite-lists', auth, async (req, res, next) => {
  try {
    const { name, is_private } = req.body;
    
    if (!name) {
      return res.status(400).json({ ok: false, message: 'Name is required', errorCode: 'MISSING_NAME' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO favorite_lists (user_id, name, is_private, created_at) VALUES (?, ?, ?, NOW())',
      [req.user.id, name, is_private || 0]
    );
    
    const [lists] = await pool.query('SELECT * FROM favorite_lists WHERE id = ?', [result.insertId]);

    res.status(201).json({ ok: true, data: lists[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /me/favorite-lists/:listId - Update favorite list
router.put('/me/favorite-lists/:listId', auth, async (req, res, next) => {
  try {
    const { name, is_private } = req.body;
    
    // Check ownership
    const [ownerCheck] = await pool.query(
      'SELECT id FROM favorite_lists WHERE id = ? AND user_id = ?',
      [req.params.listId, req.user.id]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (is_private !== undefined) {
      updates.push('is_private = ?');
      values.push(is_private);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    values.push(req.params.listId);
    
    await pool.query(
      `UPDATE favorite_lists SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [lists] = await pool.query('SELECT * FROM favorite_lists WHERE id = ?', [req.params.listId]);

    res.json({ ok: true, data: lists[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /me/favorite-lists/:listId - Delete favorite list
router.delete('/me/favorite-lists/:listId', auth, async (req, res, next) => {
  try {
    // Check ownership
    const [ownerCheck] = await pool.query(
      'SELECT id FROM favorite_lists WHERE id = ? AND user_id = ?',
      [req.params.listId, req.user.id]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.query('DELETE FROM favorite_lists WHERE id = ?', [req.params.listId]);

    res.json({ ok: true, message: 'List deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /me/favorite-lists/:listId/items - Get items in a favorite list
router.get('/me/favorite-lists/:listId/items', auth, async (req, res, next) => {
  try {
    // Check if list belongs to user or is public
    const [listCheck] = await pool.query(
      'SELECT id, is_private FROM favorite_lists WHERE id = ? AND (user_id = ? OR is_private = 0)',
      [req.params.listId, req.user.id]
    );
    
    if (listCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const [rows] = await pool.query(`
      SELECT fli.*, 
        s.title, s.cover_url, s.description,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count,
        (SELECT COUNT(*) FROM votes v 
         JOIN chapters c ON v.chapter_id = c.id 
         WHERE c.story_id = s.id) as vote_count,
        (SELECT COUNT(*) FROM story_reads WHERE story_id = s.id) as read_count
      FROM favorite_list_items fli
      JOIN stories s ON fli.story_id = s.id
      WHERE fli.list_id = ?
      ORDER BY fli.added_at DESC
    `, [req.params.listId]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /me/favorite-lists/:listId/items - Add story to favorite list
router.post('/me/favorite-lists/:listId/items', auth, async (req, res, next) => {
  try {
    const { story_id } = req.body;
    
    if (!story_id) {
      return res.status(400).json({ ok: false, message: 'story_id is required', errorCode: 'MISSING_STORY_ID' });
    }
    
    // Check ownership
    const [ownerCheck] = await pool.query(
      'SELECT id FROM favorite_lists WHERE id = ? AND user_id = ?',
      [req.params.listId, req.user.id]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.query(
      'INSERT IGNORE INTO favorite_list_items (list_id, story_id, added_at) VALUES (?, ?, NOW())',
      [req.params.listId, story_id]
    );

    res.json({ ok: true, message: 'Story added to list' });
  } catch (err) {
    next(err);
  }
});

// DELETE /me/favorite-lists/:listId/items/:storyId - Remove story from favorite list
router.delete('/me/favorite-lists/:listId/items/:storyId', auth, async (req, res, next) => {
  try {
    // Check ownership
    const [ownerCheck] = await pool.query(
      'SELECT id FROM favorite_lists WHERE id = ? AND user_id = ?',
      [req.params.listId, req.user.id]
    );
    
    if (ownerCheck.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.query(
      'DELETE FROM favorite_list_items WHERE list_id = ? AND story_id = ?',
      [req.params.listId, req.params.storyId]
    );

    res.json({ ok: true, message: 'Story removed from list' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
