-- Add Reading Lists feature
-- This allows users to create custom lists to organize stories

USE wattpad;

-- 1. Reading Lists table
CREATE TABLE IF NOT EXISTS reading_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  description VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  is_public TINYINT(1) DEFAULT 1 COMMENT '1=Public, 0=Private',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reading_lists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reading_lists_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Reading List Stories (junction table)
CREATE TABLE IF NOT EXISTS reading_list_stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reading_list_id INT NOT NULL,
  story_id INT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  display_order INT DEFAULT 0 COMMENT 'For custom ordering within a list',
  CONSTRAINT fk_reading_list_stories_list FOREIGN KEY (reading_list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_reading_list_stories_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_list_story (reading_list_id, story_id),
  INDEX idx_reading_list_stories_list (reading_list_id),
  INDEX idx_reading_list_stories_story (story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add some sample data (optional)
-- Uncomment below if you want to test with sample data

/*
INSERT INTO reading_lists (user_id, name, description, is_public) VALUES
(1, 'Favorites', 'My favorite stories', 1),
(1, 'To Read Later', 'Stories I want to read', 0);
*/
