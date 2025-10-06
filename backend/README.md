# Wattpad-like Backend API

A complete Node.js + Express + MySQL backend for a Wattpad-like story platform.

## 🚀 Features

- **Authentication**: JWT-based auth (register, login, me) with 2h token expiry
- **Users**: Profile management, followers/following system
- **Stories**: CRUD operations, search, tags, publish/draft status
- **Chapters**: Full chapter management with ordering and publishing control
- **Comments**: Threaded comments on chapters
- **Votes**: Like/unlike chapters
- **Tags**: Story categorization with tags
- **Favorites**: Reading lists (favorite_lists + items)
- **Reading History**: Track user reading progress
- **Reviews**: Story reviews with ratings and likes
- **Follows**: Follow authors and stories
- **Upload**: Image upload to Cloudinary
- **API Documentation**: Interactive Swagger UI at `/docs`

## 📋 Requirements

- Node.js 14+
- MySQL 8.0+
- Cloudinary account (for image uploads)

## 🛠️ Installation

### 1. Install dependencies:
```bash
npm install
# or
yarn install
```

### 2. Setup environment variables:
```bash
cp .env.example .env
```

### 3. Configure `.env` with your credentials:
```env
PORT=4000
JWT_SECRET=your-long-random-secret-key-here

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=wattpad
DB_PORT=3306

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Setup MySQL Database:
```bash
# Login to MySQL
mysql -u root -p

# Run database creation script
source database/createdb.sql;

# (Optional) Insert sample data
source database/insertdb.sql;

# Exit MySQL
exit;
```

## 🏃 Running the Server

Development mode (auto-reload with nodemon):
```bash
npm run dev
# or
yarn dev
```

Production mode:
```bash
npm start
# or
yarn start
```

Server will start at `http://localhost:4000`

### ✅ Verify server is running:
- **Health Check**: http://localhost:4000/health
- **API Documentation**: http://localhost:4000/docs

## 🔑 API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT with 2h expiry)
- `GET /auth/me` - Get current user (protected)

### Users
- `GET /users/:id` - Get user profile
- `PUT /users/me` - Update own profile (protected)
- `GET /users/:id/followers` - Get user's followers
- `GET /users/:id/following` - Get users being followed

### Stories
- `GET /stories` - List published stories (supports `?q=search&tag=tagname&page=1&size=12`)
- `GET /stories/:id` - Get story with tags
- `POST /stories` - Create story (protected)
- `PUT /stories/:id` - Update story (protected, owner only)
- `POST /stories/:id/publish` - Publish story (protected, owner only)
- `DELETE /stories/:id` - Delete story (protected, owner only)

### Chapters
- `GET /stories/:storyId/chapters` - List chapters
- `GET /chapters/:id` - Get chapter
- `POST /chapters` - Create chapter (protected, owner only)
- `PUT /chapters/:id` - Update chapter (protected, owner only)
- `DELETE /chapters/:id` - Delete chapter (protected, owner only)

### Comments
- `GET /chapters/:id/comments` - Get chapter comments
- `POST /chapters/:id/comments` - Add comment (protected)
- `DELETE /comments/:id` - Delete comment (protected, owner only)

### Votes
- `POST /chapters/:id/vote` - Vote/like chapter (protected)
- `DELETE /chapters/:id/vote` - Remove vote (protected)

### Follows
- `POST /follows/:authorId` - Follow author (protected)
- `DELETE /follows/:authorId` - Unfollow author (protected)

### Tags
- `GET /tags` - List all tags
- `POST /tags` - Create tag (protected)
- `POST /stories/:id/tags` - Add tags to story (protected, owner only)
- `DELETE /stories/:id/tags/:tagId` - Remove tag from story (protected, owner only)

### Favorites (Reading Lists)
- `GET /favorites/me/favorite-lists` - Get my favorite lists (protected)
- `POST /favorites/me/favorite-lists` - Create favorite list (protected)
- `PUT /favorites/me/favorite-lists/:listId` - Update list (protected)
- `DELETE /favorites/me/favorite-lists/:listId` - Delete list (protected)
- `GET /favorites/me/favorite-lists/:listId/items` - Get list items (protected)
- `POST /favorites/me/favorite-lists/:listId/items` - Add story to list (protected)
- `DELETE /favorites/me/favorite-lists/:listId/items/:storyId` - Remove from list (protected)

