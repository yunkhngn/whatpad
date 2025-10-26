const pool = require('../src/db');

async function testQuery() {
  console.log('Testing reading history API query...\n');

  try {
    const userId = 6;

    const query = `
      SELECT 
        rh.id,
        rh.user_id,
        rh.story_id,
        rh.last_chapter_id,
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

    console.log(`Found ${rows.length} results\n`);

    rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.story_title}`);
      console.log(`   Reading History ID: ${row.id}`);
      console.log(`   Story ID: ${row.story_id}`);
      console.log(`   last_chapter_id (from rh): ${row.last_chapter_id}`);
      console.log(`   chapter_id (from c): ${row.chapter_id}`);
      console.log(`   Chapter Title: ${row.chapter_title}`);
      console.log(`   Chapter Order: ${row.chapter_order}`);
      console.log();
    });

    // Also check the raw reading_history entries
    console.log('Raw reading_history entries:');
    const [rawRows] = await pool.query(
      'SELECT * FROM reading_history WHERE user_id = ?',
      [userId]
    );
    rawRows.forEach((row, i) => {
      console.log(`  ${i + 1}. ID: ${row.id}, Story: ${row.story_id}, Last Chapter: ${row.last_chapter_id}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

testQuery();
