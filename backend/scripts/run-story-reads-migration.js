const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'wattpad',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('Connected successfully!');
    console.log('Running story_reads migration...');
    
    const sqlPath = path.join(__dirname, '../database/add_story_reads.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('Story reads table has been created.');
    console.log('\nYou can now restart your backend server.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  The story_reads table already exists. Migration not needed.');
    } else {
      console.error('\nFull error:', error);
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n❌ Failed!');
    process.exit(1);
  });
