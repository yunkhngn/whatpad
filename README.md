

Wattpad clone – whatapp
=======================

## ⚡ Quick Start

### Backend (JSON Server)
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:4000
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### 🖼️ Image Upload Setup (Cloudinary)
See [CLOUDINARY-SETUP.md](CLOUDINARY-SETUP.md) for detailed instructions.

**Quick Setup:**
1. Create `backend/.env` file
2. Add your Cloudinary credentials (from https://cloudinary.com)
3. Restart backend

**Default Admin Account:**
- Email: `admin@whatpad.com`
- Password: `admin123`

---

Mục tiêu
--------
Tạo bản clone tối giản kiểu Wattpad để học fullstack. Tập trung vào CRUD truyện, chapter, đọc truyện, theo dõi tác giả, vote và comment. FE dùng React Router và React Bootstrap. BE dùng Node.js Express + JSON Server. Ảnh lưu Cloudinary. DB chỉ giữ URL.

Tính năng MVP
-------------
- Đăng ký và đăng nhập tài khoản qua MSSQL với mật khẩu được hash bằng bcrypt
- Hồ sơ người dùng và theo dõi tác giả
- Tạo truyện, mô tả, cover, gắn tag
- Tạo chapter, sắp thứ tự, publish hoặc unpublish
- Đọc truyện theo chapter, lưu vị trí đọc theo phần trăm
- Vote chương và comment theo thread
- Reading list ở chế độ công khai hoặc riêng tư
- Tìm kiếm theo tiêu đề, mô tả, tag

Kiến trúc và công nghệ
----------------------
Frontend
- React
- React Router
- React Bootstrap

Backend
- Node.js và Express
- mssql driver
- cors, dotenv
- bcryptjs để hash mật khẩu
- jsonwebtoken để phát hành và kiểm tra JWT
- multer để nhận file upload trước khi đẩy lên Cloudinary

Database
- SQL Server 2022
- Toàn bộ dữ liệu văn bản dùng NVARCHAR để hỗ trợ Unicode

Lưu trữ media
- Cloudinary hay S3. Dự án mẫu dùng Cloudinary. DB chỉ lưu secure_url

Cấu trúc thư mục dự kiến
------------------------
```
whatapp
  backend
    src
      app.js
      db.js
      mw
        auth.js
      routes
        auth.js
        stories.js
        chapters.js
        social.js
        upload.js
    .env.example
    package.json
  frontend
    src
      pages
        Home.jsx
        Login.jsx
        Read.jsx
        CreateStory.jsx
      api.js
      main.jsx
    package.json
  sql
    01_schema.sql
  README.md
  docker-compose.yml
```

Yêu cầu hệ thống
----------------
- Node.js phiên bản LTS
- Docker để chạy SQL Server cho môi trường dev
- Tài khoản Cloudinary nếu dùng upload ảnh

Khởi chạy nhanh với Docker cho SQL Server
-----------------------------------------
```
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

Tạo database và schema
----------------------
- Mở Azure Data Studio hoặc sqlcmd
- Chạy file sql/01_schema.sql

Biến môi trường backend
-----------------------
Tạo file backend/.env dựa trên mẫu dưới đây
```
PORT=4000
JWT_SECRET=supersecret
SQL_SERVER=localhost
SQL_USER=sa
SQL_PASSWORD=YourStrong!Passw0rd
SQL_DB=wattpad
SQL_ENCRYPT=false

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

Cài đặt và chạy backend
-----------------------
```
cd backend
npm i
npm run dev
```
API sẽ lắng nghe tại http://localhost:4000

Cài đặt và chạy frontend
------------------------
```
cd frontend
npm i
npm run dev
```
Ứng dụng FE mặc định chạy Vite tại http://localhost:5173

Luồng xác thực
--------------
- Đăng ký qua đường dẫn POST /auth/register với username, email, password
- Đăng nhập qua POST /auth/login nhận về access token dạng JWT
- FE đính kèm header Authorization với giá trị Bearer token cho các yêu cầu bảo vệ

Đầu mục API chính
-----------------
Auth
- POST /auth/register
- POST /auth/login

Users và social
- GET /users/:id để lấy profile cơ bản
- POST /social/follow/:userId để theo dõi
- DELETE /social/follow/:userId để bỏ theo dõi

Stories
- GET /stories với tham số q và tag cho tìm kiếm cơ bản
- POST /stories tạo truyện ở trạng thái draft
- POST /stories/:id/publish đổi trạng thái sang published

Chapters
- GET /chapters/by-story/:storyId để liệt kê chương theo thứ tự
- GET /chapters/:id để đọc một chương
- POST /chapters/create để tạo chương mới với order_index và published_at tùy chọn
- POST /chapters/:id/progress để lưu vị trí đọc
- POST /chapters/:id/vote và DELETE /chapters/:id/vote để vote hoặc gỡ vote
- GET /chapters/:id/comments và POST /chapters/:id/comments để lấy và thêm comment

Upload cover
------------
- POST /upload/cover nhận form data với field file
- Backend dùng multer memory storage và đẩy lên Cloudinary
- Phản hồi trả về url để lưu trong bảng stories

Mô hình dữ liệu cốt lõi
-----------------------
- users id username email password_hash avatar_url bio
- stories id author_id title description cover_url status created_at updated_at
- chapters id story_id title body order_index published_at
- tags id name slug
- story_tags story_id tag_id
- comments id chapter_id user_id content parent_id created_at
- votes chapter_id user_id created_at
- follows follower_id following_user_id created_at
- reading_lists id user_id name is_private created_at
- reading_list_items list_id story_id order_index added_at
- reading_progress user_id story_id chapter_id percent updated_at

Quy ước và bảo mật
------------------
- Luôn dùng tham số hóa truy vấn khi thao tác với mssql
- Mật khẩu phải được hash bằng bcrypt với salt rounds bằng 10 trở lên
- JWT đặt thời gian sống hợp lý và lưu trên bộ nhớ FE. Không lưu trong localStorage nếu không cần
- Với ảnh do người dùng tải lên cần kiểm tra loại tệp và kích thước ở tầng backend

Lộ trình mở rộng sau MVP
------------------------
- Reading list API và giao diện quản lý list
- Trang Story Detail với danh sách chapter và nút Publish cho tác giả
- Bộ lọc theo tag và phân trang phía server
- Redis cache cho trang Trending và danh sách
- Full text search trên SQL Server hoặc Meilisearch
- Thông báo realtime cho vote và comment qua WebSocket

Giấy phép
---------
Dùng cho mục đích học tập