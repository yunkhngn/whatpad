-- XÓA VÀ TẠO MỚI HOÀN TOÀN (MySQL 8+)

DROP DATABASE IF EXISTS wattpad;
CREATE DATABASE wattpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wattpad;

-- 1. Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_base64 LONGTEXT NULL,
  bio VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Stories (đổi author_id -> user_id)
CREATE TABLE stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NULL,
  cover_base64 LONGTEXT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stories_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 3. Chapters
CREATE TABLE chapters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  chapter_order INT NOT NULL,
  is_published TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chapters_story FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB;

-- 4. Tags
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 5. Story Tags (junction)
CREATE TABLE story_tags (
  story_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (story_id, tag_id),
  CONSTRAINT fk_story_tags_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_story_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
) ENGINE=InnoDB;

-- 6. Story Reviews
CREATE TABLE story_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  title VARCHAR(255) NULL,
  content VARCHAR(2000) NOT NULL,
  is_recommended TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 7. Review Likes
CREATE TABLE review_likes (
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id),
  CONSTRAINT fk_review_likes_review FOREIGN KEY (review_id) REFERENCES story_reviews(id),
  CONSTRAINT fk_review_likes_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 8. Story Comments (threaded)
CREATE TABLE story_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  content VARCHAR(1000) NOT NULL,
  parent_comment_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES story_comments(id)
) ENGINE=InnoDB;

-- 9. Votes (per chapter)
CREATE TABLE votes (
  chapter_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chapter_id, user_id),
  CONSTRAINT fk_votes_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 10. Follows (theo dõi tác giả = user)
CREATE TABLE follows (
  follower_id INT NOT NULL,
  author_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, author_id),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id),
  CONSTRAINT fk_follows_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 11. Favorite Lists
CREATE TABLE favorite_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'My Favorite List',
  is_private TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fav_lists_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 12. Favorite List Items
CREATE TABLE favorite_list_items (
  list_id INT NOT NULL,
  story_id INT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, story_id),
  CONSTRAINT fk_fav_items_list FOREIGN KEY (list_id) REFERENCES favorite_lists(id),
  CONSTRAINT fk_fav_items_story FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB;

-- 13. Followed Stories
CREATE TABLE followed_stories (
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, story_id),
  CONSTRAINT fk_followed_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_followed_story FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB;

-- 14. Reading History
CREATE TABLE reading_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  last_chapter_id INT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_history_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_history_last_chapter FOREIGN KEY (last_chapter_id) REFERENCES chapters(id)
) ENGINE=InnoDB;

-- Indexes (đổi idx_stories_author -> idx_stories_user)
CREATE INDEX idx_stories_user ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_chapters_story ON chapters(story_id);
CREATE INDEX idx_chapters_pub ON chapters(story_id, chapter_order, is_published);
CREATE INDEX idx_story_reviews_story ON story_reviews(story_id);
CREATE INDEX idx_story_reviews_user ON story_reviews(user_id);
CREATE INDEX idx_review_likes_review ON review_likes(review_id);
CREATE INDEX idx_story_comments_story ON story_comments(story_id);
CREATE INDEX idx_story_tags_tag ON story_tags(tag_id);
CREATE INDEX idx_follows_author ON follows(author_id);
CREATE INDEX idx_favorite_lists_user ON favorite_lists(user_id);
CREATE INDEX idx_favorite_list_items_list ON favorite_list_items(list_id);
CREATE INDEX idx_followed_stories_user ON followed_stories(user_id);
CREATE INDEX idx_followed_stories_story ON followed_stories(story_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_reading_history_story ON reading_history(story_id);

-- Seed tags
INSERT INTO tags (name) VALUES
('Romance'), ('Fantasy'), ('Martial Arts'), ('Urban'), ('Sci-Fi'),
('Mystery'), ('Horror'), ('Comedy'), ('Fanfiction'), ('LGBTQ+'),
('Isekai'), ('Historical'), ('Modern'), ('BL'), ('GL'),
('School'), ('Game'), ('Military');

-- Seed admin (hash chỉ minh họa)
INSERT INTO users (username, email, password_hash, bio)
VALUES ('admin', 'admin@wattpad.com', '$2b$10$ExampleHashForAdmin123', 'Quản trị viên hệ thống');