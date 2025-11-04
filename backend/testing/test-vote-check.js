const mysql = require('mysql2/promise');
require('dotenv').config();

async function testVoteCheck() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wattpad',
      charset: 'utf8mb4'
    });

    console.log('Connected to database');

    // Get all votes
    const [votes] = await connection.query('SELECT * FROM votes');
    console.log('\nAll votes in database:');
    console.log(votes);

    // Check specific vote for chapter 4 and user 1 (assuming user Hoang has id 1)
    const [specificVote] = await connection.query(
      'SELECT * FROM votes WHERE chapter_id = ? AND user_id = ?',
      [4, 1]
    );
    console.log('\nVote for chapter 4, user 1:');
    console.log(specificVote);
    console.log('Has voted:', specificVote.length > 0);

    await connection.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

testVoteCheck();
