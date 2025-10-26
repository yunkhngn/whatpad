-- XÓA VÀ TẠO MỚI HOÀN TOÀN (MySQL 8+ với hỗ trợ tiếng Việt)
-- Đảm bảo tất cả các cột text đều sử dụng UTF8MB4 để hiển thị đúng ký tự tiếng Việt

DROP DATABASE IF EXISTS wattpad;
CREATE DATABASE wattpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wattpad;

-- Set charset cho session hiện tại
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- 2. Stories (đổi author_id -> user_id)
CREATE TABLE stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  description VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  cover_url VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'Cloudinary image URL',
  status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stories_user FOREIGN KEY (user_id) REFERENCES users(id)
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
  CONSTRAINT fk_chapters_story FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tags
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  content VARCHAR(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  is_recommended TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Review Likes
CREATE TABLE review_likes (
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id),
  CONSTRAINT fk_review_likes_review FOREIGN KEY (review_id) REFERENCES story_reviews(id),
  CONSTRAINT fk_review_likes_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 8. Story Comments (threaded) - Can be on story or specific chapter
CREATE TABLE story_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  chapter_id INT NULL COMMENT 'NULL = comment on story, otherwise comment on specific chapter',
  user_id INT NOT NULL,
  content VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  parent_comment_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES story_comments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'My Favorite List',
  is_private TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fav_lists_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
CREATE INDEX idx_story_comments_chapter ON story_comments(chapter_id);
CREATE INDEX idx_story_tags_tag ON story_tags(tag_id);
CREATE INDEX idx_follows_author ON follows(author_id);
CREATE INDEX idx_favorite_lists_user ON favorite_lists(user_id);
CREATE INDEX idx_favorite_list_items_list ON favorite_list_items(list_id);
CREATE INDEX idx_followed_stories_user ON followed_stories(user_id);
CREATE INDEX idx_followed_stories_story ON followed_stories(story_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_reading_history_story ON reading_history(story_id);

-- Seed tags (Tiếng Việt và English)
INSERT INTO tags (name) VALUES
('Romance'), ('Fantasy'), ('Martial Arts'), ('Urban'), ('Sci-Fi'),
('Mystery'), ('Horror'), ('Comedy'), ('Fanfiction'), ('LGBTQ+'),
('Isekai'), ('Historical'), ('Modern'), ('BL'), ('GL'),
('School'), ('Game'), ('Military'),
('Tình Cảm'), ('Phiêu Lưu'), ('Hài Hước'), ('Kinh Dị'), ('Trinh Thám');

-- Seed admin và test users
INSERT INTO users (username, email, password_hash, bio)
VALUES 
('admin', 'admin@wattpad.com', '$2b$10$ExampleHashForAdmin123', 'Quản trị viên hệ thống'),
('alice', 'alice@example.com', '$2b$10$ExampleHashForAlice123', 'Tác giả yêu thích thể loại Romance và Drama'),
('bob', 'bob@example.com', '$2b$10$ExampleHashForBob123', 'Fan truyện Fantasy, thích phiêu lưu mạo hiểm');

-- Seed sample stories với tiếng Việt
INSERT INTO stories (user_id, title, description, status)
VALUES
(2, 'Ánh Trăng Và Em', 'Một câu chuyện tình nhẹ nhàng giữa hai tâm hồn lạc lối trong đêm trăng sáng. Tình yêu đầu đời ngây thơ và trong trẻo của hai người trẻ.', 'published'),
(2, 'Hành Tinh Song Song', 'Khoa học viễn tưởng về thế giới song song và định mệnh. Liệu có thể thay đổi số phận khi biết trước tương lai?', 'published'),
(3, 'Kẻ Lang Thang Trong Mê Cung', 'Một anh hùng lạc vào mê cung huyền thoại, phải vượt qua những thử thách khó khăn để tìm đường về nhà.', 'published');

-- Seed sample chapters
INSERT INTO chapters (story_id, title, content, chapter_order, is_published)
VALUES
(1, 'Chương 1: Gặp Gỡ Định Mệnh', 'Đêm trăng sáng, hai con người xa lạ gặp nhau dưới tán cây cổ thụ. Ánh trăng nhẹ nhàng soi sáng khuôn mặt em, làm lòng anh chợt rung động...', 1, 1),
(2, 'Chương 1: Khám Phá Thế Giới Song Song', 'Nhà khoa học trẻ phát hiện ra cách mở cổng thông nối hai thế giới. Cuộc phiêu lưu đầy nguy hiểm bắt đầu...', 1, 1),
(3, 'Chương 1: Lạc Vào Mê Cung', 'Mở đầu hành trình khám phá mê cung huyền thoại. Những bí ẩn cổ xưa từ từ được hé lộ...', 1, 1);