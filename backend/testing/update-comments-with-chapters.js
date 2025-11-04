const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCommentsWithChapters() {
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
    
    // First, check what chapters exist
    const [chapters] = await connection.execute(`
      SELECT id, story_id, title, chapter_order
      FROM chapters
      ORDER BY story_id, chapter_order
    `);
    
    console.log('Available chapters:');
    chapters.forEach(ch => {
      console.log(`  Chapter ID: ${ch.id}, Story: ${ch.story_id}, Order: ${ch.chapter_order}, Title: ${ch.title}`);
    });
    console.log('');
    
    // Check existing comments
    const [existingComments] = await connection.execute(`
      SELECT id, story_id, chapter_id, content
      FROM story_comments
    `);
    
    console.log('Existing comments:');
    existingComments.forEach(c => {
      console.log(`  Comment ID: ${c.id}, Story: ${c.story_id}, Chapter: ${c.chapter_id || 'NULL'}, Content: ${c.content.substring(0, 50)}...`);
    });
    console.log('');
    
    // Update existing comments to assign them to the first chapter of their story
    console.log('Updating comments with chapter IDs...\n');
    
    for (const comment of existingComments) {
      if (!comment.chapter_id) {
        // Find the first chapter of this story
        const chapter = chapters.find(ch => ch.story_id === comment.story_id && ch.chapter_order === 1);
        
        if (chapter) {
          await connection.execute(`
            UPDATE story_comments
            SET chapter_id = ?
            WHERE id = ?
          `, [chapter.id, comment.id]);
          
          console.log(`✅ Updated comment ${comment.id} to chapter ${chapter.id} (${chapter.title})`);
        } else {
          console.log(`⚠️  No chapter found for comment ${comment.id} (story ${comment.story_id})`);
        }
      }
    }
    
    // Now insert some additional test comments
    console.log('\nInserting additional test comments...\n');
    
    const testComments = [
      { story_id: 1, chapter_id: 1, user_id: 2, content: 'Chương đầu hay quá! Mong tác giả ra chương tiếp theo sớm.' },
      { story_id: 1, chapter_id: 2, user_id: 3, content: 'Chương này càng hay hơn chương trước. Cảm xúc thật sâu sắc.' },
      { story_id: 3, chapter_id: 3, user_id: 2, content: 'Kịch tính và hồi hộp quá! Không thể ngừng đọc được.' }
    ];
    
    for (const comment of testComments) {
      // Check if chapter exists
      const chapter = chapters.find(ch => ch.id === comment.chapter_id && ch.story_id === comment.story_id);
      
      if (chapter) {
        try {
          await connection.execute(`
            INSERT INTO story_comments (story_id, chapter_id, user_id, content, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `, [comment.story_id, comment.chapter_id, comment.user_id, comment.content]);
          
          console.log(`✅ Inserted comment for chapter ${comment.chapter_id}: "${comment.content.substring(0, 40)}..."`);
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Comment already exists for chapter ${comment.chapter_id}`);
          } else {
            throw err;
          }
        }
      } else {
        console.log(`⚠️  Chapter ${comment.chapter_id} not found for story ${comment.story_id}, skipping...`);
      }
    }

    // Verify final state
    console.log('\n' + '='.repeat(60));
    const [finalComments] = await connection.execute(`
      SELECT c.*, u.username, s.title as story_title, ch.title as chapter_title
      FROM story_comments c
      JOIN users u ON c.user_id = u.id
      JOIN stories s ON c.story_id = s.id
      LEFT JOIN chapters ch ON c.chapter_id = ch.id
      ORDER BY c.created_at DESC
    `);

    console.log(`\nTotal comments in database: ${finalComments.length}\n`);
    
    finalComments.forEach((comment, index) => {
      console.log(`${index + 1}. ${comment.username} commented on:`);
      console.log(`   Story: "${comment.story_title}"`);
      console.log(`   Chapter: "${comment.chapter_title || 'NULL'}"`);
      console.log(`   Content: "${comment.content}"`);
      console.log('   ' + '-'.repeat(55));
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

updateCommentsWithChapters().catch(console.error);
