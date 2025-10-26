const pool = require('../src/db');

async function testReadingHistory() {
  console.log('Testing updated reading history query...\n');

  try {
    const userId = 6;

    // Get the most recent reading record for each unique story
    const query = `
      SELECT 
        rh.id,
        rh.user_id,
        rh.updated_at,
        s.id as story_id,
        s.title as story_title,
        s.description as story_description,
        s.cover_url as story_cover_url,
        s.status as story_status,
        c.id as chapter_id,
        c.title as chapter_title,
        c.chapter_order,
        u.username as author_username,
        u.id as author_id
      FROM reading_history rh
      INNER JOIN (
        SELECT story_id, MAX(updated_at) as max_updated
        FROM reading_history
        WHERE user_id = ?
        GROUP BY story_id
      ) latest ON rh.story_id = latest.story_id AND rh.updated_at = latest.max_updated
      JOIN stories s ON rh.story_id = s.id
      LEFT JOIN chapters c ON rh.last_chapter_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE rh.user_id = ?
      ORDER BY rh.updated_at DESC
    `;

    const [rows] = await pool.query(query, [userId, userId]);

    console.log(`Total unique stories in reading history: ${rows.length}\n`);

    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.story_title}`);
      console.log(`   Reading History ID: ${row.id}`);
      console.log(`   Story ID: ${row.story_id}`);
      console.log(`   Chapter: ${row.chapter_title} (ID: ${row.chapter_id})`);
      console.log(`   Author: ${row.author_username}`);
      console.log(`   Last read: ${row.updated_at}`);
      console.log();
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

testReadingHistory();
