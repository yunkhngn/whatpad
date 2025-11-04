const mysql = require('mysql2/promise');
require('dotenv').config();

async function listAllChapters() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'wattpad',
      port: process.env.DB_PORT || 3306,
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to database\n');
    
    // Get all chapters with their stories
    const [chapters] = await connection.execute(`
      SELECT c.id, c.story_id, c.title, c.chapter_order, c.is_published,
             s.title as story_title,
             (SELECT COUNT(*) FROM story_comments WHERE chapter_id = c.id) as comment_count
      FROM chapters c
      JOIN stories s ON c.story_id = s.id
      ORDER BY s.id, c.chapter_order
    `);

    console.log('='.repeat(70));
    console.log(`Total Chapters in Database: ${chapters.length}\n`);
    
    let currentStory = null;
    chapters.forEach(ch => {
      if (currentStory !== ch.story_id) {
        currentStory = ch.story_id;
        console.log(`\n📖 Story: "${ch.story_title}" (ID: ${ch.story_id})`);
        console.log('-'.repeat(70));
      }
      
      const published = ch.is_published ? '✅ Published' : '⚠️  Draft';
      console.log(`   Chapter ${ch.chapter_order}: ${ch.title}`);
      console.log(`      ID: ${ch.id} | ${published} | Comments: ${ch.comment_count}`);
      console.log(`      URL: http://localhost:3000/read/${ch.id}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 Use these chapter IDs to test the reading page!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

listAllChapters().catch(console.error);
