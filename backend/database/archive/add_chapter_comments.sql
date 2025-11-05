-- Add chapter_id column to story_comments table
USE wattpad;

-- Add chapter_id column to allow comments on specific chapters
ALTER TABLE story_comments 
ADD COLUMN chapter_id INT NULL COMMENT 'NULL = comment on story, otherwise comment on specific chapter' AFTER story_id;

-- Add foreign key constraint
ALTER TABLE story_comments 
ADD CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_story_comments_chapter ON story_comments(chapter_id);

SELECT 'Chapter ID column added to story_comments table successfully!' as message;
