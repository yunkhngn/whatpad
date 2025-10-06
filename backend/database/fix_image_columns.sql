-- Fix image columns to use Cloudinary URLs instead of base64

USE wattpad;

-- Update users table
ALTER TABLE users 
  CHANGE COLUMN avatar_base64 avatar_url VARCHAR(500) NULL;

-- Update stories table  
ALTER TABLE stories
  CHANGE COLUMN cover_base64 cover_url VARCHAR(500) NULL;

-- Add comment explaining the change
-- avatar_url and cover_url now store Cloudinary URLs
-- Example: https://res.cloudinary.com/dx6jeulg2/image/upload/v1234567890/wattpad/avatar.jpg
