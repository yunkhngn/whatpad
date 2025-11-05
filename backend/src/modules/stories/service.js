const pool = require('../../db');

async function checkStoryOwnership(storyId, userId) {
  const [rows] = await pool.query(
    'SELECT id FROM stories WHERE id = ? AND user_id = ?',
    [storyId, userId]
  );
  
  return rows.length > 0;
}

async function getStoryWithTags(storyId) {
  const [stories] = await pool.query(`
    SELECT s.*, u.username as author_name, u.avatar_url as author_avatar, u.bio as author_bio,
      (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count,
      (SELECT COUNT(*) FROM votes v 
       JOIN chapters c ON v.chapter_id = c.id 
       WHERE c.story_id = s.id) as vote_count,
      (SELECT COUNT(*) FROM story_reads WHERE story_id = s.id) as read_count
    FROM stories s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `, [storyId]);
  
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
