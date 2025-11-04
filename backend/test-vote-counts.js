const mysql = require('mysql2/promise');

async function testVoteCounts() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'sa',
    password: '123',
    database: 'wattpad'
  });

  try {
    console.log('📊 Testing Vote Counts\n');
    
    // Get stories with their vote counts
    const [stories] = await pool.query(`
      SELECT 
        s.id, 
        s.title,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count,
        (SELECT COUNT(*) FROM votes v 
         JOIN chapters c ON v.chapter_id = c.id 
         WHERE c.story_id = s.id) as vote_count
      FROM stories s
      WHERE s.status = 'published'
      ORDER BY vote_count DESC
      LIMIT 5
    `);
    
    console.log('📚 Top 5 Stories by Vote Count:\n');
    for (const story of stories) {
      console.log(`Story #${story.id}: ${story.title}`);
      console.log(`  - Chapters: ${story.chapter_count}`);
      console.log(`  - Total Votes: ${story.vote_count}`);
      
      // Get vote breakdown by chapter
      const [chapters] = await pool.query(`
        SELECT c.id, c.title, c.chapter_order,
          (SELECT COUNT(*) FROM votes WHERE chapter_id = c.id) as vote_count
        FROM chapters c
        WHERE c.story_id = ?
        ORDER BY c.chapter_order
      `, [story.id]);
      
      if (chapters.length > 0) {
        console.log('  - Vote breakdown:');
        chapters.forEach(ch => {
          console.log(`    Chapter ${ch.chapter_order}: ${ch.vote_count} votes`);
        });
      }
      console.log('');
    }
    
    // Show total votes in system
    const [totalVotes] = await pool.query('SELECT COUNT(*) as total FROM votes');
    console.log(`\n💯 Total votes in system: ${totalVotes[0].total}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testVoteCounts();
