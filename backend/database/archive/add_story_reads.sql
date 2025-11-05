-- Add story_reads table to track unique reads per user per story
-- A read is counted when a user opens any chapter of a story for the first time

CREATE TABLE IF NOT EXISTS story_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NULL COMMENT 'NULL for anonymous/guest reads',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_story_reads_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_story_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_story_read (story_id, user_id) COMMENT 'Ensure one read per user per story',
  INDEX idx_story_reads_story (story_id),
  INDEX idx_story_reads_user (user_id),
  INDEX idx_story_reads_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
