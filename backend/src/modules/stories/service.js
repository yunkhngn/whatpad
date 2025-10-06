const pool = require('../../db');

async function checkStoryOwnership(storyId, userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, storyId)
    .input('user_id', sql.Int, userId)
    .query('SELECT id FROM stories WHERE id = @id AND user_id = @user_id');
  
  return result.recordset.length > 0;
}

async function getStoryWithTags(storyId) {
  const pool = await poolPromise;
  
  const storyResult = await pool.request()
    .input('id', sql.Int, storyId)
    .query('SELECT * FROM stories WHERE id = @id');
  
  if (storyResult.recordset.length === 0) return null;
  
  const story = storyResult.recordset[0];
  
  const tagsResult = await pool.request()
    .input('story_id', sql.Int, storyId)
    .query(`
      SELECT t.id, t.name 
      FROM tags t
      JOIN story_tags st ON t.id = st.tag_id
      WHERE st.story_id = @story_id
    `);
  
  story.tags = tagsResult.recordset;
  return story;
}

module.exports = { checkStoryOwnership, getStoryWithTags };
