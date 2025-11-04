const pool = require('../../db');

async function getAllTags() {
  const [rows] = await pool.query('SELECT * FROM tags ORDER BY name ASC');
  return rows;
}

async function getTagsByStoryId(storyId) {
  const [rows] = await pool.query(
    `SELECT t.* FROM tags t
     INNER JOIN story_tags st ON t.id = st.tag_id
     WHERE st.story_id = ?`,
    [storyId]
  );
  return rows;
}

async function addTagsToStory(storyId, tagIds) {
  if (!tagIds || tagIds.length === 0) return;
  
  const values = tagIds.map(tagId => [storyId, tagId]);
  await pool.query(
    'INSERT IGNORE INTO story_tags (story_id, tag_id) VALUES ?',
    [values]
  );
}

async function removeTagsFromStory(storyId, tagIds = null) {
  if (tagIds && tagIds.length > 0) {
    await pool.query(
      'DELETE FROM story_tags WHERE story_id = ? AND tag_id IN (?)',
      [storyId, tagIds]
    );
  } else {
    await pool.query('DELETE FROM story_tags WHERE story_id = ?', [storyId]);
  }
}

async function updateStoryTags(storyId, tagIds) {
  // Remove all existing tags
  await removeTagsFromStory(storyId);
  // Add new tags
  await addTagsToStory(storyId, tagIds);
}

module.exports = {
  getAllTags,
  getTagsByStoryId,
  addTagsToStory,
  removeTagsFromStory,
  updateStoryTags
};
