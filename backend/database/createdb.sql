-- Wattpad-like DB schema (MySQL 8+). Fresh, end-to-end, idempotent.
DROP DATABASE IF EXISTS wattpad;
CREATE DATABASE wattpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wattpad;

-- Drop in dependency order (safety for re-run)
DROP TABLE IF EXISTS review_likes;
DROP TABLE IF EXISTS story_reviews;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS story_comments;
DROP TABLE IF EXISTS story_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS favorite_list_items;
DROP TABLE IF EXISTS favorite_lists;
DROP TABLE IF EXISTS story_reads;
DROP TABLE IF EXISTS followed_stories;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS reading_history;
DROP TABLE IF EXISTS story_read;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS users;

-- USERS
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500),
  bio           VARCHAR(500),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- STORIES
CREATE TABLE stories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  tags        JSON,
  cover_url   VARCHAR(500),
  status      ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stories_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_stories_user (user_id),
  FULLTEXT INDEX ftx_stories_title_desc (title, description)
) ENGINE=InnoDB;

-- CHAPTERS
CREATE TABLE chapters (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  story_id      INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  content       LONGTEXT,
  chapter_order INT NOT NULL,
  is_published  TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chapters_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_chapter_order (story_id, chapter_order),
  INDEX idx_chapters_story (story_id)
) ENGINE=InnoDB;

-- VOTES (per chapter)
CREATE TABLE votes (
  chapter_id INT NOT NULL,
  user_id    INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chapter_id, user_id),
  CONSTRAINT fk_votes_chapter
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_votes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- FOLLOWS (user follows author)
CREATE TABLE follows (
  follower_id INT NOT NULL,
  author_id   INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, author_id),
  CONSTRAINT fk_follows_follower
    FOREIGN KEY (follower_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_follows_author
    FOREIGN KEY (author_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- FOLLOWED STORIES (user subscribes to story)
CREATE TABLE followed_stories (
  user_id    INT NOT NULL,
  story_id   INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, story_id),
  CONSTRAINT fk_followed_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_followed_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- FAVORITE LISTS
CREATE TABLE favorite_lists (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  name       VARCHAR(255) NOT NULL,
  is_private TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favlists_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_favlists_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE favorite_list_items (
  list_id  INT NOT NULL,
  story_id INT NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, story_id),
  CONSTRAINT fk_favitems_list
    FOREIGN KEY (list_id) REFERENCES favorite_lists(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_favitems_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- TAGS
CREATE TABLE tags (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  usage_count INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE story_tags (
  story_id INT NOT NULL,
  tag_id   INT NOT NULL,
  PRIMARY KEY (story_id, tag_id),
  CONSTRAINT fk_storytags_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_storytags_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- COMMENTS (threaded, on story or specific chapter)
CREATE TABLE story_comments (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  story_id           INT NOT NULL,
  chapter_id         INT NULL,
  user_id            INT NOT NULL,
  content            VARCHAR(1000) NOT NULL,
  parent_comment_id  INT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comments_chapter
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comments_parent
    FOREIGN KEY (parent_comment_id) REFERENCES story_comments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_comments_story (story_id),
  INDEX idx_comments_chapter (chapter_id),
  INDEX idx_comments_parent (parent_comment_id),
  INDEX idx_comments_user (user_id)
) ENGINE=InnoDB;

-- READING HISTORY (resume point per user/story)
CREATE TABLE reading_history (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  story_id        INT NOT NULL,
  last_chapter_id INT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hist_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hist_last_chapter
    FOREIGN KEY (last_chapter_id) REFERENCES chapters(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY uq_hist_user_story (user_id, story_id),
  INDEX idx_hist_last_chapter (last_chapter_id)
) ENGINE=InnoDB;

-- STORY READS (for analytics; code expects this name)
CREATE TABLE story_reads (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  story_id   INT NOT NULL,
  chapter_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_storyreads_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_storyreads_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_storyreads_chapter
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_storyreads_user (user_id),
  INDEX idx_storyreads_story (story_id),
  INDEX idx_storyreads_chapter (chapter_id)
) ENGINE=InnoDB;

-- REVIEWS + LIKES
CREATE TABLE story_reviews (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  story_id       INT NOT NULL,
  user_id        INT NOT NULL,
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title          VARCHAR(255),
  content        VARCHAR(2000),
  is_recommended TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_review_per_user_story (story_id, user_id),
  INDEX idx_reviews_story (story_id),
  INDEX idx_reviews_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE review_likes (
  review_id INT NOT NULL,
  user_id   INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id),
  CONSTRAINT fk_reviewlikes_review
    FOREIGN KEY (review_id) REFERENCES story_reviews(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviewlikes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;