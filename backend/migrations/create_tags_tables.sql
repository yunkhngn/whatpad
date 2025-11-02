-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create story_tags junction table
CREATE TABLE IF NOT EXISTS story_tags (
  story_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (story_id, tag_id),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Insert some default tags
INSERT INTO tags (name, slug) VALUES 
  ('Romance', 'romance'),
  ('Fantasy', 'fantasy'),
  ('Mystery', 'mystery'),
  ('Sci-Fi', 'sci-fi'),
  ('Horror', 'horror'),
  ('Adventure', 'adventure'),
  ('Drama', 'drama'),
  ('Comedy', 'comedy')
ON DUPLICATE KEY UPDATE name = name;
