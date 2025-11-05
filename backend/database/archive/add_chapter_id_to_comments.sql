-- Migration: Add chapter_id to story_comments table
-- Date: 2024-10-27
-- Reason: Support comments on specific chapters

USE wattpad;

-- Check if column already exists
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'wattpad' 
      AND TABLE_NAME = 'story_comments' 
      AND COLUMN_NAME = 'chapter_id'
);

-- Add chapter_id column only if it doesn't exist
SET @add_column = IF(@col_exists = 0,
    'ALTER TABLE story_comments ADD COLUMN chapter_id INT NULL COMMENT "NULL = comment on story, otherwise comment on specific chapter" AFTER story_id',
    'SELECT "Column chapter_id already exists" as message'
);

PREPARE stmt FROM @add_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if not exists
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'wattpad' 
      AND TABLE_NAME = 'story_comments' 
      AND CONSTRAINT_NAME = 'fk_comments_chapter'
);

SET @add_fk = IF(@fk_exists = 0,
    'ALTER TABLE story_comments ADD CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE',
    'SELECT "Foreign key fk_comments_chapter already exists" as message'
);

PREPARE stmt2 FROM @add_fk;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Verify the change
DESCRIBE story_comments;

SELECT 'Migration completed successfully!' as status;

