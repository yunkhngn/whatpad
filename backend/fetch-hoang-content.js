const pool = require('./src/db');

async function fetchHoangContent() {
    try {
        // First, find Hoang's user ID
        const [users] = await pool.query('SELECT id, username FROM users WHERE username = ?', ['Hoang']);
        
        if (users.length === 0) {
            console.log('User Hoang not found');
            await pool.end();
            return;
        }
        
        const hoangId = users[0].id;
        console.log(`\n=== User Hoang (ID: ${hoangId}) ===\n`);
        
        // Fetch all stories by Hoang
        const [stories] = await pool.query(`
            SELECT 
                s.id,
                s.title,
                s.description,
                s.status,
                s.created_at,
                (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count
            FROM stories s
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        `, [hoangId]);
        
        console.log(`\n📚 STORIES (${stories.length} total):\n`);
        
        if (stories.length === 0) {
            console.log('No stories found for user Hoang\n');
        } else {
            for (const story of stories) {
                console.log(`Story ID: ${story.id}`);
                console.log(`Title: ${story.title}`);
                console.log(`Description: ${story.description?.substring(0, 100)}...`);
                console.log(`Status: ${story.status}`);
                console.log(`Chapters: ${story.chapter_count}`);
                console.log(`Created: ${story.created_at}`);
                
                // Fetch chapters for this story
                const [chapters] = await pool.query(`
                    SELECT id, title, chapter_order, content, created_at
                    FROM chapters
                    WHERE story_id = ?
                    ORDER BY chapter_order ASC
                `, [story.id]);
                
                if (chapters.length > 0) {
                    console.log(`\n  📖 Chapters for "${story.title}":`);
                    chapters.forEach(chapter => {
                        console.log(`    - Chapter ${chapter.chapter_order}: ${chapter.title} (ID: ${chapter.id})`);
                        console.log(`      Content preview: ${chapter.content?.substring(0, 80)}...`);
                    });
                }
                console.log('\n---\n');
            }
        }
        
        // Also check for orphaned chapters (chapters not linked to stories)
        const [orphanedChapters] = await pool.query(`
            SELECT c.* 
            FROM chapters c
            LEFT JOIN stories s ON c.story_id = s.id
            WHERE s.user_id = ? OR s.id IS NULL
            ORDER BY c.created_at DESC
        `, [hoangId]);
        
        if (orphanedChapters.length > 0) {
            console.log(`\n⚠️  ORPHANED/ALL CHAPTERS (${orphanedChapters.length} total):\n`);
            orphanedChapters.forEach(chapter => {
                console.log(`Chapter ID: ${chapter.id}`);
                console.log(`Story ID: ${chapter.story_id}`);
                console.log(`Title: ${chapter.title}`);
                console.log(`Chapter Order: ${chapter.chapter_order}`);
                console.log('---');
            });
        }
        
        await pool.end();
    } catch (err) {
        console.error('Error:', err);
        await pool.end();
    }
}

fetchHoangContent();
