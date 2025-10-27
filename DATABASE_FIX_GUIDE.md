# 🔧 Database Fix Guide - "Unknown column 'chapter_id'" Error

## 🔴 Vấn đề

Lỗi: `"Unknown column 'chapter_id' in 'where clause'"`

Nguyên nhân: Database thực tế có structure khác với schema file, hoặc chưa được tạo/update đúng.

---

## ✅ Solutions

### **Option 1: Recreate Database (RECOMMENDED - Mất dữ liệu)**

Nếu đây là môi trường dev/test và có thể mất data:

```bash
# 1. Login MySQL
mysql -u root -p

# 2. Drop và recreate database
DROP DATABASE IF EXISTS wattpad;
CREATE DATABASE wattpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wattpad;

# 3. Run schema
source /Volumes/Data/Code/fer202/4.Assignment/whatpad/backend/database/createdb.sql;

# 4. (Optional) Insert sample data
source /Volumes/Data/Code/fer202/4.Assignment/whatpad/backend/database/insertdb.sql;

# 5. Exit
exit;
```

---

### **Option 2: Check & Fix Specific Tables (Giữ dữ liệu)**

#### **Step 1: Check votes table structure**

```bash
mysql -u root -p wattpad

# Check current structure
DESCRIBE votes;
SHOW COLUMNS FROM votes;
```

**Expected columns:**
- `chapter_id` INT NOT NULL
- `user_id` INT NOT NULL
- `created_at` DATETIME

**Nếu không có hoặc sai tên:**

```sql
-- Drop và recreate bảng votes
DROP TABLE IF EXISTS votes;

CREATE TABLE votes (
  chapter_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chapter_id, user_id),
  CONSTRAINT fk_votes_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

#### **Step 2: Check story_comments table**

```sql
DESCRIBE story_comments;
```

**Expected columns:**
- `id` INT PRIMARY KEY
- `story_id` INT NOT NULL
- `chapter_id` INT NULL
- `user_id` INT NOT NULL
- `content` VARCHAR(1000)
- `parent_comment_id` INT NULL
- `created_at` DATETIME

**Nếu thiếu `chapter_id`:**

```sql
ALTER TABLE story_comments 
ADD COLUMN chapter_id INT NULL AFTER story_id;

ALTER TABLE story_comments 
ADD CONSTRAINT fk_comments_chapter 
FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE;
```

---

### **Option 3: Quick Fix Script**

Tôi đã tạo sẵn script:

```bash
cd backend/database

# Check structure
mysql -u root -p wattpad < check_votes_table.sql

# Fix nếu cần
mysql -u root -p wattpad < fix_votes_table.sql
```

---

## 🧪 Verify Fix

Sau khi fix, test lại:

```bash
# In MySQL
USE wattpad;

# 1. Check votes table
DESCRIBE votes;
# Should show: chapter_id, user_id, created_at

# 2. Check story_comments table  
DESCRIBE story_comments;
# Should include: chapter_id column

# 3. Test query
SELECT * FROM votes WHERE chapter_id = 1;
# Should not error

# 4. Test join
SELECT v.*, c.title 
FROM votes v 
JOIN chapters c ON v.chapter_id = c.id 
LIMIT 5;
# Should work
```

---

## 📋 Environment Variables Check

Đảm bảo `.env` file đúng:

```env
# backend/.env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wattpad
DB_PORT=3306
```

---

## 🔍 Debug Steps

### **1. Check MySQL Connection**

```bash
cd backend
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'wattpad',
  port: process.env.DB_PORT || 3306,
};

mysql.createConnection(config)
  .then(conn => {
    console.log('✅ Connected to MySQL');
    return conn.query('SHOW COLUMNS FROM votes');
  })
  .then(([rows]) => {
    console.log('Votes table columns:', rows);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
"
```

### **2. Check Database Exists**

```sql
SHOW DATABASES LIKE 'wattpad';
USE wattpad;
SHOW TABLES;
```

### **3. Check Foreign Keys**

```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'wattpad' 
AND TABLE_NAME = 'votes';
```

---

## 🎯 Common Issues & Solutions

### **Issue 1: "Table doesn't exist"**
**Solution:** Chưa run `createdb.sql`
```bash
mysql -u root -p wattpad < backend/database/createdb.sql
```

### **Issue 2: "Foreign key constraint fails"**
**Solution:** Drop foreign keys trước:
```sql
ALTER TABLE votes DROP FOREIGN KEY fk_votes_chapter;
ALTER TABLE votes DROP FOREIGN KEY fk_votes_user;
-- Then recreate table
```

### **Issue 3: "Access denied"**
**Solution:** Check MySQL user permissions
```sql
GRANT ALL PRIVILEGES ON wattpad.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### **Issue 4: Different column names**
**Solution:** Rename columns
```sql
-- If column named differently
ALTER TABLE votes CHANGE old_name chapter_id INT NOT NULL;
```

---

## 📊 Complete Database Reset (Fresh Start)

Nếu muốn reset hoàn toàn:

```bash
# 1. Stop backend server
# Ctrl+C in terminal running npm run dev

# 2. Login MySQL
mysql -u root -p

# 3. Complete reset
DROP DATABASE IF EXISTS wattpad;
CREATE DATABASE wattpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wattpad;
source /Volumes/Data/Code/fer202/4.Assignment/whatpad/backend/database/createdb.sql;
source /Volumes/Data/Code/fer202/4.Assignment/whatpad/backend/database/insertdb.sql;
exit;

# 4. Restart backend
cd backend
npm run dev

# 5. Test in Postman
# GET http://localhost:4000/stories/1/chapters/1
```

---

## ✅ Success Indicators

After fix, you should see:

```
✅ No "Unknown column" errors
✅ Can vote chapters
✅ Can get chapter with vote count
✅ Can get comments count
✅ Postman tests pass
```

---

## 📞 Still Having Issues?

1. Check backend server logs for exact error
2. Check MySQL error log
3. Verify Node.js MySQL driver version: `npm list mysql2`
4. Try connecting with MySQL Workbench or DBeaver to manually inspect

---

**Created:** October 27, 2025  
**For:** Whatpad Chapter API nested routes implementation

