const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function testEncoding() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'wattpad',
    charset: 'utf8mb4'
  });

  try {
    console.log('✅ Connected to MySQL\n');

    // Check database charset
    const [dbInfo] = await connection.query(`
      SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = 'wattpad'
    `);
    console.log('📊 Database Charset:', dbInfo[0]);

    // Check table charset
    const [tableInfo] = await connection.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'wattpad' AND TABLE_NAME = 'stories'
    `);
    console.log('📋 Stories Table Collation:', tableInfo[0]);

    // Check column charset
    const [colInfo] = await connection.query(`
      SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'wattpad' 
        AND TABLE_NAME = 'stories' 
        AND COLUMN_NAME = 'title'
    `);
    console.log('📝 Title Column Charset:', colInfo[0]);

    // Test data
    const [stories] = await connection.query('SELECT id, title, description FROM stories');
    console.log('\n📚 Stories in database:');
    if (stories.length === 0) {
      console.log('  ❌ No stories found!');
    } else {
      stories.forEach(story => {
        console.log(`  ${story.id}. ${story.title}`);
        console.log(`     ${story.description}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testEncoding();
