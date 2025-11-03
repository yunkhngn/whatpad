-- Migration: Add tags support and cascade delete for chapters
-- Date: 2025-11-03
-- Description: Add tags table, tags column to stories, and update foreign key for chapters

USE wattpad;

-- 1. Drop existing foreign key and add with CASCADE delete
ALTER TABLE chapters DROP FOREIGN KEY IF EXISTS chapters_ibfk_1;

ALTER TABLE chapters 
ADD CONSTRAINT chapters_ibfk_1 
FOREIGN KEY (story_id) REFERENCES stories(id) 
ON DELETE CASCADE;

-- 2. Check and add tags column to stories table if not exists
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'wattpad'
    AND TABLE_NAME = 'stories' 
    AND COLUMN_NAME = 'tags'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE stories ADD COLUMN tags JSON AFTER description', 
    'SELECT "Column tags already exists in stories table" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Create tags table if not exists
CREATE TABLE IF NOT EXISTS tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  usage_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Insert common tags with modern syntax
INSERT INTO tags (name, usage_count) VALUES
('Romance', 10),
('Fantasy', 8),
('Mystery', 6),
('Sci-Fi', 5),
('Thriller', 7),
('Comedy', 4),
('Drama', 9),
('Horror', 3),
('Action', 6),
('Adventure', 8)
AS new_tags
ON DUPLICATE KEY UPDATE usage_count = new_tags.usage_count;

-- 5. Verify the changes
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_tags FROM tags;
SELECT * FROM tags ORDER BY usage_count DESC;
