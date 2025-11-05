-- ================================================
-- WHATPAD SAMPLE DATA
-- Insert sample data for testing
-- ================================================

USE wattpad;

-- ================================================
-- SAMPLE USERS
-- ================================================

INSERT INTO users (username, email, password_hash, bio)
VALUES
('admin', 'admin@whatpad.com', '$2b$10$ExampleHashForAdmin123', 'System Administrator'),
('alice', 'alice@example.com', '$2b$10$ExampleHashForAlice123', 'Tác giả yêu thích thể loại Romance và Drama'),
('bob', 'bob@example.com', '$2b$10$ExampleHashForBob123', 'Fan truyện Fantasy, thích phiêu lưu mạo hiểm'),
('charlie', 'charlie@example.com', '$2b$10$ExampleHashForCharlie123', 'Người đọc đam mê Mystery và Thriller');

-- ================================================
-- SAMPLE STORIES
-- ================================================

INSERT INTO stories (user_id, title, description, status)
VALUES
-- Alice's stories
(2, 'Ánh Trăng Và Em', 'Một câu chuyện tình nhẹ nhàng giữa hai tâm hồn lạc lối trong đêm trăng sáng. Tình yêu đầu đời ngây thơ và trong trẻo của hai người trẻ.', 'published'),
(2, 'Hành Tinh Song Song', 'Khoa học viễn tưởng về thế giới song song và định mệnh. Liệu có thể thay đổi số phận khi biết trước tương lai?', 'published'),
(2, 'Nơi Con Tim Dừng Lại', 'Drama tình yêu đầy cảm động về sự chia ly và trở lại.', 'draft'),
-- Bob's stories
(3, 'Kẻ Lang Thang Trong Mê Cung', 'Một anh hùng lạc vào mê cung huyền thoại, phải vượt qua những thử thách khó khăn để tìm đường về nhà.', 'published'),
(3, 'Hành Trình Vào Thế Giới Ma Thuật', 'Fantasy epic về một cậu bé thường dân phát hiện ra sức mạnh ma thuật của mình.', 'published');

-- ================================================
-- STORY TAGS ASSOCIATIONS
-- ================================================

INSERT INTO story_tags (story_id, tag_id)
VALUES
-- Ánh Trăng Và Em: Romance, Drama
(1, 1), (1, 25),
-- Hành Tinh Song Song: Sci-Fi, Thriller
(2, 5), (2, 24),
-- Nơi Con Tim Dừng Lại: Romance, Drama
(3, 1), (3, 25),
-- Kẻ Lang Thang Trong Mê Cung: Fantasy, Adventure
(4, 2), (4, 26),
-- Hành Trình Vào Thế Giới Ma Thuật: Fantasy, Mystery
(5, 2), (5, 6);

-- ================================================
-- SAMPLE CHAPTERS
-- ================================================

