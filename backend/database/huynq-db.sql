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
  avatar_url VARCHAR(500) NULL COMMENT 'Cloudinary image URL',
  bio VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Stories (đổi author_id -> user_id)
CREATE TABLE stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NULL,
  cover_url VARCHAR(500) NULL COMMENT 'Cloudinary image URL',
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
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  usage_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
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

-- Check if column already exists
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'wattpad' 
      AND TABLE_NAME = 'story_comments' 
      AND COLUMN_NAME = 'chapter_id'
);

-- Add chapter_id column only if it doesn't exist
SET @add_column = IF(@col_exists = 0,
    'ALTER TABLE story_comments ADD COLUMN chapter_id INT NULL COMMENT "NULL = comment on story, otherwise comment on specific chapter" AFTER story_id',
    'SELECT "Column chapter_id already exists" as message'
);

PREPARE stmt FROM @add_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if not exists
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'wattpad' 
      AND TABLE_NAME = 'story_comments' 
      AND CONSTRAINT_NAME = 'fk_comments_chapter'
);

SET @add_fk = IF(@fk_exists = 0,
    'ALTER TABLE story_comments ADD CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE',
    'SELECT "Foreign key fk_comments_chapter already exists" as message'
);

PREPARE stmt2 FROM @add_fk;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Verify the change
DESCRIBE story_comments;

ALTER TABLE chapters 
ADD CONSTRAINT chapters_ibfk_1 
FOREIGN KEY (story_id) REFERENCES stories(id) 
ON DELETE CASCADE;

ALTER TABLE stories 
ADD COLUMN tags JSON AFTER description;

-- SỬ DỤNG DATABASE
USE wattpad;

-- =================================================================
-- 1. USERS
-- Thêm 6 người dùng: 1 admin, 3 tác giả, 2 độc giả.
-- Mật khẩu chỉ là placeholder, trong thực tế bạn nên dùng hash thật.
-- =================================================================
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `bio`, `created_at`) VALUES
(1, 'admin', 'admin@wattpad.com', '$2b$10$f/v.Z.V.E.A5K.g0...placeholder1', 'Quản trị viên hệ thống', '2025-10-01 10:00:00'),
(2, 'tacgia_linh', 'linh.author@email.com', '$2b$10$f/v.Z.V.E.A5K.g0...placeholder2', 'Tác giả chuyên viết truyện tình cảm lãng mạn và chữa lành.', '2025-10-01 11:30:00'),
(3, 'tacgia_kien', 'kien.author@email.com', '$2b$10$f/v.Z.V.E.A5K.g0...placeholder3', 'Đam mê thế giới kiếm hiệp, tiên hiệp và fantasy.', '2025-10-02 14:00:00'),
(4, 'tacgia_an', 'an.author@email.com', '$2b$10$f/v.Z.V.E.A5K.g0...placeholder4', 'Chuyên gia về các cốt truyện khoa học viễn tưởng và phiêu lưu.', '2025-10-02 16:45:00'),
(5, 'docgia_thanh', 'thanh.reader@email.com', '$2b$10$f/v.Z.V.E.A5K.g0...placeholder5', 'Một mọt sách chính hiệu. Có thể đọc bất cứ thứ gì.', '2025-10-03 09:15:00'),
(6, 'docgia_minh', 'minh.critic@email.com', '$2b$10$f/v.Z.V.E.A5K.g0...placeholder6', 'Độc giả khó tính, chuyên review và phân tích truyện.', '2025-10-03 12:00:00');

-- =================================================================
-- 2. TAGS
-- Thêm 15 tags phổ biến, với số lượng sử dụng ngẫu nhiên.
-- =================================================================
INSERT INTO `tags` (`id`, `name`, `usage_count`, `created_at`) VALUES
(1, 'Romance', 120, NOW()),
(2, 'Fantasy', 95, NOW()),
(3, 'Sci-Fi', 60, NOW()),
(4, 'Horror', 30, NOW()),
(5, 'Mystery', 45, NOW()),
(6, 'Thriller', 50, NOW()),
(7, 'Adventure', 70, NOW()),
(8, 'Historical', 25, NOW()),
(9, 'Comedy', 80, NOW()),
(10, 'Action', 85, NOW()),
(11, 'LGBTQ+', 40, NOW()),
(12, 'Fanfiction', 20, NOW()),
(13, 'Urban', 55, NOW()),
(14, 'Isekai', 90, NOW()),
(15, 'School Life', 65, NOW());

