const pool = require('../../db');

async function checkStoryOwnership(storyId, userId) {
  const [rows] = await pool.query(
    'SELECT id FROM stories WHERE id = ? AND user_id = ?',
    [storyId, userId]
  );
  
  return rows.length > 0;
}

async function getStoryWithTags(storyId) {
  const [stories] = await pool.query('SELECT * FROM stories WHERE id = ?', [storyId]);
  
  if (stories.length === 0) return null;
  
  const story = stories[0];
  
  const [tags] = await pool.query(`
    SELECT t.id, t.name 
    FROM tags t
    JOIN story_tags st ON t.id = st.tag_id
    WHERE st.story_id = ?
  `, [storyId]);
  
  story.tags = tags;
  return story;
}

module.exports = { checkStoryOwnership, getStoryWithTags };
