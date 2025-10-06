const { sql, poolPromise } = require('../../db');

async function checkChapterOwnership(chapterId, userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, chapterId)
    .input('user_id', sql.Int, userId)
    .query(`
      SELECT c.id 
      FROM chapters c
      JOIN stories s ON c.story_id = s.id
      WHERE c.id = @id AND s.user_id = @user_id
    `);
  
  return result.recordset.length > 0;
}

async function checkStoryOwnershipByStoryId(storyId, userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('story_id', sql.Int, storyId)
    .input('user_id', sql.Int, userId)
    .query('SELECT id FROM stories WHERE id = @story_id AND user_id = @user_id');
  
  return result.recordset.length > 0;
}

module.exports = { checkChapterOwnership, checkStoryOwnershipByStoryId };
