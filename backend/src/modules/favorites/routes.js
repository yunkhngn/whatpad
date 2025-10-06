const express = require('express');
const { sql, poolPromise } = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// GET /me/favorite-lists - Get user's favorite lists
router.get('/me/favorite-lists', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query(`
        SELECT id, user_id, name, is_private, created_at
        FROM favorite_lists
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    res.json({ ok: true, data: result.recordset });
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

    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('name', sql.NVarChar, name)
      .input('is_private', sql.Bit, is_private || 0)
      .query(`
        INSERT INTO favorite_lists (user_id, name, is_private, created_at)
        OUTPUT INSERTED.*
        VALUES (@user_id, @name, @is_private, GETDATE())
      `);

    res.status(201).json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /me/favorite-lists/:listId - Update favorite list
router.put('/me/favorite-lists/:listId', auth, async (req, res, next) => {
  try {
    const { name, is_private } = req.body;
    const pool = await poolPromise;
    
    // Check ownership
    const ownerCheck = await pool.request()
      .input('id', sql.Int, req.params.listId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM favorite_lists WHERE id = @id AND user_id = @user_id');
    
    if (ownerCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const updates = [];
    const request = pool.request().input('id', sql.Int, req.params.listId);
    
    if (name) {
      updates.push('name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (is_private !== undefined) {
      updates.push('is_private = @is_private');
      request.input('is_private', sql.Bit, is_private);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    const result = await request.query(`
      UPDATE favorite_lists 
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    res.json({ ok: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /me/favorite-lists/:listId - Delete favorite list
router.delete('/me/favorite-lists/:listId', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Check ownership
    const ownerCheck = await pool.request()
      .input('id', sql.Int, req.params.listId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM favorite_lists WHERE id = @id AND user_id = @user_id');
    
    if (ownerCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.listId)
      .query('DELETE FROM favorite_lists WHERE id = @id');

    res.json({ ok: true, message: 'List deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /me/favorite-lists/:listId/items - Get items in a favorite list
router.get('/me/favorite-lists/:listId/items', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Check if list belongs to user or is public
    const listCheck = await pool.request()
      .input('id', sql.Int, req.params.listId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id, is_private FROM favorite_lists WHERE id = @id AND (user_id = @user_id OR is_private = 0)');
    
    if (listCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const result = await pool.request()
      .input('list_id', sql.Int, req.params.listId)
      .query(`
        SELECT fli.*, s.title, s.cover_url, s.description
        FROM favorite_list_items fli
        JOIN stories s ON fli.story_id = s.id
        WHERE fli.list_id = @list_id
        ORDER BY fli.added_at DESC
      `);

    res.json({ ok: true, data: result.recordset });
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

    const pool = await poolPromise;
    
    // Check ownership
    const ownerCheck = await pool.request()
      .input('id', sql.Int, req.params.listId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM favorite_lists WHERE id = @id AND user_id = @user_id');
    
    if (ownerCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.request()
      .input('list_id', sql.Int, req.params.listId)
      .input('story_id', sql.Int, story_id)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM favorite_list_items WHERE list_id = @list_id AND story_id = @story_id)
        INSERT INTO favorite_list_items (list_id, story_id, added_at)
        VALUES (@list_id, @story_id, GETDATE())
      `);

    res.json({ ok: true, message: 'Story added to list' });
  } catch (err) {
    next(err);
  }
});

// DELETE /me/favorite-lists/:listId/items/:storyId - Remove story from favorite list
router.delete('/me/favorite-lists/:listId/items/:storyId', auth, async (req, res, next) => {
  try {
    const pool = await poolPromise;
    
    // Check ownership
    const ownerCheck = await pool.request()
      .input('id', sql.Int, req.params.listId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM favorite_lists WHERE id = @id AND user_id = @user_id');
    
    if (ownerCheck.recordset.length === 0) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    await pool.request()
      .input('list_id', sql.Int, req.params.listId)
      .input('story_id', sql.Int, req.params.storyId)
      .query('DELETE FROM favorite_list_items WHERE list_id = @list_id AND story_id = @story_id');

    res.json({ ok: true, message: 'Story removed from list' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
