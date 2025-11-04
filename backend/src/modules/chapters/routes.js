const express = require('express');
const pool = require('../../db');
const auth = require('../../mw/auth');
const { checkChapterOwnership, checkStoryOwnershipByStoryId } = require('./service');

const router = express.Router();

// GET /stories/:storyId/chapters - List chapters for a story
router.get('/stories/:storyId/chapters', async (req, res, next) => {
  try {
    const storyId = req.params.storyId;
    
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

// GET /chapters/story/:storyId - List chapters for a story (alternative endpoint)
router.get('/story/:storyId', async (req, res, next) => {
  try {
    const storyId = req.params.storyId;
    
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
    
    // Build query based on authorization
    let query = `
      SELECT id, story_id, title, chapter_order, created_at, updated_at
      FROM chapters 
      WHERE story_id = ?
    `;
    
    if (!isAuthor) {
      query += ` AND is_published = 1`;
    }
    
    query += ' ORDER BY chapter_order ASC';
    
    const [rows] = await pool.query(query, [storyId]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ========================================
// NESTED ROUTES (Must be defined BEFORE generic routes like /:id)
// ========================================

// GET /stories/:storyId/chapters/:chapterId - Get single chapter (nested route with validation)
router.get('/stories/:storyId/chapters/:chapterId', async (req, res, next) => {
  try {
    const { storyId, chapterId } = req.params;
    
    // Verify chapter belongs to story
    const [rows] = await pool.query(
      'SELECT * FROM chapters WHERE id = ? AND story_id = ?', 
      [chapterId, storyId]
    );
    
    const chapter = rows[0];
    
    if (!chapter) {
      return res.status(404).json({ ok: false, message: 'Chapter not found or does not belong to this story', errorCode: 'CHAPTER_NOT_FOUND' });
    }

    // Get votes count
    const [votesCount] = await pool.query(
      'SELECT COUNT(*) as count FROM votes WHERE chapter_id = ?',
      [chapterId]
    );
    
    // Get comments count
    const [commentsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM story_comments WHERE chapter_id = ?',
      [chapterId]
    );

    // Add computed fields to chapter
    chapter.votes = votesCount[0].count;
    chapter.comments_count = commentsCount[0].count;
    chapter.views = 0; // TODO: Implement views tracking

    res.json({ ok: true, chapter: chapter });
  } catch (err) {
    next(err);
  }
});

// POST /stories/:storyId/chapters - Create chapter (owner of story only)
router.post('/stories/:storyId/chapters', auth, async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { title, content, chapter_order, is_published } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ ok: false, message: 'Missing required fields', errorCode: 'MISSING_FIELDS' });
    }

    const isOwner = await checkStoryOwnershipByStoryId(storyId, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }
    
    // AUTO-INCREMENT chapter_order: Get max chapter_order for this story
    let finalChapterOrder = chapter_order;
    if (!chapter_order) {
      const [maxOrder] = await pool.query(
        'SELECT COALESCE(MAX(chapter_order), 0) + 1 as next_order FROM chapters WHERE story_id = ?',
        [storyId]
      );
      finalChapterOrder = maxOrder[0].next_order;
    }
    
    const [result] = await pool.query(
      `INSERT INTO chapters (story_id, title, content, chapter_order, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [storyId, title, content, finalChapterOrder, is_published || 0]
    );
    
    const [chapters] = await pool.query('SELECT * FROM chapters WHERE id = ?', [result.insertId]);

    res.status(201).json({ ok: true, data: chapters[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /stories/:storyId/chapters/:chapterId - Update chapter (owner only)
router.put('/stories/:storyId/chapters/:chapterId', auth, async (req, res, next) => {
  try {
    const { storyId, chapterId } = req.params;
    
    // Verify chapter belongs to story
    const [chapterCheck] = await pool.query(
      'SELECT id FROM chapters WHERE id = ? AND story_id = ?',
      [chapterId, storyId]
    );
    
    if (chapterCheck.length === 0) {
      return res.status(404).json({ ok: false, message: 'Chapter not found or does not belong to this story', errorCode: 'CHAPTER_NOT_FOUND' });
    }
    
    const isOwner = await checkChapterOwnership(chapterId, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }

    const { title, content, chapter_order, is_published } = req.body;
    
    const updates = [];
    const values = [];
    
    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content) {
      updates.push('content = ?');
      values.push(content);
    }
    if (chapter_order !== undefined) {
      updates.push('chapter_order = ?');
      values.push(chapter_order);
    }
    if (is_published !== undefined) {
      updates.push('is_published = ?');
      values.push(is_published);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, message: 'No fields to update', errorCode: 'NO_UPDATES' });
    }

    updates.push('updated_at = NOW()');
    values.push(chapterId);
    
    await pool.query(
      `UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [chapters] = await pool.query('SELECT * FROM chapters WHERE id = ?', [chapterId]);

    res.json({ ok: true, data: chapters[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /stories/:storyId/chapters/:chapterId - Delete chapter (owner only)
router.delete('/stories/:storyId/chapters/:chapterId', auth, async (req, res, next) => {
  try {
    const { storyId, chapterId } = req.params;
    
    // Verify chapter belongs to story
    const [chapterCheck] = await pool.query(
      'SELECT id FROM chapters WHERE id = ? AND story_id = ?',
      [chapterId, storyId]
    );
    
    if (chapterCheck.length === 0) {
      return res.status(404).json({ ok: false, message: 'Chapter not found or does not belong to this story', errorCode: 'CHAPTER_NOT_FOUND' });
    }
    
    const isOwner = await checkChapterOwnership(chapterId, req.user.id);
    
    if (!isOwner) {
      return res.status(403).json({ ok: false, message: 'Not authorized', errorCode: 'NOT_AUTHORIZED' });
    }
    
    await pool.query('DELETE FROM chapters WHERE id = ?', [chapterId]);

    res.json({ ok: true, message: 'Chapter deleted' });
  } catch (err) {
    next(err);
  }
});

// ========================================
// LEGACY ROUTES (Must be defined AFTER specific nested routes)
// ========================================

// GET /chapters/:id - Get single chapter (legacy endpoint for reading page)
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
    
    const chapter = rows[0];
    
    if (!chapter) {
      return res.status(404).json({ ok: false, message: 'Chapter not found', errorCode: 'CHAPTER_NOT_FOUND' });
    }

    // Get votes count
    const [votesCount] = await pool.query(
      'SELECT COUNT(*) as count FROM votes WHERE chapter_id = ?',
      [req.params.id]
    );
    
    // Get comments count
    const [commentsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM story_comments WHERE chapter_id = ?',
      [req.params.id]
    );

    // Add computed fields to chapter
    chapter.votes = votesCount[0].count;
    chapter.comments_count = commentsCount[0].count;
    chapter.views = 0; // TODO: Implement views tracking

    res.json({ ok: true, chapter: chapter });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
