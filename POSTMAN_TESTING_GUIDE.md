# 📮 Postman Testing Guide - Whatpad Chapters API

## 📁 Files

Có 2 files Postman trong dự án:

1. **`Whatpad_Chapters_API.postman_collection.json`** - Collection với tất cả API endpoints
2. **`Whatpad.postman_environment.json`** - Environment variables

---

## 🚀 Quick Start

### 1. Import vào Postman

#### **Option A: Import Collection**
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Kéo thả file `Whatpad_Chapters_API.postman_collection.json`
4. Click **Import**

#### **Option B: Import Environment**
1. Click **Import** 
2. Kéo thả file `Whatpad.postman_environment.json`
3. Click **Import**

### 2. Chọn Environment

1. Góc phải trên, chọn dropdown **"No Environment"**
2. Chọn **"Whatpad - Local Development"**
3. Đảm bảo server đang chạy ở `http://localhost:4000`

---

## 🎯 Test Flow (Recommended Order)

### **Step 1: Health Check**
```
GET /health
```
- Đảm bảo server đang chạy
- Expected: `{ "ok": true }`

---

### **Step 2: Authentication**

#### **2a. Register (lần đầu)**
```
POST /auth/register
Body: {
  "username": "testuser",
  "email": "test@example.com", 
  "password": "Test123456"
}
```
- ✅ Token tự động lưu vào environment variable `{{token}}`

#### **2b. Login (lần sau)**
```
POST /auth/login
Body: {
  "email": "test@example.com",
  "password": "Test123456"
}
```
- ✅ Token tự động lưu vào `{{token}}`

#### **2c. Verify Token**
```
GET /auth/me
Header: Authorization: Bearer {{token}}
```
- Test xem token có hoạt động không

---

### **Step 3: Create Story**

```
POST /stories
Header: Authorization: Bearer {{token}}
Body: {
  "title": "Test Story for Chapters",
  "description": "Story để test chapter API",
  "status": "draft"
}
```
- ✅ Story ID tự động lưu vào `{{story_id}}`
- **LƯU Ý:** Cần có story trước khi tạo chapters!

---

### **Step 4: Create Chapter (Nested Route)**

```
POST /stories/{{story_id}}/chapters
Header: Authorization: Bearer {{token}}
Body: {
  "title": "Chapter 1: Beginning",
  "content": "Nội dung chapter...",
  "chapter_order": 1,
  "is_published": 1
}
```
- ✅ Sử dụng nested route `/stories/:storyId/chapters`
- ✅ Chapter ID tự động lưu vào `{{chapter_id}}`
- ✅ Validate user là owner của story

---

### **Step 5: Get Chapter (with validation)**

```
GET /stories/{{story_id}}/chapters/{{chapter_id}}
```
- Lấy chapter với validation
- Validate chapter thuộc về story

---

### **Step 6: Update Chapter**

```
PUT /stories/{{story_id}}/chapters/{{chapter_id}}
Header: Authorization: Bearer {{token}}
Body: {
  "title": "Chapter 1: Updated Title",
  "content": "Nội dung đã cập nhật...",
  "is_published": 1
}
```

---

### **Step 7: List All Chapters**

```
GET /chapters/story/{{story_id}}
```
hoặc
```
GET /stories/{{story_id}}/chapters
```

---

### **Step 8: Delete Chapter** ⚠️

```
DELETE /stories/{{story_id}}/chapters/{{chapter_id}}
Header: Authorization: Bearer {{token}}
```
- ⚠️ Run cuối cùng vì sẽ xóa chapter!

---

## 🧪 Validation Tests

### **Test 1: Get Chapter from Wrong Story (Should Fail)**
```
GET /stories/99999/chapters/{{chapter_id}}
```
**Expected Response:** 
```json
{
  "ok": false,
  "message": "Chapter not found or does not belong to this story",
  "errorCode": "CHAPTER_NOT_FOUND"
}
```

### **Test 2: Update Chapter in Wrong Story (Should Fail)**
```
PUT /stories/99999/chapters/{{chapter_id}}
Header: Authorization: Bearer {{token}}
Body: { "title": "Should not update" }
```
**Expected:** 404 error

### **Test 3: Create Chapter without Auth (Should Fail)**
```
POST /stories/{{story_id}}/chapters
(No Authorization header)
```
**Expected:**
```json
{
  "ok": false,
  "message": "No token provided",
  "errorCode": "NO_TOKEN"
}
```

---

## 📊 Collection Structure

