-- Script để fix bảng votes nếu có tên column sai

-- 1. Check current structure
SHOW COLUMNS FROM votes;

-- 2. Nếu bảng votes không tồn tại hoặc sai structure, drop và tạo lại:
DROP TABLE IF EXISTS votes;

CREATE TABLE votes (
  chapter_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chapter_id, user_id),
  CONSTRAINT fk_votes_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Check story_comments table structure
SHOW COLUMNS FROM story_comments;

-- 4. Nếu story_comments thiếu chapter_id column:
-- ALTER TABLE story_comments ADD COLUMN chapter_id INT NULL AFTER story_id;
-- ALTER TABLE story_comments ADD CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE;

SELECT 'Tables checked and fixed!' as status;

