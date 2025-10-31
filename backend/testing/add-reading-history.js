const mysql = require('mysql2/promise');
require('dotenv').config();

async function addTestReadingHistory() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wattpad',
      charset: 'utf8mb4'
    });

    console.log('Connected to database');

    // Check existing users
    const [users] = await connection.query('SELECT id, username FROM users');
    console.log('\nAvailable users:');
    console.log(users);

    // Check existing stories and chapters
    const [stories] = await connection.query(`
      SELECT s.id as story_id, s.title as story_title, 
             c.id as chapter_id, c.title as chapter_title
      FROM stories s
      JOIN chapters c ON s.id = c.story_id
      ORDER BY s.id, c.chapter_order
    `);
    console.log('\nAvailable stories and chapters:');
    console.log(stories);

    // Add reading history for user 6 (Hoang)
    const userId = 6;
    const readingData = [
      { story_id: 1, chapter_id: 4 },  // Story 1, Chapter 1
      { story_id: 2, chapter_id: 5 },  // Story 2, Chapter 1
      { story_id: 3, chapter_id: 6 },  // Story 3, Chapter 1
    ];

    console.log('\nAdding reading history for user', userId);
    
    for (const data of readingData) {
      try {
        await connection.query(`
          INSERT INTO reading_history (user_id, story_id, last_chapter_id, updated_at)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE last_chapter_id = ?, updated_at = NOW()
        `, [userId, data.story_id, data.chapter_id, data.chapter_id]);
        
        console.log(`✓ Added reading history: Story ${data.story_id}, Chapter ${data.chapter_id}`);
      } catch (err) {
        console.error(`✗ Error adding reading history for story ${data.story_id}:`, err.message);
      }
    }

    // Check what was inserted
    const [inserted] = await connection.query(`
      SELECT rh.*, s.title as story_title, c.title as chapter_title
      FROM reading_history rh
      JOIN stories s ON rh.story_id = s.id
      JOIN chapters c ON rh.last_chapter_id = c.id
      WHERE rh.user_id = ?
      ORDER BY rh.updated_at DESC
    `, [userId]);

    console.log('\nReading history for user', userId);
    console.log(inserted);

    await connection.end();
    console.log('\n✅ Test data added successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

addTestReadingHistory();
