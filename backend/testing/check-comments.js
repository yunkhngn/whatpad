const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkComments() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'wattpad',
      port: process.env.DB_PORT || 3306,
      charset: 'utf8mb4',
      connectTimeout: 10000
    });

    console.log('✅ Connected to database\n');
    console.log('Checking story_comments table...\n');

    // Get total count
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM story_comments');
    console.log('Total comments:', countResult[0].count);
    
    // Get total count for chapter comments specifically
    const [chapterCountResult] = await connection.execute('SELECT COUNT(*) as count FROM story_comments WHERE chapter_id IS NOT NULL');
    console.log('Chapter comments:', chapterCountResult[0].count);
    console.log('Story comments:', countResult[0].count - chapterCountResult[0].count);

    // Get sample comments
    const [rows] = await connection.execute(`
      SELECT 
        c.id,
        c.content,
        c.story_id,
        c.chapter_id,
        c.user_id,
        c.created_at,
        u.username,
        u.avatar_url
      FROM story_comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    console.log('\nComments in database:');
    console.log('='.repeat(60));

    if (rows.length === 0) {
      console.log('❌ No comments found in database.');
    } else {
      console.log(`✅ Found ${rows.length} comment(s):\n`);
      rows.forEach((comment, index) => {
        console.log(`${index + 1}. Comment ID: ${comment.id}`);
        console.log(`   User: ${comment.username || 'Unknown'} (ID: ${comment.user_id})`);
        console.log(`   Story ID: ${comment.story_id}`);
        console.log(`   Chapter ID: ${comment.chapter_id || 'N/A (story comment)'}`);
        console.log(`   Content: ${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}`);
        console.log(`   Created: ${comment.created_at}`);
        console.log('   ' + '-'.repeat(55));
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection refused. Please check:');
      console.error('   - Is MySQL running?');
      console.error('   - Check your .env file for correct credentials');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

checkComments().catch(console.error);