-- =================================================================
-- 3. STORIES
-- Thêm 5 truyện từ 3 tác giả.
-- Lưu ý cột `tags` (JSON) được thêm vào sau, ta sẽ chèn dữ liệu vào đây.
-- =================================================================
INSERT INTO `stories` (`id`, `user_id`, `title`, `description`, `tags`, `cover_url`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 'Trái Tim Mùa Thu', 'Một câu chuyện tình yêu nhẹ nhàng tại một ngôi trường cấp ba ven biển. Hoàng, một nam sinh lạnh lùng, gặp gỡ An, cô gái mang trong mình một bí mật và nụ cười ấm áp như nắng mùa thu.', '["Romance", "School Life"]', 'https://picsum.photos/seed/story1/400/600', 'published', '2025-10-05 08:00:00', '2025-10-10 09:00:00'),
(2, 3, 'Kiếm Thần Vô Song', 'Lâm Phong, một thiếu niên phế vật, tình cờ nhận được truyền thừa của Kiếm Thần cổ đại. Từ đó, hắn bước lên con đường nghịch thiên, dùng một thanh kiếm quét ngang cửu thiên thập địa, viết nên huyền thoại của riêng mình.', '["Fantasy", "Action", "Isekai"]', 'https://picsum.photos/seed/story2/400/600', 'published', '2025-10-06 11:00:00', '2025-10-11 12:00:00'),
(3, 4, 'Trạm Dừng Chân Vũ Trụ Z', 'Năm 2301, phi hành đoàn của tàu "Tinh Vân" nhận được một tín hiệu cầu cứu bí ẩn từ một trạm không gian bị lãng quên. Khi đến nơi, họ nhận ra mình không phải là những vị khách duy nhất.', '["Sci-Fi", "Adventure", "Mystery"]', 'https://picsum.photos/seed/story3/400/600', 'ongoing', '2025-10-07 15:00:00', '2025-10-12 16:00:00'),
(4, 2, 'Lời Hứa Bồ Công Anh', 'Câu chuyện tình yêu bị ngăn cấm giữa một vị tiểu thư đài các và một người lính trong bối cảnh thời chiến loạn lạc. Họ đã hứa hẹn dưới gốc cây bồ công anh rằng sẽ tìm thấy nhau, dù ở bất cứ kiếp nào.', '["Romance", "Historical"]', 'https://picsum.photos/seed/story4/400/600', 'draft', '2025-10-08 10:00:00', '2025-10-08 10:00:00'),
(5, 3, 'Bóng Đêm Thức Giấc', 'Thành phố Eldoria yên bình bỗng chốc bị bao phủ bởi một lời nguyền cổ xưa. Những cơn ác mộng trở thành hiện thực và những con quái vật từ bóng tối bắt đầu săn lùng. Một nhóm người sống sót phải tìm cách phá giải lời nguyền trước khi màn đêm nuốt chửng tất cả.', '["Fantasy", "Horror", "Thriller"]', 'https://picsum.photos/seed/story5/400/600', 'published', '2025-10-09 13:00:00', '2025-10-13 14:00:00');

