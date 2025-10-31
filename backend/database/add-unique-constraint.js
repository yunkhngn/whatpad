const pool = require('../src/db');

async function addUniqueConstraint() {
  console.log('Adding unique constraint to reading_history table...\n');

  try {
    // First, remove duplicate entries, keeping only the most recent one
    console.log('Step 1: Removing duplicate entries...');
    await pool.query(`
      DELETE t1 FROM reading_history t1
      INNER JOIN reading_history t2 
      WHERE 
        t1.user_id = t2.user_id 
        AND t1.story_id = t2.story_id 
        AND t1.id < t2.id
    `);
    console.log('✓ Duplicates removed\n');

    // Check remaining entries
    const [remaining] = await pool.query('SELECT * FROM reading_history WHERE user_id = 6 ORDER BY updated_at DESC');
    console.log(`Remaining entries for user 6: ${remaining.length}`);
    remaining.forEach((row, i) => {
      console.log(`  ${i + 1}. Story ID ${row.story_id}, Chapter ${row.last_chapter_id}, Updated: ${row.updated_at}`);
    });
    console.log();

    // Add unique constraint
    console.log('Step 2: Adding unique constraint...');
    try {
      await pool.query(`
        ALTER TABLE reading_history 
        ADD UNIQUE KEY unique_user_story (user_id, story_id)
      `);
      console.log('✓ Unique constraint added successfully!');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Unique constraint already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Database cleanup complete!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

addUniqueConstraint();
