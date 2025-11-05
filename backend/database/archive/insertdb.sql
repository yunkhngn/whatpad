-- Users
INSERT INTO users (username, email, password_hash, bio)
VALUES
('alice', 'alice@example.com', '$2b$10$ExampleHashForAlice123', 'Tác giả yêu thích thể loại Romance'),
('bob', 'bob@example.com', '$2b$10$ExampleHashForBob123', 'Fan truyện Fantasy');

-- Tags
INSERT INTO tags (name)
VALUES
('Romance'), ('Fantasy'), ('Comedy'), ('Sci-Fi'), ('Mystery')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Stories (đã đổi author_id -> user_id)
INSERT INTO stories (user_id, title, description, status)
VALUES
(2, 'Ánh Trăng Và Em', 'Một câu chuyện tình nhẹ nhàng giữa hai tâm hồn lạc lối.', 'published'),
(2, 'Hành Tinh Song Song', 'Khoa học viễn tưởng về thế giới song song và định mệnh.', 'draft'),
(3, 'Kẻ Lang Thang Trong Mê Cung', 'Một anh hùng lạc vào mê cung huyền thoại.', 'published');

-- Story Tags
INSERT INTO story_tags (story_id, tag_id)
VALUES
(1, 1), (1, 3),
(2, 4),
(3, 2), (3, 5);

-- Chapters
INSERT INTO chapters (story_id, title, content, chapter_order, is_published)
VALUES
(1, 'Chương 1: Gặp gỡ', 'Nội dung chương 1...', 1, 1),
(1, 'Chương 2: Dưới ánh trăng', 'Nội dung chương 2...', 2, 1),
(3, 'Chương 1: Lạc vào mê cung', 'Mở đầu hành trình...', 1, 1);

-- Story Reviews
INSERT INTO story_reviews (story_id, user_id, rating, title, content, is_recommended)
VALUES
(1, 3, 5, 'Cảm động và nhẹ nhàng', 'Truyện hay, cảm xúc chân thật.', 1),
(3, 2, 4, 'Kịch tính', 'Plot twist khá hay.', 1);

-- Review Likes
INSERT INTO review_likes (review_id, user_id)
VALUES
(1, 2),
(2, 3);

-- Story Comments
INSERT INTO story_comments (story_id, user_id, content)
VALUES
(1, 3, 'Đọc mà rơi nước mắt luôn'),
(3, 2, 'Kết mở, mong tác giả ra thêm chương mới!');

-- Votes
INSERT INTO votes (chapter_id, user_id)
VALUES
(1, 2),
(2, 3),
(3, 2);

-- Follows
INSERT INTO follows (follower_id, author_id)
VALUES
(3, 2),
(2, 3);

-- Favorite Lists
INSERT INTO favorite_lists (user_id, name, is_private)
VALUES
(2, 'Romance Collection', 0),
(3, 'Adventure Picks', 0);

-- Favorite List Items
INSERT INTO favorite_list_items (list_id, story_id)
VALUES
(1, 1),
(2, 3);

-- Followed Stories
INSERT INTO followed_stories (user_id, story_id)
VALUES
(2, 1),
(3, 3);

-- Reading History
INSERT INTO reading_history (user_id, story_id, last_chapter_id)
VALUES
(2, 1, 2),
(3, 3, 3);