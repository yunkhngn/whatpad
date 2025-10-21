const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestComments() {
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
    console.log('Inserting test comments...\n');

    // Insert comments for chapters
    await connection.execute(`
      INSERT INTO story_comments (story_id, chapter_id, user_id, content, created_at)
      VALUES
      (1, 1, 2, 'Chương đầu hay quá! Mong tác giả ra chương tiếp theo sớm.', NOW()),
      (1, 1, 3, 'Đọc mà rơi nước mắt luôn, viết hay lắm!', NOW()),
      (1, 2, 2, 'Chương này càng hay hơn chương trước. Cảm xúc thật sâu sắc.', NOW()),
      (3, 3, 2, 'Kịch tính và hồi hộp quá! Không thể ngừng đọc được.', NOW()),
      (3, 3, 3, 'Plot twist bất ngờ, tác giả giỏi thật!', NOW())
    `);

    console.log('✅ Test comments inserted successfully!\n');

    // Verify
    const [comments] = await connection.execute(`
      SELECT c.*, u.username, s.title as story_title, ch.title as chapter_title
      FROM story_comments c
      JOIN users u ON c.user_id = u.id
      JOIN stories s ON c.story_id = s.id
      LEFT JOIN chapters ch ON c.chapter_id = ch.id
      ORDER BY c.created_at DESC
    `);

    console.log('='.repeat(60));
    console.log(`Total comments in database: ${comments.length}\n`);
    
    comments.forEach((comment, index) => {
      console.log(`${index + 1}. ${comment.username} commented on:`);
      console.log(`   Story: "${comment.story_title}"`);
      console.log(`   Chapter: "${comment.chapter_title}"`);
      console.log(`   Content: "${comment.content}"`);
      console.log(`   Created: ${comment.created_at}`);
      console.log('   ' + '-'.repeat(55));
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('\n💡 Comments may already exist.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

insertTestComments().catch(console.error);