```
Whatpad - Chapters API
├── 🔐 Auth
│   ├── Register (POST /auth/register)
│   ├── Login (POST /auth/login)
│   └── Get Current User (GET /auth/me)
│
├── 📖 Stories
│   ├── Create Story (POST /stories)
│   ├── Get Story by ID (GET /stories/:id)
│   └── List All Stories (GET /stories)
│
├── ✨ Chapters - Nested Routes (NEW)
│   ├── Create Chapter (POST /stories/:storyId/chapters)
│   ├── Get Chapter with validation (GET /stories/:storyId/chapters/:chapterId)
│   ├── Get Chapter - Wrong Story (Should Fail)
│   ├── Update Chapter (PUT /stories/:storyId/chapters/:chapterId)
│   ├── Update Chapter - Wrong Story (Should Fail)
│   └── Delete Chapter (DELETE /stories/:storyId/chapters/:chapterId)
│
├── 📚 Chapters - List & Legacy
│   ├── List Chapters by Story (GET /chapters/story/:storyId)
│   ├── List Chapters Alternative (GET /stories/:storyId/chapters)
│   └── Get Chapter by ID - Legacy (GET /chapters/:id)
│
└── ❤️ Health Check (GET /health)
```

---

## 🔄 Environment Variables

Collection tự động quản lý các variables sau:

| Variable | Description | Auto-set? |
|----------|-------------|-----------|
| `base_url` | API base URL | ✅ (default: http://localhost:4000) |
| `token` | JWT token | ✅ (sau khi login/register) |
| `user_id` | Current user ID | ✅ (sau khi login) |
| `story_id` | Story ID để test | ✅ (sau khi create story) |
| `chapter_id` | Chapter ID để test | ✅ (sau khi create chapter) |

### **Xem/Edit Variables:**
1. Click vào Environment "Whatpad - Local Development"
2. Xem current values
3. Có thể manually edit nếu cần

---

## 💡 Tips & Tricks

### **1. Test Scripts tự động**
Collection có test scripts để tự động lưu:
- Token sau khi login
- Story ID sau khi create story
- Chapter ID sau khi create chapter

### **2. Run toàn bộ Collection**
1. Click vào Collection name
2. Click **Run** button
3. Chọn các request cần chạy
4. Click **Run Whatpad - Chapters API**

### **3. Copy as cURL**
1. Click vào request
2. Click **Code** icon (góc phải)
3. Chọn **cURL**
4. Copy để chạy trong terminal

**Example:**
```bash
curl --location 'http://localhost:4000/stories/5/chapters' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--data '{
  "title": "Chapter 1",
  "content": "Content here...",
  "chapter_order": 1,
  "is_published": 1
}'
```

### **4. Duplicate Request**
Right-click request → **Duplicate** → Modify để test cases khác

---

## 🐛 Troubleshooting

### **❌ "No token provided"**
**Problem:** Chưa login hoặc token expired  
**Solution:** Run **Login** request lại

### **❌ "Chapter not found or does not belong to this story"**
**Problem:** `story_id` hoặc `chapter_id` không đúng  
**Solution:** 
1. Check environment variables
2. Create story mới nếu cần
3. Create chapter mới nếu cần

### **❌ "Not authorized"**
**Problem:** User không phải owner của story/chapter  
**Solution:** Login với user đã tạo story

### **❌ Connection Error**
**Problem:** Backend server không chạy  
**Solution:**
```bash
cd backend
npm run dev
```

---

## 📝 Example Full Test Flow

```bash
# 1. Start backend
cd backend
npm run dev

# 2. In Postman:
# - Import collection
# - Import environment
# - Select environment

# 3. Run requests in order:
✅ Health Check
✅ Register (hoặc Login)
✅ Get Current User (verify token)
✅ Create Story (lưu story_id)
✅ Create Chapter (lưu chapter_id)
✅ Get Chapter (verify created)
✅ List Chapters
✅ Update Chapter
✅ Get Chapter (verify updated)
✅ [Optional] Delete Chapter
```

---

## 🎓 Learning Resources

### **API Endpoints Documentation**
- Đọc file `CHAPTER_API_CHANGES.md` để hiểu nested routes
- Swagger UI: http://localhost:4000/docs

### **Test Different Scenarios:**

**Scenario 1: Multiple Chapters**
- Create nhiều chapters với `chapter_order` khác nhau
- Test sorting order

**Scenario 2: Permissions**
- Login với user khác
- Try update chapter của user khác
- Should get 403 Forbidden

**Scenario 3: Draft vs Published**
- Create chapter với `is_published: 0` (draft)
- Create chapter với `is_published: 1` (published)
- List chapters và verify

---

## ✅ Checklist

Sau khi import và setup, check:

- [ ] Collection imported successfully
- [ ] Environment imported and selected
- [ ] Backend server đang chạy (port 4000)
- [ ] Health check returns OK
- [ ] Register/Login thành công, token được lưu
- [ ] Create story thành công, story_id được lưu
- [ ] Create chapter thành công, chapter_id được lưu
- [ ] Tất cả nested routes hoạt động
- [ ] Validation tests fail đúng như expected

---

**Happy Testing! 🚀**

Nếu có vấn đề, check:
1. Server logs trong terminal
2. Postman Console (View → Show Postman Console)
3. Response trong Postman