-- =================================================================
-- 4. CHAPTERS
-- Thêm chapters cho các truyện đã published, với nội dung dài.
-- =================================================================
INSERT INTO `chapters` (`id`, `story_id`, `title`, `content`, `chapter_order`, `is_published`, `created_at`, `updated_at`) VALUES
-- Truyện 1: Trái Tim Mùa Thu
(1, 1, 'Chương 1: Gặp gỡ định mệnh', 'Tiếng chuông tan học vang lên, kéo Hoàng ra khỏi mớ suy nghĩ hỗn độn. Hắn uể oải ném quyển sách vào cặp, đứng dậy và bước ra khỏi lớp. Mùa thu ở thị trấn ven biển này luôn mang một vẻ ảm đạm. Gió rít qua từng kẽ lá, mang theo hơi muối mặn chát. Hoàng kéo cao cổ áo đồng phục, bước nhanh về phía cổng trường, cố gắng lờ đi những ánh mắt tò mò và những tiếng xì xào bàn tán quen thuộc.\n\n"Nhìn kìa, lại là nó. Thằng con trai của..."\n\nHoàng siết chặt tay. Hắn đã quá quen rồi. Từ khi chuyển đến đây, hắn đã trở thành tâm điểm của sự chú ý không mong muốn. Một thằng con nhà giàu từ thành phố lớn, mang theo vết sẹo trên mặt và một sự im lặng đáng sợ. Hắn ghét nơi này, ghét cái không khí ngột ngạt và những con người tọc mạch.\n\nĐang mải suy nghĩ, hắn bất ngờ va phải một người. Cú va chạm không mạnh, nhưng đủ để khiến chồng sách trên tay người kia rơi lả tả xuống đất.\n\n"A! Xin lỗi, bạn không sao chứ?"\n\nMột giọng nói trong trẻo vang lên. Hoàng ngước lên. Trước mặt hắn là một cô gái có vóc dáng nhỏ nhắn, mái tóc đen dài buộc hờ. Cô ấy đang vội vàng cúi xuống nhặt sách, không hề nhìn hắn. Hắn đứng im, nhìn cô gái loay hoay với đống sách vở.\n\n"Bạn... không định giúp tôi một tay à?" - Cô gái ngẩng đầu lên, hơi nhíu mày. Khi nhìn thấy hắn, đôi mắt cô mở to ngạc nhiên, nhưng chỉ trong một khoảnh khắc. Cô mỉm cười, một nụ cười rạng rỡ như nắng. "À, chào bạn, bạn là Hoàng, học sinh mới chuyển đến đúng không? Tôi là An, học lớp bên cạnh."\n\nHoàng ngạc nhiên. Đây là lần đầu tiên có người mỉm cười với hắn như vậy, không một chút sợ hãi hay tò mò. Hắn cúi xuống, nhặt lấy quyển sách cuối cùng. Bìa sách có hình một bông hoa hướng dương. "Cảm ơn," An nói, nhận lấy quyển sách từ tay hắn. "Hôm nay trời đẹp nhỉ? Mùa thu mà cứ như mùa hè vậy."\n\nHoàng nhìn lên bầu trời xám xịt. "Đẹp sao?" Hắn lẩm bẩm.\n\nAn bật cười. "Bạn phải nhìn bằng trái tim, chứ không phải bằng mắt." Cô ôm chồng sách, vẫy tay chào hắn rồi chạy đi, mái tóc bay trong gió. Hoàng đứng sững lại, nhìn theo bóng cô gái. Nụ cười đó, và câu nói đó, bỗng nhiên khiến hắn cảm thấy hơi ấm lạ lùng len lỏi trong lồng ngực. Có lẽ, mùa thu ở đây cũng không tệ như hắn nghĩ.', 1, 1, '2025-10-05 09:00:00', '2025-10-05 09:00:00'),
(2, 1, 'Chương 2: Chiếc hộp bí mật', 'Hoàng không thể ngừng nghĩ về An. Nụ cười của cô ấy cứ lặp đi lặp lại trong tâm trí hắn. Hôm nay ở trường, hắn vô thức tìm kiếm bóng dáng cô. Nhưng An không đi học. Cảm giác hụt hẫng kỳ lạ xâm chiếm lấy hắn. Chiều đó, thay vì về nhà ngay, hắn đi lang thang trên bờ biển. Bãi biển vắng tanh, chỉ có tiếng sóng vỗ và tiếng gió. Hắn ngồi xuống một tảng đá, nhìn ra khơi xa.\n\n"Bạn cũng thích nơi này à?"\n\nHoàng giật mình quay lại. Là An. Cô ấy đang ngồi trên một mỏm đá khác, tay cầm một cuốn sổ và bút chì. Hôm nay cô ấy trông xanh xao hơn bình thường, nhưng nụ cười vẫn rạng rỡ.\n\n"Tôi... chỉ đi dạo." Hoàng lúng túng đáp.\n\n"Tôi cũng vậy," An mỉm cười. "Tôi hay ra đây vẽ. Biển lúc chiều tà là đẹp nhất." Cô giơ cuốn sổ lên. Đó là một bức tranh phác thảo cảnh hoàng hôn, màu sắc tuy đơn giản nhưng lại có hồn đến lạ. "Bạn ngồi đi."\n\nHoàng ngập ngừng rồi ngồi xuống, giữ một khoảng cách an toàn. Cả hai im lặng một lúc lâu, chỉ có tiếng sóng biển. "Hôm nay bạn không đi học," Hoàng bất ngờ lên tiếng, chính hắn cũng không hiểu vì sao mình lại hỏi vậy.\n\nAn nhìn hắn. "Tôi phải đến bệnh viện. Kiểm tra định kỳ thôi, không có gì nghiêm trọng đâu." Cô nói nhẹ bẫng, như thể đó là chuyện bình thường. Nhưng Hoàng nhận ra, trong một khoảnh khắc ngắn ngủi, ánh mắt cô thoáng lên một nỗi buồn sâu thẳm.\n\n"Bí mật nhé," An đột nhiên nói, giọng tinh nghịch. Cô lấy từ trong túi ra một chiếc hộp gỗ nhỏ, cũ kỹ. "Đây là kho báu của tôi." Cô mở chiếc hộp. Bên trong không có vàng bạc, chỉ có vài vỏ ốc đủ màu, một chiếc lá phong ép khô, và một tấm ảnh đã ố vàng. "Mỗi khi tôi tìm thấy một thứ gì đó khiến tôi vui vẻ, tôi sẽ bỏ nó vào đây. Giống như lưu giữ lại hạnh phúc vậy."\n\nHoàng nhìn vào chiếc hộp, rồi nhìn An. Cô gái này thật kỳ lạ. Mỏng manh nhưng lại mạnh mẽ, luôn ẩn chứa một bí mật nào đó. Hắn muốn hỏi về bệnh viện, về nỗi buồn trong mắt cô, nhưng lại thôi. Hắn chỉ lặng lẽ nhặt một vỏ ốc nhỏ màu trắng ngà dưới chân mình, đưa cho cô. "Cho bạn," hắn nói.\n\nAn ngạc nhiên, rồi nhận lấy vỏ ốc. "Nó đẹp quá! Cảm ơn bạn. Từ giờ, nó sẽ là bí mật của chúng ta." Cô cẩn thận đặt vỏ ốc vào hộp. Hoàng nhìn nụ cười của An, trái tim hắn bỗng nhiên đập lỡ một nhịp. Hắn nhận ra, có lẽ hắn đã tìm thấy lý do để ở lại thị trấn tẻ nhạt này.', 2, 1, '2025-10-06 10:00:00', '2025-10-06 10:00:00'),

