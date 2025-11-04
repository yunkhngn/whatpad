const mysql = require('mysql2/promise');

async function deleteNumericTags() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'sa',
    password: '123',
    database: 'wattpad'
  });

  try {
    console.log('🔍 Finding numeric-only tags...');
    
    // Find numeric tags
    const [numericTags] = await pool.query(
      'SELECT id, name FROM tags WHERE name REGEXP \'^[0-9]+$\' ORDER BY name'
    );
    
    if (numericTags.length === 0) {
      console.log('✅ No numeric-only tags found!');
    } else {
      console.log(`Found ${numericTags.length} numeric tags:`, numericTags.map(t => t.name).join(', '));
      
      // Delete story_tags associations first
      for (const tag of numericTags) {
        await pool.query('DELETE FROM story_tags WHERE tag_id = ?', [tag.id]);
      }
      
      // Delete the tags
      const [result] = await pool.query('DELETE FROM tags WHERE name REGEXP \'^[0-9]+$\'');
      console.log(`✅ Deleted ${result.affectedRows} numeric tags`);
    }
    
    // Show remaining tags
    const [remainingTags] = await pool.query('SELECT id, name FROM tags ORDER BY name');
    console.log(`\n📋 Remaining ${remainingTags.length} tags:`);
    remainingTags.forEach(tag => console.log(`  - ${tag.id}: ${tag.name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

deleteNumericTags();
