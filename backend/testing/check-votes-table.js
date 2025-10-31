const pool = require('../src/db');

async function checkVotesTable() {
  console.log('Checking votes table structure...\n');

  try {
    // Check table structure
    const [structure] = await pool.query('DESCRIBE votes');
    console.log('Table structure:');
    console.table(structure);

    // Check for unique/primary keys
    const [indexes] = await pool.query('SHOW INDEX FROM votes');
    console.log('\nIndexes:');
    console.table(indexes);

    // Check current votes for user 6, chapter 4
    const [votes] = await pool.query(
      'SELECT * FROM votes WHERE user_id = 6 AND chapter_id = 4'
    );
    console.log('\nCurrent votes for user 6, chapter 4:');
    console.table(votes);

    // Check total votes for chapter 4
    const [count] = await pool.query(
      'SELECT COUNT(*) as count FROM votes WHERE chapter_id = 4'
    );
    console.log(`\nTotal votes for chapter 4: ${count[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkVotesTable();