INSERT INTO chapters (story_id, title, content, chapter_order, is_published)
VALUES
-- Chapters for Story 1: Ánh Trăng Và Em
(1, 'Chương 1: Gặp Gỡ Định Mệnh', 
'Đêm trăng sáng, hai con người xa lạ gặp nhau dưới tán cây cổ thụ. Ánh trăng nhẹ nhàng soi sáng khuôn mặt em, làm lòng anh chợt rung động...

"Em có tin vào tình yêu từ cái nhìn đầu tiên không?" Anh hỏi.

Em chỉ cười nhẹ, không trả lời, nhưng ánh mắt em đã nói lên tất cả.', 1, 1),

(1, 'Chương 2: Dưới Ánh Trăng', 
'Những buổi tối sau đó, họ lại gặp nhau ở cùng một nơi. Từng câu chuyện, từng nụ cười làm khoảng cách giữa hai trái tim ngày càng gần hơn.', 2, 1),

(1, 'Chương 3: Lời Hứa', 
'Dưới bầu trời đầy sao, anh đưa tay nắm lấy tay em: "Em có thể tin anh được không? Anh sẽ luôn ở bên em."', 3, 1),

-- Chapters for Story 2: Hành Tinh Song Song
(2, 'Chương 1: Khám Phá Thế Giới Song Song', 
'Nhà khoa học trẻ phát hiện ra cách mở cổng thông nối hai thế giới. Cuộc phiêu lưu đầy nguy hiểm bắt đầu khi anh bước qua cánh cổng huyền bí...', 1, 1),

(2, 'Chương 2: Gặp Phiên Bản Khác Của Mình', 
'Điều kinh ngạc nhất là anh gặp một phiên bản khác của chính mình - một người có cuộc sống hoàn toàn khác biệt.', 2, 1),

-- Chapters for Story 4: Kẻ Lang Thang Trong Mê Cung
(4, 'Chương 1: Lạc Vào Mê Cung', 
'Mở đầu hành trình khám phá mê cung huyền thoại. Những bí ẩn cổ xưa từ từ được hé lộ khi anh ta đối mặt với những thử thách đầu tiên...', 1, 1),

(4, 'Chương 2: Quái Vật Đầu Tiên', 
'Tiếng gầm vang lên trong bóng tối. Một sinh vật khổng lồ xuất hiện, đôi mắt đỏ rực nhìn thẳng vào anh...', 2, 1),

(4, 'Chương 3: Bản Đồ Cổ', 
'Trong ngăn kéo cũ kỹ, anh tìm thấy một bản đồ. Có phải đây là chìa khóa để thoát khỏi mê cung?', 3, 1),

-- Chapters for Story 5: Hành Trình Vào Thế Giới Ma Thuật
(5, 'Chương 1: Phát Hiện Sức Mạnh', 
'Cậu bé thường dân bỗng nhiên phát hiện ra khả năng điều khiển lửa. Cuộc đời cậu thay đổi hoàn toàn từ đây...', 1, 1),

(5, 'Chương 2: Học Viện Ma Pháp', 
'Cậu được mời vào học viện ma pháp danh tiếng. Nhưng không phải tất cả đều chào đón cậu...', 2, 1);

-- ================================================
-- SAMPLE REVIEWS
-- ================================================

INSERT INTO story_reviews (story_id, user_id, rating, title, content, is_recommended)
VALUES
(1, 3, 5, 'Cảm động và nhẹ nhàng', 'Truyện hay, cảm xúc chân thật. Tác giả viết rất tâm huyết!', 1),
(1, 4, 5, 'Xuất sắc!', 'Không thể bỏ xuống! Đọc một mạch từ đầu đến cuối.', 1),
(4, 2, 4, 'Kịch tính', 'Plot twist khá hay, mong tác giả ra chương mới nhanh hơn.', 1),
(5, 4, 5, 'Thế giới ma thuật tuyệt vời', 'Worldbuilding rất chi tiết và hấp dẫn!', 1);

-- ================================================
-- REVIEW LIKES
-- ================================================

INSERT INTO review_likes (review_id, user_id)
VALUES
(1, 2), (1, 4),
(2, 2),
(3, 3), (3, 4),
(4, 2), (4, 3);

-- ================================================
-- SAMPLE COMMENTS
-- ================================================

INSERT INTO story_comments (story_id, chapter_id, user_id, content)
VALUES
-- Comments on Story 1
(1, 1, 3, 'Đọc mà rơi nước mắt luôn 😢'),
(1, 1, 4, 'Chương mở đầu rất hấp dẫn!'),
(1, 2, 3, 'Hai nhân vật quá đáng yêu ❤️'),
-- Comments on Story 4
(4, 1, 2, 'Kết mở hay, mong tác giả ra thêm chương mới!'),
(4, 2, 2, 'Phần miêu tả quái vật rất sống động!'),
-- Comments on Story 5
(5, 1, 4, 'Cậu bé sẽ trở thành pháp sư mạnh nhất chứ? 🔥');

-- ================================================
-- VOTES (LIKES ON CHAPTERS)
-- ================================================

INSERT INTO votes (chapter_id, user_id)
VALUES
-- Votes for Story 1 chapters
(1, 2), (1, 3), (1, 4),
(2, 3), (2, 4),
(3, 4),
-- Votes for Story 2 chapters
(4, 3), (4, 4),
(5, 3),
-- Votes for Story 4 chapters
(6, 2), (6, 4),
(7, 2),
(8, 2), (8, 4),
-- Votes for Story 5 chapters
(9, 4),
(10, 2), (10, 4);

-- ================================================
-- FOLLOWS (FOLLOWING AUTHORS)
-- ================================================

INSERT INTO follows (follower_id, author_id)
VALUES
(3, 2), -- Bob follows Alice
(4, 2), -- Charlie follows Alice
(2, 3), -- Alice follows Bob
(4, 3); -- Charlie follows Bob

-- ================================================
-- FOLLOWED STORIES
-- ================================================

INSERT INTO followed_stories (user_id, story_id)
VALUES
(2, 4), -- Alice follows Bob's story
(3, 1), -- Bob follows Alice's story
(3, 2), -- Bob follows another Alice's story
(4, 1), -- Charlie follows Alice's story
(4, 4), -- Charlie follows Bob's story
(4, 5); -- Charlie follows Bob's another story

-- ================================================
-- FAVORITE LISTS
-- ================================================

INSERT INTO favorite_lists (user_id, name, is_private)
VALUES
(2, 'My Romance Collection', 0),
(3, 'Adventure Picks', 0),
(4, 'Best Fantasy Stories', 0);

-- ================================================
-- FAVORITE LIST ITEMS
-- ================================================

INSERT INTO favorite_list_items (list_id, story_id)
VALUES
(1, 1), -- Alice's list includes her own story
(2, 4), (2, 5), -- Bob's list includes his stories
(3, 4), (3, 5); -- Charlie's list includes fantasy stories

-- ================================================
-- READING LISTS
-- ================================================

INSERT INTO reading_lists (user_id, name, description, is_public)
VALUES
(2, 'To Read Later', 'Stories I want to read when I have time', 1),
(3, 'Currently Reading', 'Stories I am reading now', 1),
(4, 'Favorites', 'My all-time favorite stories', 0);

-- ================================================
-- READING LIST STORIES
-- ================================================

INSERT INTO reading_list_stories (reading_list_id, story_id, display_order)
VALUES
(1, 4, 1), (1, 5, 2), -- Alice's reading list
(2, 1, 1), (2, 2, 2), -- Bob's reading list
(3, 1, 1), (3, 4, 2), (3, 5, 3); -- Charlie's reading list

-- ================================================
-- READING HISTORY
-- ================================================

INSERT INTO reading_history (user_id, story_id, last_chapter_id)
VALUES
(2, 4, 7), -- Alice reading Bob's story, at chapter 7
(3, 1, 2), -- Bob reading Alice's story, at chapter 2
(4, 1, 3), -- Charlie reading Alice's story, finished chapter 3
(4, 4, 6), -- Charlie reading Bob's story, at chapter 6
(4, 5, 9); -- Charlie reading Bob's another story, at chapter 9

-- ================================================
-- STORY READS (UNIQUE READ TRACKING)
-- ================================================

INSERT INTO story_reads (story_id, user_id)
VALUES
(1, 2), (1, 3), (1, 4), -- Story 1 has 3 reads
(2, 3), (2, 4), -- Story 2 has 2 reads
(4, 2), (4, 4), -- Story 4 has 2 reads
(5, 4); -- Story 5 has 1 read

-- ================================================
-- COMPLETION MESSAGE
-- ================================================

SELECT 'Sample data inserted successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_stories FROM stories;
SELECT COUNT(*) as total_chapters FROM chapters;
SELECT COUNT(*) as total_comments FROM story_comments;
SELECT COUNT(*) as total_reviews FROM story_reviews;
