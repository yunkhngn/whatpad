const pool = require('../../db');

async function checkChapterOwnership(chapterId, userId) {
  const [rows] = await pool.query(`
    SELECT c.id 
    FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE c.id = ? AND s.user_id = ?
  `, [chapterId, userId]);
  
  return rows.length > 0;
}

async function checkStoryOwnershipByStoryId(storyId, userId) {
  const [rows] = await pool.query(
    'SELECT id FROM stories WHERE id = ? AND user_id = ?',
    [storyId, userId]
  );
  
  return rows.length > 0;
}

module.exports = { checkChapterOwnership, checkStoryOwnershipByStoryId };
