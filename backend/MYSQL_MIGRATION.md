# Migration from MSSQL to MySQL - Status

## ✅ Đã hoàn thành

1. **db.js** - Đã chuyển sang MySQL với mysql2/promise
2. **package.json** - Đã xóa mssql, giữ mysql2
3. **.env.example** - Đã cập nhật config MySQL
4. **auth/routes.js** - Đã convert sang MySQL syntax
5. **users/routes.js** - Đã bắt đầu convert (chưa xong hết)
6. **stories/service.js** - Đã update imports

## ⏳ Cần convert (MSSQL → MySQL)

### Routes cần update hoàn toàn:
- [ ] `src/modules/users/routes.js` - Update PUT /me, GET followers/following  
- [ ] `src/modules/stories/routes.js` - All routes
- [ ] `src/modules/stories/service.js` - checkStoryOwnership, getStoryWithTags
- [ ] `src/modules/chapters/routes.js` - All routes
- [ ] `src/modules/chapters/service.js` - All functions
- [ ] `src/modules/comments/routes.js` - All routes
- [ ] `src/modules/votes/routes.js` - All routes
- [ ] `src/modules/follows/routes.js` - All routes
- [ ] `src/modules/tags/routes.js` - All routes
- [ ] `src/modules/favorites/routes.js` - All routes
- [ ] `src/modules/reading/routes.js` - All routes
- [ ] `src/modules/reviews/routes.js` - All routes
- [ ] `src/modules/upload/routes.js` - OK (không dùng DB)

### Key MySQL Syntax Changes:

#### MSSQL:
```javascript
const { sql, poolPromise } = require('../db');
const pool = await poolPromise;
const result = await pool.request()
  .input('id', sql.Int, userId)
  .input('name', sql.NVarChar, name)
  .query('SELECT * FROM users WHERE id = @id AND name = @name');
const user = result.recordset[0];
```

#### MySQL:
```javascript
const pool = require('../../db');
const [rows] = await pool.query(
  'SELECT * FROM users WHERE id = ? AND name = ?',
  [userId, name]
);
const user = rows[0];
```

#### INSERT with OUTPUT → INSERT + SELECT:
```javascript
// MSSQL
const result = await pool.request()
  .input('name', sql.NVarChar, name)
  .query('INSERT INTO users (name) OUTPUT INSERTED.* VALUES (@name)');
const user = result.recordset[0];

// MySQL  
const [result] = await pool.query(
  'INSERT INTO users (name) VALUES (?)',
  [name]
);
const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
const user = users[0];
```

#### MERGE → INSERT ... ON DUPLICATE KEY:
```javascript
// MSSQL MERGE
MERGE tags AS target
USING (SELECT @name AS name) AS source
ON target.name = source.name
WHEN NOT MATCHED THEN INSERT (name) VALUES (@name)
OUTPUT INSERTED.id;

// MySQL
INSERT INTO tags (name) VALUES (?)
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
```

## 🚀 Next Steps

### Option 1: Manual convert từng file (chậm nhưng chính xác)
Bạn có thể tự convert từng route file theo pattern trên

### Option 2: Tôi tạo script tự động (nhanh nhưng cần test)
Tôi có thể tạo tất cả file mới đã convert sẵn

### Option 3: Sử dụng backend MSSQL hoàn chỉnh đã tạo
Nếu bạn có thể dùng MSSQL, code đã hoàn thiện 100%

## Recommended: Option 2

Bạn muốn tôi tạo tất cả file routes đã convert sang MySQL không? Sẽ mất ~5-10 phút để tạo tất cả.