### Reading History
- `GET /reading/me/reading-history` - Get reading history (protected, supports `?story_id=`)
- `POST /reading` - Update reading progress (protected)
- `POST /reading/followed-stories/:storyId` - Follow story (protected)
- `DELETE /reading/followed-stories/:storyId` - Unfollow story (protected)

### Reviews
- `GET /reviews/stories/:id/reviews` - Get story reviews
- `POST /reviews/stories/:id/reviews` - Create review (protected)
- `DELETE /reviews/:id` - Delete review (protected, owner only)
- `POST /reviews/:id/likes` - Like review (protected)
- `DELETE /reviews/:id/likes` - Unlike review (protected)

### Upload
- `POST /upload/image` - Upload image (protected, multipart/form-data with `file` field)

## 🔐 Authentication

Protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Token expires after 2 hours. No refresh token is used (as per requirements).

## 📊 Response Format

All endpoints return JSON with a consistent format:

**Success:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "ok": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

## 🗄️ Database

The backend uses **MySQL 8.0+** with the following main tables:
- `users` - User accounts and profiles
- `stories` - Story content and metadata
- `chapters` - Story chapters with ordering
- `tags`, `story_tags` - Story categorization
- `story_comments` - Threaded comments on chapters
- `story_reviews`, `review_likes` - Story reviews and interactions
- `votes` - Chapter likes/votes
- `follows` - User following relationships
- `followed_stories` - Story following
- `favorite_lists`, `favorite_list_items` - Reading lists
- `reading_history` - User reading progress tracking

### Security Features:
- ✅ **Parameterized queries** (`?` placeholders) for SQL injection protection
- ✅ **Password hashing** with bcrypt (10 rounds)
- ✅ **JWT authentication** with configurable secret
- ✅ **Input validation** on all endpoints

## 📝 Additional Notes

- **Pagination**: Default `page=1`, `size=12` for list endpoints
- **Search**: Use `?q=keyword` query parameter for text search
- **Timestamps**: All dates use MySQL `DATETIME` with `NOW()` function
- **Images**: URLs (avatar_url, cover_url) stored in DB, files hosted on Cloudinary
- **Token Expiry**: JWT tokens expire after 2 hours (no refresh token)
- **Security**: Change `JWT_SECRET` to a strong random value in production

## 🧪 Quick Test Flow

```bash
# 1. Start server
yarn dev

# 2. Check health
curl http://localhost:4000/health

# 3. Register user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123"}'

# 4. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'

# 5. Create story (use token from login)
curl -X POST http://localhost:4000/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"My First Story","description":"A great story"}'
```

## 📦 Project Structure

```
backend/
├── src/
│   ├── app.js              # Express application setup
│   ├── db.js               # MySQL connection pool (mysql2)
│   ├── mw/                 # Middleware
│   │   ├── auth.js         # JWT authentication
│   │   └── error.js        # Global error handler
│   ├── utils/              # Utility functions
│   │   ├── paging.js       # Pagination helper
│   │   └── slugify.js      # String slugification
│   ├── modules/            # Feature modules
│   │   ├── auth/           # Authentication (register, login, me)
│   │   ├── users/          # User profiles & relationships
│   │   ├── stories/        # Story CRUD & management
│   │   ├── chapters/       # Chapter management
│   │   ├── comments/       # Comment system
│   │   ├── votes/          # Chapter voting
│   │   ├── follows/        # Author following
│   │   ├── tags/           # Tag management
│   │   ├── favorites/      # Reading lists
│   │   ├── reading/        # Reading history
│   │   ├── reviews/        # Story reviews
│   │   └── upload/         # Cloudinary image upload
│   └── docs/
│       └── openapi.js      # Swagger/OpenAPI specification
├── database/
│   ├── createdb.sql        # MySQL schema (tables, indexes)
│   ├── insertdb.sql        # Sample test data
│   └── connection.json     # DB config (for reference)
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment template
├── package.json            # Dependencies & scripts
├── CONVERSION_COMPLETE.md  # MySQL migration summary
└── README.md               # This file
```

## 🔧 Tech Stack

- **Runtime**: Node.js 14+
- **Framework**: Express.js 4.18
- **Database**: MySQL 8.0+ with mysql2 driver
- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcryptjs
- **Image Upload**: Cloudinary + Multer
- **API Docs**: Swagger UI Express
- **Dev Tools**: Nodemon for auto-reload

## 📄 License

MIT
