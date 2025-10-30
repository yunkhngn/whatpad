-- Add unique constraint to reading_history table for ON DUPLICATE KEY UPDATE to work
-- This allows the same user to have only one reading history entry per story

USE wattpad;

-- Add unique index on (user_id, story_id)
ALTER TABLE reading_history 
ADD UNIQUE INDEX idx_reading_history_user_story (user_id, story_id);
