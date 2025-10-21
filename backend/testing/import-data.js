const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importData() {
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
      multipleStatements: true
    });

    console.log('✅ Connected to database\n');

    // Read and execute the insert SQL
    const sqlPath = path.join(__dirname, 'database', 'insertdb.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Importing data from insertdb.sql...');
    await connection.query(sql);

    console.log('✅ Data imported successfully!\n');

    // Check what was imported
    const [comments] = await connection.query('SELECT COUNT(*) as count FROM story_comments');
    console.log(`Total comments in database: ${comments[0].count}`);
    
    const [stories] = await connection.query('SELECT COUNT(*) as count FROM stories');
    console.log(`Total stories in database: ${stories[0].count}`);
    
    const [chapters] = await connection.query('SELECT COUNT(*) as count FROM chapters');
    console.log(`Total chapters in database: ${chapters[0].count}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('\n💡 Duplicate entry error. Data may already exist in the database.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

importData().catch(console.error);
