const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkChapterData() {
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
    console.log('Checking chapter 1 data...\n');
    console.log('='.repeat(60));

    // Check chapter structure
    const [columns] = await connection.execute('DESCRIBE chapters');
    console.log('\nChapters table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(25)}`);
    });

    // Check chapter 1 data
    const [chapter] = await connection.execute('SELECT * FROM chapters WHERE id = 1');
    console.log('\n' + '='.repeat(60));
    console.log('\nChapter 1 data:');
    console.log(JSON.stringify(chapter[0], null, 2));

    // Count votes for chapter 1
    const [votes] = await connection.execute('SELECT COUNT(*) as count FROM votes WHERE chapter_id = 1');
    console.log('\n' + '='.repeat(60));
    console.log(`\nVotes for chapter 1: ${votes[0].count}`);

    // Count comments for chapter 1
    const [comments] = await connection.execute('SELECT COUNT(*) as count FROM story_comments WHERE chapter_id = 1');
    console.log(`Comments for chapter 1: ${comments[0].count}`);

    // Check if views column exists
    console.log('\n' + '='.repeat(60));
    const hasViews = columns.some(col => col.Field === 'views');
    const hasVotes = columns.some(col => col.Field === 'votes');
    const hasCommentsCount = columns.some(col => col.Field === 'comments_count');

    console.log('\nColumn checks:');
    console.log(`  views column exists: ${hasViews ? '✅' : '❌'}`);
    console.log(`  votes column exists: ${hasVotes ? '✅' : '❌'}`);
    console.log(`  comments_count column exists: ${hasCommentsCount ? '✅' : '❌'}`);

    if (!hasViews || !hasVotes || !hasCommentsCount) {
      console.log('\n💡 Missing columns need to be added to chapters table!');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

checkChapterData();