-- Truyện 2: Kiếm Thần Vô Song
(3, 2, 'Chương 1: Kẻ phế vật', 'Đại sảnh của Lâm gia hôm nay đông nghịt người. Buổi khảo thí linh căn hàng năm đang diễn ra. Tiếng reo hò, tiếng trầm trồ, và cả tiếng thở dài vang lên liên tục. Trên đài cao, Lâm Phong đứng đó, hai bàn tay siết chặt. Hắn là thiếu chủ của Lâm gia, nhưng mười lăm năm qua, hắn không thể tu luyện. Linh căn của hắn là một mảnh hỗn độn, không thể ngưng tụ bất cứ loại linh khí nào.\n\n"Tiếp theo, Lâm Phong!"\n\nTiếng trưởng lão vang lên, kéo theo vô số ánh mắt giễu cợt. Lâm Phong hít một hơi thật sâu, bước lên đặt tay lên "Thí Linh Thạch". Hòn đá không có bất kỳ phản ứng nào. Vẫn là một màu xám xịt chết chóc.\n\n"Ha ha ha! Phế vật vẫn hoàn phế vật!"\n\n"Thật mất mặt Lâm gia! Thiếu chủ mà không bằng cả một tên nô tài!"\n\nNhững lời chế nhạo như hàng ngàn mũi kim đâm vào tim hắn. Cha hắn, gia chủ Lâm Chiến, ngồi trên cao, khuôn mặt không biểu cảm nhưng đôi mắt lộ rõ vẻ thất vọng. Vị hôn thê của hắn, Lý Tuyết Nhi, tiểu thư của Lý gia, đứng ở một góc, ánh mắt lạnh lùng xa lạ. Nàng ta từ từ bước ra, rút một tờ giấy từ trong tay áo.\n\n"Lâm Phong, ta và ngươi, duyên phận đã hết. Đây là thư từ hôn. Từ nay, đôi ta không còn liên quan gì nữa!"\n\nLý Tuyết Nhi ném tờ giấy vào mặt Lâm Phong, rồi quay người đi về phía Lâm Thiên, biểu huynh của hắn, người vừa được khảo thí là thiên tài linh căn hệ Hỏa. Tiếng cười nhạo càng lúc càng lớn. Lâm Phong đứng đó, cúi gằm mặt, để mặc cho sự sỉ nhục bao phủ lấy mình. Hắn nhặt tờ giấy lên, máu từ bàn tay bị móng tay đâm chảy ra, nhỏ giọt xuống tờ giấy, đỏ thẫm. "Ba mươi năm Hà Đông, ba mươi năm Hà Tây. Hôm nay các ngươi sỉ nhục ta thế nào, ngày sau ta sẽ trả lại gấp bội!" Hắn gầm lên trong tuyệt vọng, rồi lao ra khỏi đại sảnh, chạy về phía hậu sơn của Lâm gia.', 1, 1, '2025-10-07 11:00:00', '2025-10-07 11:00:00'),
(4, 2, 'Chương 2: Truyền thừa Kiếm Thần', 'Lâm Phong chạy như điên vào rừng sâu, nước mắt của sự tủi nhục và phẫn uất tuôn rơi. Hắn vấp ngã liên tục, nhưng không dừng lại. Hắn muốn chạy trốn khỏi thế giới này. Bất chợt, hắn trượt chân ngã xuống một vực thẳm. Hắn nhắm mắt, nghĩ rằng đời mình đã kết thúc.\n\nNhưng hắn không chết. Khi tỉnh dậy, hắn thấy mình đang ở trong một hang động kỳ lạ. Ánh sáng mờ ảo phát ra từ một thanh kiếm cổ cắm giữa một tảng đá. Thanh kiếm trông như bị rỉ sét, nhưng lại toát ra một khí tức cổ xưa và mạnh mẽ. Lâm Phong tò mò bước lại gần. Khi tay hắn vừa chạm vào chuôi kiếm, một luồng ánh sáng chói lòa bùng lên.\n\nMột giọng nói uy nghiêm vang lên trong đầu hắn: "Hậu bối, ta là Vô Cực Kiếm Thần. Ta đã chờ đợi người hữu duyên suốt mười vạn năm. Thể chất của ngươi không phải phế vật, mà là "Hỗn Độn Kiếm Thể" vạn cổ khó tìm, chỉ có thể tu luyện kiếm đạo của ta."\n\nMột dòng thông tin khổng lồ tràn vào não Lâm Phong. Đó là bộ công pháp "Vô Cực Kiếm Quyết" và toàn bộ kiếm kỹ của Vô Cực Kiếm Thần. Hóa ra, linh căn hỗn độn của hắn không phải là phế vật, mà là do nó quá mạnh mẽ, các phương pháp tu luyện thông thường không thể phát hiện được. "Hỗn Độn Kiếm Thể" sinh ra để dành cho kiếm.\n\n"Thanh kiếm này là "Trảm Thiên", bạn đồng hành của ta. Từ nay nó thuộc về ngươi."\n\nLâm Phong rút thanh kiếm ra khỏi tảng đá. Lớp rỉ sét bong ra, để lộ thân kiếm sáng loáng như gương, ẩn chứa sức mạnh hủy thiên diệt địa. Hắn quỳ xuống, dập đầu ba cái. "Tiền bối, ơn tái tạo này, Lâm Phong xin khắc cốt ghi tâm. Ta thề sẽ không để kiếm đạo của người bị mai một!"\n\nHắn đứng dậy, ánh mắt đã hoàn toàn thay đổi. Không còn là thiếu niên yếu đuối, mà là một kiếm khách với sự kiên định và sắc bén. "Lý Tuyết Nhi, Lâm Thiên, Lâm gia... Ta sẽ trở lại!" Lâm Phong bắt đầu tu luyện ngay tại sơn động. Với "Hỗn Độn Kiếm Thể" và "Vô Cực Kiếm Quyết", tốc độ tu luyện của hắn nhanh đến mức kinh người. Chỉ trong ba ngày, hắn đã đột phá Luyện Khí Kỳ, bước thẳng vào Trúc Cơ Kỳ.', 2, 1, '2025-10-08 11:00:00', '2025-10-08 11:00:00'),

