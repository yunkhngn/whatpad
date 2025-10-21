const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllTables() {
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
    console.log('Checking all tables...\n');
    console.log('='.repeat(60));

    // Check users
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Users: ${users[0].count}`);
    
    // Check stories
    const [stories] = await connection.execute('SELECT COUNT(*) as count FROM stories');
    console.log(`Stories: ${stories[0].count}`);
    
    // Check chapters
    const [chapters] = await connection.execute('SELECT COUNT(*) as count FROM chapters');
    console.log(`Chapters: ${chapters[0].count}`);
    
    // Check story_comments
    const [comments] = await connection.execute('SELECT COUNT(*) as count FROM story_comments');
    console.log(`Story Comments: ${comments[0].count}`);
    
    // Check if table structure is correct
    console.log('\n' + '='.repeat(60));
    console.log('Checking story_comments table structure:\n');
    const [columns] = await connection.execute('DESCRIBE story_comments');
    columns.forEach(col => {
      console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(25)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Try to see if there are ANY rows
    console.log('\n' + '='.repeat(60));
    console.log('Checking for any data in story_comments:\n');
    const [allComments] = await connection.execute('SELECT * FROM story_comments LIMIT 5');
    if (allComments.length === 0) {
      console.log('❌ Table is empty. Need to insert test data.');
    } else {
      console.log(`✅ Found ${allComments.length} comments:`);
      allComments.forEach(c => console.log(`   - ID: ${c.id}, Story: ${c.story_id}, User: ${c.user_id}, Content: ${c.content}`));
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

checkAllTables().catch(console.error);
