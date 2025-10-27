# 🔍 Route Debugging Guide - /stories/:storyId/chapters/:chapterId

## ❌ Vấn đề: Không tìm thấy route `/stories/1/chapters/1`

---

## ✅ Quick Diagnosis

### **Step 1: Test Routes**

Chạy script test tự động:

```bash
# Từ project root
node test-routes.js
```

Script này sẽ test tất cả routes và báo cáo kết quả.

---

### **Step 2: Manual Test**

```bash
# 1. Check server đang chạy
curl http://localhost:4000/health

# Expected: {"ok":true}
# If error: Server chưa chạy → cd backend && npm run dev

# 2. Test nested route GET chapter
curl http://localhost:4000/stories/1/chapters/1

# Expected: Chapter data hoặc 404 (nếu chưa có data)
# If "Cannot GET": Route chưa được register đúng
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Cannot GET /stories/1/chapters/1"**

**Nghĩa là:** Express không tìm thấy route handler

**Nguyên nhân:**
- Server chưa restart sau khi sửa code
- Route order sai (generic route trước specific route)
- Router chưa được mount đúng

**Solution:**

```bash
# 1. Stop server (Ctrl+C)

# 2. Restart server
cd backend
npm run dev

# 3. Check console output for errors

# 4. Test lại
curl http://localhost:4000/stories/1/chapters/1
```

---

### **Issue 2: 404 Not Found (nhưng không phải "Cannot GET")**

**Nghĩa là:** Route hoạt động nhưng không tìm thấy data

**Solution:**

```sql
-- Check database có data không
mysql -u root -p wattpad

SELECT * FROM stories LIMIT 5;
SELECT * FROM chapters LIMIT 5;

-- Nếu không có data, insert sample:
INSERT INTO stories (user_id, title, description, status) 
VALUES (1, 'Test Story', 'Test description', 'published');

INSERT INTO chapters (story_id, title, content, chapter_order, is_published)
VALUES (1, 'Chapter 1', 'Content here...', 1, 1);

exit;
```

---

### **Issue 3: "Unknown column 'chapter_id'"**

**Solution:** Chạy migration để add column:

```bash
mysql -u root -p wattpad < backend/database/add_chapter_id_to_comments.sql
```

---

### **Issue 4: Route trả về HTML thay vì JSON**

**Nghĩa là:** Route không match, Express trả về default error page

**Check trong browser:**
- Nếu thấy HTML → Route sai
- Nếu thấy JSON → Route đúng

**Solution:** Verify route path chính xác:

```javascript
// ✅ ĐÚNG trong routes.js:
router.get('/stories/:storyId/chapters/:chapterId', ...)

// ✅ ĐÚNG trong app.js:
app.use('/', chaptersRoutes);

// 🔍 Full path = / + /stories/:storyId/chapters/:chapterId
// = /stories/:storyId/chapters/:chapterId ✅
```

---

## 📋 Checklist Debugging

Đi qua từng bước:

### **1. Server Status**
```bash
# Check server đang chạy
ps aux | grep "node.*app.js"

# Hoặc
lsof -i :4000

# Nếu không có → Start server
cd backend && npm run dev
```

### **2. Routes Registration**

Check file `backend/src/app.js`:

```javascript
// ✅ Phải có dòng này:
app.use('/', chaptersRoutes);
```

### **3. Route Definition**

Check file `backend/src/modules/chapters/routes.js`:

```javascript
// ✅ Route phải được define TRƯỚC /:id
router.get('/stories/:storyId/chapters/:chapterId', async (req, res, next) => {
  // ...
});

// ✅ Generic route sau cùng
router.get('/:id', async (req, res, next) => {
  // ...
});
```

### **4. Database Schema**

```sql
mysql -u root -p wattpad

-- Check tables exist
SHOW TABLES;
-- Expected: stories, chapters, votes, story_comments, ...

-- Check chapter_id exists
DESCRIBE story_comments;
-- Expected: có column chapter_id

DESCRIBE votes;
-- Expected: có column chapter_id

exit;
```

### **5. Test All Endpoints**

```bash
# Health check
curl http://localhost:4000/health

# List stories
curl http://localhost:4000/stories

# List chapters (old)
curl http://localhost:4000/chapters/story/1

# List chapters (nested)
curl http://localhost:4000/stories/1/chapters

# Get chapter (nested) ← THIS ONE
curl http://localhost:4000/stories/1/chapters/1

# Get chapter (legacy)
curl http://localhost:4000/chapters/1
```

---

## 🔧 Force Fix - Reset Everything

Nếu vẫn không hoạt động, reset hoàn toàn:

```bash
# 1. Stop server
# Ctrl+C

# 2. Reset database
mysql -u root -p -e "
DROP DATABASE IF EXISTS wattpad;
CREATE DATABASE wattpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"

mysql -u root -p wattpad < backend/database/createdb.sql
mysql -u root -p wattpad < backend/database/insertdb.sql

# 3. Clean node modules (nếu cần)
cd backend
rm -rf node_modules package-lock.json
npm install

# 4. Start server
npm run dev

# 5. Test
curl http://localhost:4000/stories/1/chapters/1
```

---

## 📊 Expected Routes Map

Sau khi setup đúng, các routes này phải hoạt động:

```
✅ GET  /health
✅ GET  /stories
✅ GET  /stories/:id
✅ GET  /chapters/story/:storyId          (list chapters)
✅ GET  /stories/:storyId/chapters        (list chapters - nested)
✅ GET  /stories/:storyId/chapters/:chapterId  (get chapter - nested) ⭐
✅ GET  /chapters/:id                     (get chapter - legacy)
✅ POST /stories/:storyId/chapters        (create - requires auth)
✅ PUT  /stories/:storyId/chapters/:chapterId  (update - requires auth)
✅ DELETE /stories/:storyId/chapters/:chapterId (delete - requires auth)
```

---

## 🧪 Test Script Output

Khi chạy `node test-routes.js`, expected output:

```
🧪 Testing Whatpad API Routes

==================================================
Testing: /health
✅ PASS [200] Health check
Testing: /stories
✅ PASS [200] List stories
Testing: /stories/1
✅ PASS [200] Get story by ID
Testing: /chapters/story/1
✅ PASS [200] List chapters (old route)
Testing: /stories/1/chapters
✅ PASS [200] List chapters (nested route)
Testing: /stories/1/chapters/1
✅ PASS [200] ✨ Get chapter (nested route) ← MUST PASS
Testing: /chapters/1
✅ PASS [200] Get chapter (legacy route)
==================================================

✅ Testing completed!
```

Nếu có ❌ FAIL hoặc ERROR → Check phần đó trong guide này.

---

## 🆘 Still Not Working?

### **Enable Debug Mode**

```javascript
// backend/src/app.js
// Add trước tất cả routes:

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

Restart server và check console mỗi khi request.

### **Check Route Registration**

```javascript
// backend/src/app.js
// Add sau khi mount routes:

app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('Route:', r.route.path)
  }
});
```

---

**Last Updated:** October 27, 2025  
**For:** Whatpad Chapters API Nested Routes