-- Truyện 3: Trạm Dừng Chân Vũ Trụ Z
(5, 3, 'Chương 1: Tín hiệu từ cõi chết', 'Thuyền trưởng Kael gõ nhịp tay lên thành ghế chỉ huy, mắt đăm đăm nhìn vào màn hình không gian ba chiều. Con tàu "Tinh Vân" đang thực hiện một chuyến vận chuyển hàng hóa nhàm chán đến vành đai sao Hỏa. Bốn thành viên còn lại của phi hành đoàn cũng đang chìm trong sự buồn chán của riêng họ: Aric - hoa tiêu, một tay cựu binh già dặn; Elara - kỹ sư trưởng, thông minh nhưng khó gần; và Jax - chuyên gia vũ khí, một lính đánh thuê lắm mồm.\n\n"Thuyền trưởng," giọng nói máy móc của AI con tàu - "Nova" - vang lên. "Phát hiện một tín hiệu bất thường. Nguồn: Sector Z-14. Tọa độ... Trạm không gian Z-Alpha."\n\nCả phi hành đoàn sững lại. Jax huýt sáo. "Z-Alpha? Tôi tưởng nó đã bị bỏ hoang sau thảm họa virus "Bóng Tối" 50 năm trước rồi chứ?"\n\n"Đó là một tín hiệu cầu cứu, dạng mã Morse cổ," Elara nói, tay lướt nhanh trên bảng điều khiển. "Nó lặp đi lặp lại... C-Ứ-U... V-Ớ-I..."\n\nKael cau mày. "Z-Alpha nằm ngoài tuyến đường của chúng ta. Hơn nữa, đó là khu vực cách ly cấp 5. Không ai được phép vào."\n\n"Nhưng đó là tín hiệu cầu cứu, Kael!" Aric lên tiếng, giọng ông trầm xuống. "Luật không gian quy định chúng ta phải ứng cứu."\n\nKael day trán. Chuyến hàng này rất quan trọng, nhưng lương tâm của một thuyền trưởng không cho phép ông bỏ qua. "Nova, tính toán lại lộ trình đến Z-Alpha. Elara, kiểm tra lại bộ lọc không khí và hệ thống khử trùng. Jax, chuẩn bị vũ khí. Chúng ta không biết thứ gì đang chờ đợi ở đó."\n\nKhi "Tinh Vân" thoát khỏi bước nhảy siêu không gian, Trạm Z-Alpha hiện ra trước mắt họ. Nó im lìm như một con quái vật khổng lồ bằng kim loại, trôi nổi trong sự tĩnh lặng của vũ trụ. Không một ánh đèn, không một tín hiệu liên lạc. Chỉ có tín hiệu cầu cứu yếu ớt đó. "Chúng ta sẽ vào," Kael nói dứt khoát. "Đội 3 người: Tôi, Elara, và Jax. Aric, ông ở lại giữ tàu. Bất cứ dấu hiệu bất thường nào, lập tức rời đi, không cần chờ lệnh."\n\nHọ mặc đồ bảo hộ, bước vào khoang tàu con thoi. Cánh cửa "Tinh Vân" đóng lại sau lưng họ, và chiếc tàu con thoi lao về phía trạm không gian chết chóc.', 1, 1, '2025-10-09 15:00:00', '2025-10-09 15:00:00'),

