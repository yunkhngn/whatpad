const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkReadingHistory() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wattpad',
      charset: 'utf8mb4'
    });

    console.log('Checking reading history...\n');

    // Check count
    const [count] = await connection.query(
      'SELECT COUNT(*) as count FROM reading_history WHERE user_id = 6'
    );
    console.log('Total reading history for user 6:', count[0].count);

    // Get detailed data
    const [rows] = await connection.query(`
      SELECT 
        rh.id,
        rh.story_id,
        s.title as story_title,
        s.cover_url as story_cover_url,
        c.id as chapter_id,
        c.title as chapter_title,
        u.username as author_username,
        rh.updated_at
      FROM reading_history rh
      JOIN stories s ON rh.story_id = s.id
      LEFT JOIN chapters c ON rh.last_chapter_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE rh.user_id = 6
      ORDER BY rh.updated_at DESC
    `);

    console.log('\nReading history details:');
    rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.story_title}`);
      console.log(`   Chapter: ${row.chapter_title} (ID: ${row.chapter_id})`);
      console.log(`   Cover: ${row.story_cover_url || 'No cover'}`);
      console.log(`   Author: ${row.author_username}`);
      console.log(`   Last read: ${row.updated_at}`);
    });

    await connection.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkReadingHistory();
