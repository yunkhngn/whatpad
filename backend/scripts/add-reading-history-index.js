const mysql = require('mysql2/promise');
require('dotenv').config();

async function addUniqueConstraint() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wattpad'
  });

  try {
    console.log('Connected to MySQL');
    
    // Check if the unique index already exists
    const [indexes] = await connection.query(
      `SHOW INDEX FROM reading_history WHERE Key_name = 'idx_reading_history_user_story'`
    );

    if (indexes.length > 0) {
      console.log('✓ Unique index already exists on reading_history (user_id, story_id)');
    } else {
      console.log('Adding unique index to reading_history table...');
      
      // Add unique index
      await connection.query(
        `ALTER TABLE reading_history 
         ADD UNIQUE INDEX idx_reading_history_user_story (user_id, story_id)`
      );
      
      console.log('✓ Successfully added unique index to reading_history table');
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entries found! Please clean up duplicate data first.');
    }
  } finally {
    await connection.end();
  }
}

addUniqueConstraint();