-- Truyện 5: Bóng Đêm Thức Giấc
(6, 5, 'Chương 1: Tiếng thì thầm trong gương', 'Thám tử tư Mark Corrigan dụi điếu thuốc vào cái gạt tàn đã đầy ắp. Văn phòng của anh ta nằm trên tầng ba của một tòa nhà cũ nát ở khu phố cổ Eldoria, nơi ánh mặt trời dường như không bao giờ chiếu tới. Vụ án mới nhất của anh ta là tìm một con mèo bị lạc. Thật thảm hại.\n\nTiếng chuông cửa văn phòng vang lên. Mark nhướn mày. Đã nhiều tuần rồi không có khách. Một người phụ nữ hoảng hốt bước vào. "Thưa ông Corrigan," bà ta nói, giọng run rẩy. "Con gái tôi, Emily... nó đã biến mất. Nhưng cảnh sát nói nó bỏ nhà đi. Họ không tin tôi! Xin ông, ông phải giúp tôi."\n\nBà ta kể. Emily bắt đầu hành xử kỳ lạ vài tuần trước. Cô bé nói rằng có ai đó đang thì thầm với mình từ trong gương. Cô bé vẽ những biểu tượng kỳ lạ khắp phòng. Và rồi, ba ngày trước, cô bé biến mất, chỉ để lại một căn phòng trống rỗng và một tấm gương bị đập vỡ.\n\nMark, dù hoài nghi, vẫn nhận vụ này. Anh ta đến nhà của họ. Căn phòng của Emily vẫn còn nguyên vẹn. Trên tường, những biểu tượng được vẽ bằng son môi, trông như một loại chữ viết cổ. Nhưng điều khiến Mark chú ý nhất là tấm gương. Nó đã bị đập nát, nhưng các mảnh vỡ không rơi xuống sàn. Chúng dường như... bị hút vào bên trong, tạo thành một vòng xoáy nhỏ ở trung tâm.\n\nĐêm đó, Mark quay lại văn phòng, nghiên cứu về các biểu tượng. Chúng thuộc về một giáo phái cổ đã bị lãng quên, thờ phụng một thực thể gọi là "Kẻ Nuốt Chửng Ánh Sáng". Theo truyền thuyết, chúng có thể mở ra một cánh cổng từ thế giới gương. Mark cười khẩy. Thật là mê tín.\n\nAnh ta mệt mỏi bước vào phòng tắm để rửa mặt. Khi anh ta nhìn vào gương, trong một giây, hình ảnh phản chiếu của anh ta mỉm cười, một nụ cười mà anh ta không hề thực hiện. Tim Mark đập thình thịch. Anh ta nhìn lại. Mọi thứ bình thường. Chắc là do mệt mỏi.\n\nAnh ta vừa quay đi, một tiếng thì thầm khô khốc, lạnh lẽo vang lên từ phía sau, ngay bên tai anh ta: "Đừng đi. Chúng ta còn chưa chơi xong mà." Mark quay phắt lại. Không có ai. Nhưng trên mặt gương, một vết nứt nhỏ bắt đầu xuất hiện.', 1, 1, '2025-10-10 13:00:00', '2025-10-10 13:00:00');


-- =================================================================
-- 5. STORY TAGS (Bảng nối)
-- Liên kết 5 truyện với các tag tương ứng.
-- =================================================================
INSERT INTO `story_tags` (`story_id`, `tag_id`) VALUES
(1, 1),  -- Trái Tim Mùa Thu - Romance
(1, 15), -- Trái Tim Mùa Thu - School Life
(2, 2),  -- Kiếm Thần Vô Song - Fantasy
(2, 10), -- Kiếm Thần Vô Song - Action
(2, 14), -- Kiếm Thần Vô Song - Isekai
(3, 3),  -- Trạm Dừng Chân - Sci-Fi
(3, 7),  -- Trạm Dừng Chân - Adventure
(3, 5),  -- Trạm Dừng Chân - Mystery
(5, 2),  -- Bóng Đêm Thức Giấc - Fantasy
(5, 4),  -- Bóng Đêm Thức Giấc - Horror
(5, 6);  -- Bóng Đêm Thức Giấc - Thriller

