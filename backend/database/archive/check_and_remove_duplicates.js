const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../../.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'wattpad',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

async function checkAndRemoveDuplicates() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL database');
    
    // Check for duplicate users (by email or username)
    console.log('\n📋 Checking for duplicate users...');
    const [duplicateUsers] = await connection.query(`
      SELECT email, username, COUNT(*) as count
      FROM users
      GROUP BY email, username
      HAVING count > 1
    `);
    
    if (duplicateUsers.length > 0) {
      console.log(`❌ Found ${duplicateUsers.length} duplicate user(s):`);
      console.table(duplicateUsers);
      
      // Remove duplicates keeping the oldest one
      for (const dup of duplicateUsers) {
        await connection.query(`
          DELETE FROM users 
          WHERE email = ? AND username = ?
          AND id NOT IN (
            SELECT * FROM (
              SELECT MIN(id) FROM users 
              WHERE email = ? AND username = ?
            ) as temp
          )
        `, [dup.email, dup.username, dup.email, dup.username]);
        console.log(`✅ Removed duplicate users with email: ${dup.email}`);
      }
    } else {
      console.log('✅ No duplicate users found');
    }
    
    // Check for duplicate stories (same title and user_id)
    console.log('\n📋 Checking for duplicate stories...');
    const [duplicateStories] = await connection.query(`
      SELECT title, user_id, COUNT(*) as count
      FROM stories
      GROUP BY title, user_id
      HAVING count > 1
    `);
    
    if (duplicateStories.length > 0) {
      console.log(`❌ Found ${duplicateStories.length} duplicate story/stories:`);
      console.table(duplicateStories);
      
      for (const dup of duplicateStories) {
        await connection.query(`
          DELETE FROM stories 
          WHERE title = ? AND user_id = ?
          AND id NOT IN (
            SELECT * FROM (
              SELECT MIN(id) FROM stories 
              WHERE title = ? AND user_id = ?
            ) as temp
          )
        `, [dup.title, dup.user_id, dup.title, dup.user_id]);
        console.log(`✅ Removed duplicate stories: ${dup.title}`);
      }
    } else {
      console.log('✅ No duplicate stories found');
    }
    
    // Check for duplicate chapters (same story_id and chapter_order)
    console.log('\n📋 Checking for duplicate chapters...');
    const [duplicateChapters] = await connection.query(`
      SELECT story_id, chapter_order, COUNT(*) as count
      FROM chapters
      GROUP BY story_id, chapter_order
      HAVING count > 1
    `);
    
    if (duplicateChapters.length > 0) {
      console.log(`❌ Found ${duplicateChapters.length} duplicate chapter(s):`);
      console.table(duplicateChapters);
      
      for (const dup of duplicateChapters) {
        await connection.query(`
          DELETE FROM chapters 
          WHERE story_id = ? AND chapter_order = ?
          AND id NOT IN (
            SELECT * FROM (
              SELECT MIN(id) FROM chapters 
              WHERE story_id = ? AND chapter_order = ?
            ) as temp
          )
        `, [dup.story_id, dup.chapter_order, dup.story_id, dup.chapter_order]);
        console.log(`✅ Removed duplicate chapters for story_id: ${dup.story_id}, chapter_order: ${dup.chapter_order}`);
      }
    } else {
      console.log('✅ No duplicate chapters found');
    }
    
    // Check for duplicate tags
    console.log('\n📋 Checking for duplicate tags...');
    const [duplicateTags] = await connection.query(`
      SELECT name, COUNT(*) as count
      FROM tags
      GROUP BY name
      HAVING count > 1
    `);
    
    if (duplicateTags.length > 0) {
      console.log(`❌ Found ${duplicateTags.length} duplicate tag(s):`);
      console.table(duplicateTags);
      
      for (const dup of duplicateTags) {
        // First, update story_tags to point to the oldest tag
        const [oldestTag] = await connection.query(`
          SELECT MIN(id) as id FROM tags WHERE name = ?
        `, [dup.name]);
        
        await connection.query(`
          UPDATE IGNORE story_tags 
          SET tag_id = ? 
          WHERE tag_id IN (SELECT id FROM tags WHERE name = ?)
        `, [oldestTag[0].id, dup.name]);
        
        // Then delete duplicate tags
        await connection.query(`
          DELETE FROM tags 
          WHERE name = ? AND id != ?
        `, [dup.name, oldestTag[0].id]);
        console.log(`✅ Removed duplicate tags: ${dup.name}`);
      }
    } else {
      console.log('✅ No duplicate tags found');
    }
    
    // Check for duplicate story_tags
    console.log('\n📋 Checking for duplicate story_tags...');
    const [duplicateStoryTags] = await connection.query(`
      SELECT story_id, tag_id, COUNT(*) as count
      FROM story_tags
      GROUP BY story_id, tag_id
      HAVING count > 1
    `);
    
    if (duplicateStoryTags.length > 0) {
      console.log(`❌ Found ${duplicateStoryTags.length} duplicate story_tag(s):`);
      console.table(duplicateStoryTags);
      
      // Remove duplicates from story_tags (keep one of each pair)
      await connection.query(`
        DELETE t1 FROM story_tags t1
        INNER JOIN story_tags t2 
        WHERE t1.story_id = t2.story_id 
          AND t1.tag_id = t2.tag_id 
          AND t1.rowid > t2.rowid
      `);
      console.log('✅ Removed duplicate story_tags');
    } else {
      console.log('✅ No duplicate story_tags found');
    }
    
    // Check for duplicate comments (same content, user, story, chapter at same time)
    console.log('\n📋 Checking for duplicate comments...');
    const [duplicateComments] = await connection.query(`
      SELECT story_id, chapter_id, user_id, content, created_at, COUNT(*) as count
      FROM story_comments
      GROUP BY story_id, chapter_id, user_id, content, created_at
      HAVING count > 1
    `);
    
    if (duplicateComments.length > 0) {
      console.log(`❌ Found ${duplicateComments.length} duplicate comment(s):`);
      console.table(duplicateComments);
      
      for (const dup of duplicateComments) {
        await connection.query(`
          DELETE FROM story_comments 
          WHERE story_id = ? 
            AND (chapter_id = ? OR (chapter_id IS NULL AND ? IS NULL))
            AND user_id = ? 
            AND content = ?
            AND created_at = ?
          AND id NOT IN (
            SELECT * FROM (
              SELECT MIN(id) FROM story_comments 
              WHERE story_id = ? 
                AND (chapter_id = ? OR (chapter_id IS NULL AND ? IS NULL))
                AND user_id = ? 
                AND content = ?
                AND created_at = ?
            ) as temp
          )
        `, [
          dup.story_id, dup.chapter_id, dup.chapter_id, dup.user_id, dup.content, dup.created_at,
          dup.story_id, dup.chapter_id, dup.chapter_id, dup.user_id, dup.content, dup.created_at
        ]);
        console.log(`✅ Removed duplicate comments`);
      }
    } else {
      console.log('✅ No duplicate comments found');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Duplicate check and cleanup completed!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the function
checkAndRemoveDuplicates();
