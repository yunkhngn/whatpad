const pool = require('../src/db');

async function checkChapters() {
  console.log('Checking chapters...\n');

  try {
    const chapterIds = [4, 5, 6];

    for (const chapterId of chapterIds) {
      const [rows] = await pool.query(
        `SELECT c.*, s.title as story_title 
         FROM chapters c 
         JOIN stories s ON c.story_id = s.id 
         WHERE c.id = ?`,
        [chapterId]
      );

      if (rows.length > 0) {
        const chapter = rows[0];
        console.log(`✓ Chapter ${chapterId} EXISTS:`);
        console.log(`  Story: ${chapter.story_title} (ID: ${chapter.story_id})`);
        console.log(`  Title: ${chapter.title}`);
        console.log(`  Order: ${chapter.chapter_order}`);
        console.log(`  Published: ${chapter.is_published ? 'Yes' : 'No'}`);
      } else {
        console.log(`✗ Chapter ${chapterId} NOT FOUND`);
      }
      console.log();
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkChapters();
