const mysql = require('mysql2/promise');

async function fixVietnameseData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'sa',
    password: '123',
    database: 'wattpad',
    charset: 'utf8mb4'
  });

  try {
    console.log('✅ Connected to MySQL');
    console.log('🔄 Updating Vietnamese data...\n');

    // Update stories
    await connection.query(`
      UPDATE stories 
      SET title = 'Ánh Trăng Và Em',
          description = 'Một câu chuyện tình nhẹ nhàng giữa hai tâm hồn lạc lối trong đêm trăng sáng. Tình yêu đầu đời ngây thơ và trong trẻo của hai người trẻ.'
      WHERE id = 1
    `);
    console.log('  ✓ Updated story 1: Ánh Trăng Và Em');

    await connection.query(`
      UPDATE stories 
      SET title = 'Hành Tinh Song Song',
          description = 'Khoa học viễn tưởng về thế giới song song và định mệnh. Liệu có thể thay đổi số phận khi biết trước tương lai?'
      WHERE id = 2
    `);
    console.log('  ✓ Updated story 2: Hành Tinh Song Song');

    await connection.query(`
      UPDATE stories 
      SET title = 'Kẻ Lang Thang Trong Mê Cung',
          description = 'Một anh hùng lạc vào mê cung huyền thoại, phải vượt qua những thử thách khó khăn để tìm đường về nhà.'
      WHERE id = 3
    `);
    console.log('  ✓ Updated story 3: Kẻ Lang Thang Trong Mê Cung');

    // Update chapters
    await connection.query(`
      UPDATE chapters 
      SET title = 'Chương 1: Gặp Gỡ Định Mệnh',
          content = 'Đêm trăng sáng, hai con người xa lạ gặp nhau dưới tán cây cổ thụ. Ánh trăng nhẹ nhàng soi sáng khuôn mặt em, làm lòng anh chợt rung động...'
      WHERE id = 1
    `);
    console.log('  ✓ Updated chapter 1');

    await connection.query(`
      UPDATE chapters 
      SET title = 'Chương 1: Khám Phá Thế Giới Song Song',
          content = 'Nhà khoa học trẻ phát hiện ra cách mở cổng thông nối hai thế giới. Cuộc phiêu lưu đầy nguy hiểm bắt đầu...'
      WHERE id = 2
    `);
    console.log('  ✓ Updated chapter 2');

    await connection.query(`
      UPDATE chapters 
      SET title = 'Chương 1: Lạc Vào Mê Cung',
          content = 'Mở đầu hành trình khám phá mê cung huyền thoại. Những bí ẩn cổ xưa từ từ được hé lộ...'
      WHERE id = 3
    `);
    console.log('  ✓ Updated chapter 3');

    console.log('\n🧪 Testing updated data...');
    const [stories] = await connection.query('SELECT id, title FROM stories');
    console.log('\n📚 Updated Stories:');
    stories.forEach(story => {
      console.log(`  ${story.id}. ${story.title}`);
    });

    await connection.end();
    console.log('\n🎉 Vietnamese data updated successfully!');
    console.log('✅ Now refresh your browser to see the changes!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await connection.end();
  }
}

fixVietnameseData();
