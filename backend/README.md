# Wattpad-like Backend API

A complete Node.js + Express + MSSQL backend for a Wattpad-like story platform.

## 🚀 Features

- **Authentication**: Simple JWT-based auth (register, login, me)
- **Users**: Profile management, followers/following
- **Stories**: CRUD operations, search, tags, publish/draft status
- **Chapters**: Full chapter management with ordering
- **Comments**: Threaded comments on chapters
- **Votes**: Like/unlike chapters
- **Tags**: Story categorization with tags
- **Favorites**: Reading lists (favorite_lists + items)
- **Reading History**: Track user progress
- **Reviews**: Story reviews with likes
- **Follows**: Follow authors and stories
- **Upload**: Image upload to Cloudinary
- **API Documentation**: Swagger UI at `/docs`

## 📋 Requirements

- Node.js 14+
- MSSQL Server
- Cloudinary account (for image uploads)

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
```env
PORT=4000
JWT_SECRET=your-secret-key

SQL_SERVER=localhost
SQL_USER=sa
SQL_PASSWORD=YourPassword
SQL_DB=wattpad
SQL_ENCRYPT=false

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. Run the database scripts (in order):
```bash
# Run createdb.sql to create all tables
# Run insertdb.sql to insert sample data (optional)
```

## 🏃 Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start at `http://localhost:4000`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/health

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

The backend uses MSSQL with the following main tables:
- users
- stories
- chapters
- tags, story_tags
- story_comments
- story_reviews, review_likes
- votes
- follows
- followed_stories
- favorite_lists, favorite_list_items
- reading_history

All queries use parameterized inputs (`.input()`) for SQL injection protection.

## 📝 Notes

- Pagination: Default `page=1`, `size=12`
- Search: Use `?q=keyword` query parameter
- All timestamps are `DATETIME2` in MSSQL
- Image URLs (avatar_url, cover_url) are stored in DB, actual images on Cloudinary
- Password hashing uses bcrypt with 10 rounds
- JWT secret should be changed in production

## 🧪 Quick Test

1. Start server: `npm run dev`
2. Check health: `GET http://localhost:4000/health`
3. Register: `POST http://localhost:4000/auth/register`
4. Login: `POST http://localhost:4000/auth/login`
5. Create story: `POST http://localhost:4000/stories` (with Bearer token)

## 📦 Project Structure

```
backend/
├── src/
│   ├── app.js              # Main application
│   ├── db.js               # MSSQL connection
│   ├── mw/                 # Middleware
│   │   ├── auth.js         # JWT auth middleware
│   │   └── error.js        # Error handler
│   ├── utils/              # Utilities
│   │   ├── paging.js       # Pagination helper
│   │   └── slugify.js      # Slugify helper
│   ├── modules/            # API modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── stories/
│   │   ├── chapters/
│   │   ├── comments/
│   │   ├── votes/
│   │   ├── follows/
│   │   ├── tags/
│   │   ├── favorites/
│   │   ├── reading/
│   │   ├── reviews/
│   │   └── upload/
│   └── docs/
│       └── openapi.js      # Swagger spec
├── database/
│   ├── createdb.sql        # DB schema
│   └── insertdb.sql        # Sample data
├── .env.example
├── package.json
└── README.md
```

## 📄 License

MIT
