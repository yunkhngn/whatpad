const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMoreComments() {
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
    
    // Get chapters
    const [chapters] = await connection.execute(`
      SELECT id, story_id, title, chapter_order
      FROM chapters
      ORDER BY story_id, chapter_order
    `);
    
    console.log('Adding more test comments...\n');
    
    // Add comments to chapter 4 (Story 1)
    const commentsToAdd = [
      { chapter_id: 4, user_id: 2, content: 'Chương đầu hay quá! Mong tác giả ra chương tiếp theo sớm.' },
      { chapter_id: 4, user_id: 4, content: 'Câu chuyện rất cảm động, đọc xong muốn khóc luôn 😢' },
      { chapter_id: 5, user_id: 2, content: 'Thế giới song song thật kỳ ảo! Rất mong chờ phần tiếp theo.' },
      { chapter_id: 5, user_id: 3, content: 'Tác giả viết hay quá, không thể ngừng đọc được!' },
      { chapter_id: 6, user_id: 3, content: 'Mê cung này đáng sợ thật, kịch tính lắm!' },
      { chapter_id: 6, user_id: 4, content: 'Plot twist bất ngờ, tác giả giỏi thật!' }
    ];
    
    for (const comment of commentsToAdd) {
      const chapter = chapters.find(ch => ch.id === comment.chapter_id);
      
      if (chapter) {
        try {
          await connection.execute(`
            INSERT INTO story_comments (story_id, chapter_id, user_id, content, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `, [chapter.story_id, comment.chapter_id, comment.user_id, comment.content]);
          
          console.log(`✅ Added comment to chapter ${comment.chapter_id} (${chapter.title})`);
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Comment already exists`);
          } else {
            console.error(`❌ Error adding comment: ${err.message}`);
          }
        }
      }
    }

    // Verify
    const [allComments] = await connection.execute(`
      SELECT c.*, u.username, s.title as story_title, ch.title as chapter_title, ch.chapter_order
      FROM story_comments c
      JOIN users u ON c.user_id = u.id
      JOIN stories s ON c.story_id = s.id
      LEFT JOIN chapters ch ON c.chapter_id = ch.id
      ORDER BY s.id, ch.chapter_order, c.created_at DESC
    `);

    console.log('\n' + '='.repeat(60));
    console.log(`\nTotal comments in database: ${allComments.length}\n`);
    
    // Group by story
    const byStory = {};
    allComments.forEach(c => {
      if (!byStory[c.story_id]) {
        byStory[c.story_id] = { story: c.story_title, comments: [] };
      }
      byStory[c.story_id].comments.push(c);
    });
    
    Object.values(byStory).forEach(item => {
      console.log(`📖 ${item.story} (${item.comments.length} comments)`);
      item.comments.forEach(c => {
        console.log(`   └─ ${c.username}: "${c.content}"`);
        console.log(`      on Chapter ${c.chapter_order}: ${c.chapter_title}`);
      });
      console.log('');
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

addMoreComments().catch(console.error);
