const pool = require('../src/db');

async function debugReadingHistory() {
  console.log('=== DEBUGGING READING HISTORY ===\n');

  try {
    const userId = 6;

    // First, check all raw reading_history entries
    console.log('1. RAW reading_history table entries for user 6:');
    const [rawRows] = await pool.query(
      'SELECT * FROM reading_history WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    console.log(`Found ${rawRows.length} total entries:\n`);
    rawRows.forEach((row, i) => {
      console.log(`Entry ${i + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Story ID: ${row.story_id}`);
      console.log(`  Last Chapter ID: ${row.last_chapter_id}`);
      console.log(`  Updated: ${row.updated_at}`);
      console.log();
    });

    // Now test the API query
    console.log('2. API Query Result (with GROUP BY):');
    const query = `
      SELECT 
        rh.id,
        rh.user_id,
        rh.updated_at,
        s.id as story_id,
        s.title as story_title,
        c.id as chapter_id,
        c.title as chapter_title
      FROM reading_history rh
      INNER JOIN (
        SELECT story_id, MAX(updated_at) as max_updated
        FROM reading_history
        WHERE user_id = ?
        GROUP BY story_id
      ) latest ON rh.story_id = latest.story_id AND rh.updated_at = latest.max_updated
      JOIN stories s ON rh.story_id = s.id
      LEFT JOIN chapters c ON rh.last_chapter_id = c.id
      WHERE rh.user_id = ?
      ORDER BY rh.updated_at DESC
    `;

    const [apiRows] = await pool.query(query, [userId, userId]);
    console.log(`Found ${apiRows.length} unique stories:\n`);
    apiRows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.story_title}`);
      console.log(`   Reading History ID: ${row.id}`);
      console.log(`   Story ID: ${row.story_id}`);
      console.log(`   Chapter ID: ${row.chapter_id}`);
      console.log(`   Chapter: ${row.chapter_title}`);
      console.log(`   Updated: ${row.updated_at}`);
      console.log();
    });

    // Check for multiple rows with same updated_at (edge case)
    console.log('3. Checking for duplicate timestamps:');
    const [duplicates] = await pool.query(`
      SELECT story_id, updated_at, COUNT(*) as count
      FROM reading_history
      WHERE user_id = ?
      GROUP BY story_id, updated_at
      HAVING count > 1
    `, [userId]);

    if (duplicates.length > 0) {
      console.log('⚠️  Found entries with duplicate timestamps:');
      duplicates.forEach(dup => {
        console.log(`   Story ID ${dup.story_id}: ${dup.count} entries at ${dup.updated_at}`);
      });
    } else {
      console.log('✓ No duplicate timestamps found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

debugReadingHistory();