-- =================================================================
-- 6. STORY REVIEWS
-- Thêm 6 review từ các độc giả cho các truyện.
-- =================================================================
INSERT INTO `story_reviews` (`id`, `story_id`, `user_id`, `rating`, `title`, `content`, `is_recommended`, `created_at`) VALUES
(1, 1, 5, 5, 'Nhẹ nhàng và sâu lắng', 'Truyện rất hay, văn phong của tác giả mượt mà và đầy cảm xúc. Mình như được sống lại thời cấp ba của mình. Rất đề cử cho ai thích thể loại chữa lành.', 1, '2025-10-11 08:00:00'),
(2, 1, 6, 4, 'Cốt truyện ổn nhưng hơi chậm', 'Nội dung khá, xây dựng nhân vật tốt. Tuy nhiên, mình thấy nhịp truyện hơi chậm ở 2 chương đầu. Hy vọng các chương sau sẽ có nhiều đột phá hơn.', 1, '2025-10-11 10:00:00'),
(3, 2, 5, 5, 'ĐỈNH CỦA CHÓP!', 'Trời ơi đúng gu của mình! Main bá, tình tiết nhanh, đánh nhau đã mắt. Tác giả ra chương nhanh lên đi ạ, hóng quá!', 1, '2025-10-12 11:00:00'),
(4, 3, 6, 3, 'Ý tưởng tốt, thực hiện chưa tới', 'Thể loại Sci-fi kinh dị này rất hiếm. Ý tưởng về trạm không gian ma rất hay, nhưng cách tác giả xây dựng không khí chưa đủ đáng sợ. Vẫn sẽ theo dõi tiếp.', 0, '2025-10-12 17:00:00'),
(5, 5, 5, 5, 'Sợ nhưng vẫn muốn đọc!', 'Đọc chương 1 mà lạnh hết cả sống lưng. Tác giả miêu tả hay quá, cảm giác như mình là thám tử Mark vậy. 5 sao!', 1, '2025-10-13 15:00:00'),
(6, 2, 2, 4, 'Review từ tác giả khác', 'Với tư cách là một tác giả (Linh), tôi đánh giá cao cách bạn (Kiên) xây dựng thế giới trong truyện Kiếm Thần. Rất chi tiết và logic. Sẽ theo dõi để học hỏi.', 1, '2025-10-13 16:00:00');

-- =================================================================
-- 7. REVIEW LIKES
-- Thêm 5 lượt thích cho các review.
-- =================================================================
INSERT INTO `review_likes` (`review_id`, `user_id`, `created_at`) VALUES
(1, 6, '2025-10-11 11:00:00'), -- Minh (6) thích review (1) của Thanh
(1, 2, '2025-10-11 12:00:00'), -- Tác giả Linh (2) thích review (1)
(3, 6, '2025-10-12 13:00:00'), -- Minh (6) thích review (3) của Thanh
(3, 3, '2025-10-12 14:00:00'), -- Tác giả Kiên (3) thích review (3) khen truyện mình
(5, 6, '2025-10-13 16:00:00'); -- Minh (6) thích review (5) của Thanh

-- =================================================================
-- 8. STORY COMMENTS
-- Thêm 6 bình luận, bao gồm cả bình luận truyện, bình luận chương và trả lời.
-- (parent_comment_id = NULL: bình luận gốc)
-- (chapter_id = NULL: bình luận cho cả câu chuyện)
-- =================================================================
INSERT INTO `story_comments` (`id`, `story_id`, `chapter_id`, `user_id`, `content`, `parent_comment_id`, `created_at`) VALUES
(1, 1, NULL, 5, 'Truyện dễ thương quá tác giả ơi! Hóng chương mới <3', NULL, '2025-10-11 09:00:00'),
(2, 2, 3, 6, 'Chương 1 đọc mà tức á. Mong main trả thù!', NULL, '2025-10-12 12:00:00'),
(3, 1, NULL, 2, 'Cảm ơn bạn đã ủng hộ truyện của mình nhé!', 1, '2025-10-11 10:00:00'), -- Tác giả (2) trả lời comment (1)
(4, 2, 3, 3, 'Sẽ có màn trả thù thỏa đáng, bạn yên tâm :D', 2, '2025-10-12 13:00:00'), -- Tác giả (3) trả lời comment (2)
(5, 3, 5, 5, 'Chi tiết "mã Morse cổ" hay quá! Hợp lý thực sự.', NULL, '2025-10-12 18:00:00'),
(6, 1, 2, 6, 'Chiếc hộp bí mật, motip hay đó. Hy vọng không phải điềm báo gì xấu...', NULL, '2025-10-11 11:00:00');

-- =================================================================
-- 9. VOTES (per chapter)
-- Thêm 7 lượt vote cho các chương.
-- =================================================================
INSERT INTO `votes` (`chapter_id`, `user_id`, `created_at`) VALUES
(1, 5, '2025-10-11 08:05:00'), -- Thanh (5) vote chương 1 (Truyện 1)
(1, 6, '2025-10-11 10:02:00'), -- Minh (6) vote chương 1 (Truyện 1)
(2, 5, '2025-10-11 08:30:00'), -- Thanh (5) vote chương 2 (Truyện 1)
(3, 5, '2025-10-12 11:05:00'), -- Thanh (5) vote chương 3 (Truyện 2)
(4, 5, '2025-10-12 11:20:00'), -- Thanh (5) vote chương 4 (Truyện 2)
(5, 6, '2025-10-12 17:01:00'), -- Minh (6) vote chương 5 (Truyện 3)
(6, 5, '2025-10-13 15:05:00'); -- Thanh (5) vote chương 6 (Truyện 5)

