-- ================================================
-- WHATPAD DATABASE SCHEMA
-- Complete database creation script
-- MySQL 8+ with UTF8MB4 support for Vietnamese
-- ================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS wattpad;
CREATE DATABASE wattpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wattpad;

-- Set charset for current session
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ================================================
-- CORE TABLES
-- ================================================

-- 1. Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  password_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  avatar_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'Cloudinary image URL',
  bio VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Stories
CREATE TABLE stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  description VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  cover_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'Cloudinary image URL',
  status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Chapters
CREATE TABLE chapters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  chapter_order INT NOT NULL,
  is_published TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chapters_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tags
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  usage_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Story Tags (junction table)
CREATE TABLE story_tags (
  story_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (story_id, tag_id),
  CONSTRAINT fk_story_tags_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_story_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================================================
-- SOCIAL FEATURES
-- ================================================

-- 6. Story Reviews
CREATE TABLE story_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  content VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  is_recommended TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Review Likes
CREATE TABLE review_likes (
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id),
  CONSTRAINT fk_review_likes_review FOREIGN KEY (review_id) REFERENCES story_reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Story Comments (threaded)
CREATE TABLE story_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  chapter_id INT NULL COMMENT 'NULL = comment on story, otherwise comment on specific chapter',
  user_id INT NOT NULL,
  content VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  parent_comment_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES story_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Votes (per chapter)
CREATE TABLE votes (
  chapter_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chapter_id, user_id),
  CONSTRAINT fk_votes_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Follows (follow authors)
CREATE TABLE follows (
  follower_id INT NOT NULL,
  author_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, author_id),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Followed Stories
CREATE TABLE followed_stories (
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, story_id),
  CONSTRAINT fk_followed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_followed_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================================================
-- READING LISTS & TRACKING
-- ================================================

-- 12. Favorite Lists
CREATE TABLE favorite_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'My Favorite List',
  is_private TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fav_lists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Favorite List Items
CREATE TABLE favorite_list_items (
  list_id INT NOT NULL,
  story_id INT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, story_id),
  CONSTRAINT fk_fav_items_list FOREIGN KEY (list_id) REFERENCES favorite_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_items_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Reading Lists
CREATE TABLE reading_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  description VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  is_public TINYINT(1) DEFAULT 1 COMMENT '1=Public, 0=Private',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reading_lists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Reading List Stories
CREATE TABLE reading_list_stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reading_list_id INT NOT NULL,
  story_id INT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  display_order INT DEFAULT 0 COMMENT 'For custom ordering within a list',
  CONSTRAINT fk_reading_list_stories_list FOREIGN KEY (reading_list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_reading_list_stories_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_list_story (reading_list_id, story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Reading History
CREATE TABLE reading_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  last_chapter_id INT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_story (user_id, story_id),
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_last_chapter FOREIGN KEY (last_chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 17. Story Reads (tracking unique reads)
CREATE TABLE story_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NULL COMMENT 'NULL for anonymous/guest reads',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_story_reads_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_story_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_story_read (story_id, user_id) COMMENT 'Ensure one read per user per story'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_stories_user ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_chapters_story ON chapters(story_id);
CREATE INDEX idx_chapters_pub ON chapters(story_id, chapter_order, is_published);
CREATE INDEX idx_story_reviews_story ON story_reviews(story_id);
CREATE INDEX idx_story_reviews_user ON story_reviews(user_id);
CREATE INDEX idx_review_likes_review ON review_likes(review_id);
CREATE INDEX idx_story_comments_story ON story_comments(story_id);
CREATE INDEX idx_story_comments_chapter ON story_comments(chapter_id);
CREATE INDEX idx_story_tags_tag ON story_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_follows_author ON follows(author_id);
CREATE INDEX idx_favorite_lists_user ON favorite_lists(user_id);
CREATE INDEX idx_favorite_list_items_list ON favorite_list_items(list_id);
CREATE INDEX idx_followed_stories_user ON followed_stories(user_id);
CREATE INDEX idx_followed_stories_story ON followed_stories(story_id);
CREATE INDEX idx_reading_lists_user ON reading_lists(user_id);
CREATE INDEX idx_reading_list_stories_list ON reading_list_stories(reading_list_id);
CREATE INDEX idx_reading_list_stories_story ON reading_list_stories(story_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_reading_history_story ON reading_history(story_id);
CREATE INDEX idx_story_reads_story ON story_reads(story_id);
CREATE INDEX idx_story_reads_user ON story_reads(user_id);
CREATE INDEX idx_story_reads_created ON story_reads(created_at);

-- ================================================
-- SEED DEFAULT TAGS
-- ================================================

INSERT INTO tags (name, usage_count) VALUES
('Romance', 10),
('Fantasy', 8),
('Martial Arts', 1),
('Urban', 1),
('Sci-Fi', 5),
('Mystery', 6),
('Horror', 3),
('Comedy', 4),
('Fanfiction', 1),
('LGBTQ+', 1),
('Isekai', 1),
('Historical', 1),
('Modern', 1),
('BL', 1),
('GL', 1),
('School', 1),
('Game', 1),
('Military', 1),
('Tình Cảm', 1),
('Phiêu Lưu', 1),
('Hài Hước', 1),
('Kinh Dị', 1),
('Trinh Thám', 1),
('Thriller', 7),
('Drama', 9),
('Adventure', 8);

-- ================================================
-- COMPLETION MESSAGE
-- ================================================

SELECT 'Database created successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'wattpad';
SELECT COUNT(*) as total_tags FROM tags;
