-- Check structure của bảng votes
DESCRIBE votes;

-- Nếu lỗi "chapter_id not found", chạy câu lệnh sau để xem tên column thực tế:
SHOW COLUMNS FROM votes;

-- Expected structure:
-- chapter_id INT NOT NULL
-- user_id INT NOT NULL  
-- created_at DATETIME

-- Nếu column name khác, chạy ALTER TABLE để fix:
-- ALTER TABLE votes CHANGE old_column_name chapter_id INT NOT NULL;