-- =================================================================
-- 10. FOLLOWS (theo dõi tác giả)
-- Thêm 6 lượt theo dõi.
-- =================================================================
INSERT INTO `follows` (`follower_id`, `author_id`, `created_at`) VALUES
(5, 2, '2025-10-11 08:31:00'), -- Thanh (5) theo dõi Tác giả Linh (2)
(5, 3, '2025-10-12 11:21:00'), -- Thanh (5) theo dõi Tác giả Kiên (3)
(5, 4, '2025-10-12 18:01:00'), -- Thanh (5) theo dõi Tác giả An (4)
(6, 2, '2025-10-11 11:01:00'), -- Minh (6) theo dõi Tác giả Linh (2)
(6, 3, '2025-10-12 17:02:00'), -- Minh (6) theo dõi Tác giả Kiên (3)
(2, 3, '2025-10-13 16:01:00'); -- Tác giả Linh (2) theo dõi Tác giả Kiên (3)

-- =================================================================
-- 11. FAVORITE LISTS
-- Thêm 5 danh sách yêu thích cho 4 người dùng.
-- =================================================================
INSERT INTO `favorite_lists` (`id`, `user_id`, `name`, `is_private`, `created_at`) VALUES
(1, 2, 'Truyện lãng mạn nên đọc', 0, '2025-10-05 09:00:00'),
(2, 3, 'Kiếm hiệp / Tiên hiệp hay', 0, '2025-10-06 12:00:00'),
(3, 5, 'Đã đọc (Thanh)', 0, '2025-10-11 08:00:00'),
(4, 6, 'Chờ review (Minh)', 1, '2025-10-11 10:00:00'),
(5, 5, 'Sci-fi / Kinh dị (Thanh)', 0, '2025-10-12 18:00:00');

-- =================================================================
-- 12. FAVORITE LIST ITEMS
-- Thêm 6 truyện vào các danh sách yêu thích.
-- =================================================================
INSERT INTO `favorite_list_items` (`list_id`, `story_id`, `added_at`) VALUES
(1, 1, '2025-10-05 09:01:00'), -- Tác giả Linh (2) thêm truyện của mình vào list (1)
(3, 1, '2025-10-11 08:30:00'), -- Thanh (5) thêm Truyện 1 vào list (3) 'Đã đọc'
(3, 2, '2025-10-12 11:20:00'), -- Thanh (5) thêm Truyện 2 vào list (3) 'Đã đọc'
(4, 3, '2025-10-12 17:03:00'), -- Minh (6) thêm Truyện 3 vào list (4) 'Chờ review'
(4, 5, '2025-10-13 15:01:00'), -- Minh (6) thêm Truyện 5 vào list (4) 'Chờ review'
(5, 5, '2025-10-13 15:06:00'); -- Thanh (5) thêm Truyện 5 vào list (5) 'Sci-fi / Kinh dị'

-- =================================================================
-- 13. FOLLOWED STORIES
-- Thêm 5 lượt theo dõi truyện.
-- =================================================================
INSERT INTO `followed_stories` (`user_id`, `story_id`, `created_at`) VALUES
(5, 1, '2025-10-11 08:32:00'), -- Thanh (5) theo dõi Truyện 1
(5, 2, '2025-10-12 11:22:00'), -- Thanh (5) theo dõi Truyện 2
(5, 3, '2025-10-12 18:02:00'), -- Thanh (5) theo dõi Truyện 3
(6, 1, '2025-10-11 11:02:00'), -- Minh (6) theo dõi Truyện 1
(6, 5, '2025-10-13 15:02:00'); -- Minh (6) theo dõi Truyện 5

-- =================================================================
-- 14. READING HISTORY
-- Thêm 5 lịch sử đọc.
-- =================================================================
INSERT INTO `reading_history` (`id`, `user_id`, `story_id`, `last_chapter_id`, `updated_at`) VALUES
(1, 5, 1, 2, '2025-10-11 08:30:00'), -- Thanh (5) đọc xong chương 2 (Truyện 1)
(2, 6, 1, 1, '2025-10-11 10:02:00'), -- Minh (6) đọc xong chương 1 (Truyện 1)
(3, 5, 2, 4, '2025-10-12 11:20:00'), -- Thanh (5) đọc xong chương 4 (Truyện 2)
(4, 6, 3, 5, '2025-10-12 17:01:00'), -- Minh (6) đọc xong chương 5 (Truyện 3)
(5, 5, 5, 6, '2025-10-13 15:05:00'); -- Thanh (5) đọc xong chương 6 (Truyện 5)