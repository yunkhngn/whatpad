# Chapter API Changes - Nested Resource Routes

## 📋 Tổng quan thay đổi

Đã cập nhật API endpoints cho chapters theo cấu trúc **nested resource** (RESTful). Giờ đây tất cả CRUD operations cho chapters yêu cầu `storyId` trong URL để đảm bảo chapter thuộc về đúng story.

## 🔄 API Endpoints Thay đổi

### **Before (Cũ)**
```
GET    /chapters/:id
POST   /chapters
PUT    /chapters/:id
DELETE /chapters/:id
```

### **After (Mới)**
```
GET    /chapters/:id                              (legacy - for reading page)
GET    /stories/:storyId/chapters/:chapterId      (new - with validation)
POST   /stories/:storyId/chapters
PUT    /stories/:storyId/chapters/:chapterId
DELETE /stories/:storyId/chapters/:chapterId
```

---

## 📌 Chi tiết từng endpoint

### 1. **GET Chapter** - Có 2 variants:

#### **Variant 1: Legacy endpoint** (backward compatibility)
```
GET /chapters/:id
```
- Dùng cho reading page hiện tại
- Không validate storyId
- Response giống như cũ

**Example:**
```javascript
// Frontend
const chapter = await getChapterById(123);

// API Call
GET /chapters/123
```

#### **Variant 2: Nested endpoint** (recommended)
```
GET /stories/:storyId/chapters/:chapterId
```
- Validate chapter thuộc về story
- Return 404 nếu chapter không thuộc story
- Recommended cho tương lai

**Example:**
```javascript
// Frontend
const chapter = await getChapterByStoryAndId(5, 123);

// API Call
GET /stories/5/chapters/123
```

---

### 2. **CREATE Chapter**

```
POST /stories/:storyId/chapters
```

**Request Body:**
```json
{
  "title": "Chapter 1: Beginning",
  "content": "Story content here...",
  "chapter_order": 1,
  "is_published": 1
}
```

**Frontend Usage:**
```javascript
await createChapter(storyId, {
  title: "Chapter 1",
  content: "...",
  chapter_order: 1,
  is_published: 1
});
```

**Validation:**
- ✅ Require authentication
- ✅ User must be story owner
- ✅ Auto-validate storyId from URL

---

### 3. **UPDATE Chapter**

```
PUT /stories/:storyId/chapters/:chapterId
```

**Request Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "chapter_order": 2,
  "is_published": 1
}
```

**Frontend Usage:**
```javascript
await updateChapter(storyId, chapterId, {
  title: "New title",
  is_published: 1
});
```

**Validation:**
- ✅ Require authentication
- ✅ User must be chapter owner
- ✅ Chapter must belong to story (validates storyId)
- ✅ Return 404 if chapter not in story

---

### 4. **DELETE Chapter**

```
DELETE /stories/:storyId/chapters/:chapterId
```

**Frontend Usage:**
```javascript
await deleteChapter(storyId, chapterId);
```

**Validation:**
- ✅ Require authentication
- ✅ User must be chapter owner
- ✅ Chapter must belong to story
- ✅ Return 404 if chapter not in story

---

## 🎯 Lợi ích của nested routes

### 1. **Bảo mật tốt hơn**
- Validate chapter thuộc về đúng story
- Prevent unauthorized access to chapters from other stories
- Clear ownership hierarchy

### 2. **RESTful và rõ ràng**
```
/stories/5/chapters/123  ← Rõ ràng chapter 123 thuộc story 5
/chapters/123            ← Không rõ chapter thuộc story nào
```

### 3. **Dễ maintain và scale**
- Consistent API structure
- Easier to add permissions/validation
- Better for API documentation

---

## 📝 Frontend API Changes

### **api.js Updates**

```javascript
// ✅ Legacy (giữ lại cho reading page)
export const getChapterById = async (chapterId) => {
    const response = await apiRequest(`/chapters/${chapterId}`);
    return { chapter: response.chapter };
};

// ✅ New variant with validation
export const getChapterByStoryAndId = async (storyId, chapterId) => {
    const response = await apiRequest(`/stories/${storyId}/chapters/${chapterId}`);
    return { chapter: response.chapter };
};

// ✅ CRUD với storyId
export const createChapter = async (storyId, chapterData) => {
    return apiRequest(`/stories/${storyId}/chapters`, {
        method: 'POST',
        body: JSON.stringify(chapterData),
    });
};

export const updateChapter = async (storyId, chapterId, chapterData) => {
    return apiRequest(`/stories/${storyId}/chapters/${chapterId}`, {
        method: 'PUT',
        body: JSON.stringify(chapterData),
    });
};

export const deleteChapter = async (storyId, chapterId) => {
    return apiRequest(`/stories/${storyId}/chapters/${chapterId}`, {
        method: 'DELETE',
    });
};
```

---

## ⚠️ Breaking Changes

### **Các hàm cần update parameters:**

#### **createChapter**
```javascript
// ❌ Old
createChapter({ story_id: 5, title: "...", content: "..." })

// ✅ New
createChapter(5, { title: "...", content: "..." })
```

#### **updateChapter**
```javascript
// ❌ Old
updateChapter(chapterId, { title: "..." })

// ✅ New  
updateChapter(storyId, chapterId, { title: "..." })
```

#### **deleteChapter**
```javascript
// ❌ Old
deleteChapter(chapterId)

// ✅ New
deleteChapter(storyId, chapterId)
```

---

## 🧪 Testing Examples

### **Create Chapter**
```bash
curl -X POST http://localhost:4000/stories/5/chapters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Chapter 1",
    "content": "Story begins...",
    "chapter_order": 1,
    "is_published": 1
  }'
```

### **Update Chapter**
```bash
curl -X PUT http://localhost:4000/stories/5/chapters/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Chapter Title",
    "is_published": 1
  }'
```

### **Delete Chapter**
```bash
curl -X DELETE http://localhost:4000/stories/5/chapters/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Get Chapter (with validation)**
```bash
# ✅ Valid - chapter 123 belongs to story 5
GET http://localhost:4000/stories/5/chapters/123

# ❌ Invalid - chapter 123 doesn't belong to story 99
GET http://localhost:4000/stories/99/chapters/123
# Returns: 404 "Chapter not found or does not belong to this story"
```

---

## 📚 Migration Guide

### **For existing components using chapters:**

1. **Reading Page** - Không cần thay đổi (dùng legacy endpoint)
   
2. **Story Management/Edit Page** - Update để dùng nested routes:
   ```javascript
   // When creating chapter
   const newChapter = await createChapter(story.id, chapterData);
   
   // When updating chapter
   await updateChapter(story.id, chapter.id, updates);
   
   // When deleting chapter
   await deleteChapter(story.id, chapter.id);
   ```

---

## ✅ Status

- ✅ Backend routes updated
- ✅ Frontend API service updated
- ✅ Backward compatibility maintained for reading page
- ⏳ Need to update components that use chapter CRUD (when implemented)

---

**Date:** October 27, 2025  
**Version:** 1.0.0

