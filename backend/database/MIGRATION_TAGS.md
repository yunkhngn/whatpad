# Database Migration: Tags Support

## Overview
This migration adds tags support to the application:
- Adds `tags` JSON column to `stories` table
- Creates new `tags` table for autocomplete/suggestions
- Updates `chapters` foreign key with CASCADE delete
- Inserts 10 common tag categories

## How to Run

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run migrate:tags
```

### Option 2: Using MySQL Workbench or CLI
```bash
mysql -u root -p wattpad < backend/database/add_tags_support.sql
```

### Option 3: Manual execution
1. Open MySQL Workbench
2. Connect to your database
3. Open `backend/database/add_tags_support.sql`
4. Execute the script

## What's Changed

### Stories Table
- Added `tags` column (JSON type) to store story tags

### Tags Table (New)
- `id`: Primary key
- `name`: Tag name (unique, max 50 chars)
- `usage_count`: How many times the tag is used
- `created_at`: Timestamp

### Chapters Table
- Updated foreign key constraint to include `ON DELETE CASCADE`
- When a story is deleted, all its chapters are automatically deleted

## Default Tags
The migration includes these tags:
- Romance (10)
- Drama (9)
- Fantasy (8)
- Adventure (8)
- Thriller (7)
- Mystery (6)
- Action (6)
- Sci-Fi (5)
- Comedy (4)
- Horror (3)

## Verification
After running the migration, verify with:
```sql
-- Check stories table structure
DESCRIBE stories;

-- Check tags table
SELECT * FROM tags ORDER BY usage_count DESC;

-- Check chapters foreign key
SHOW CREATE TABLE chapters;
```

## Rollback (if needed)
If you need to rollback this migration:
```sql
-- Remove tags column from stories
ALTER TABLE stories DROP COLUMN tags;

-- Drop tags table
DROP TABLE tags;

-- Remove CASCADE from chapters
ALTER TABLE chapters DROP FOREIGN KEY chapters_ibfk_1;
ALTER TABLE chapters 
ADD CONSTRAINT chapters_ibfk_1 
FOREIGN KEY (story_id) REFERENCES stories(id);
```
