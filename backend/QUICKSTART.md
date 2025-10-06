# Quick Start Guide

## ✅ Setup Completed!

Your Wattpad-like backend is ready! All files have been created.

## 📋 Before Running

### 1. Configure Environment Variables

Edit `.env` file with your credentials:

```env
PORT=4000
JWT_SECRET=your-secure-secret-key-here

# MSSQL Configuration
SQL_SERVER=localhost
SQL_USER=sa
SQL_PASSWORD=YourPassword
SQL_DB=wattpad
SQL_ENCRYPT=false

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Setup Database

Run the SQL scripts in your MSSQL server:

```bash
# Connect to MSSQL and run:
1. database/createdb.sql   # Creates all tables
2. database/insertdb.sql   # (Optional) Insert sample data
```

## 🚀 Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 🧪 Test the API

### 1. Health Check
```bash
curl http://localhost:4000/health
# Expected: {"ok":true}
```

### 2. API Documentation
Open browser: http://localhost:4000/docs

### 3. Register a User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

This returns a JWT token. Use it for protected endpoints:

### 5. Create a Story (Protected)
```bash
curl -X POST http://localhost:4000/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Story",
    "description": "An amazing adventure",
    "tags": ["fantasy", "adventure"]
  }'
```

### 6. Upload Image (Protected)
```bash
curl -X POST http://localhost:4000/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

## 📚 API Overview

### Authentication
- ✅ Simple JWT (2h expiry, no refresh token)
- ✅ bcrypt password hashing
- ✅ Bearer token auth

### Core Features
- ✅ Users: profiles, followers, following
- ✅ Stories: CRUD, search, tags, publish
- ✅ Chapters: CRUD, ordering, ownership
- ✅ Comments: threaded comments
- ✅ Votes: chapter likes
- ✅ Tags: story categorization
- ✅ Favorites: reading lists
- ✅ Reading History: progress tracking
- ✅ Reviews: ratings & likes
- ✅ Upload: Cloudinary integration

### Security
- ✅ All queries use parameterized inputs (SQL injection protection)
- ✅ Ownership checks for protected resources
- ✅ JWT token validation

### API Design
- ✅ Consistent JSON responses: `{ ok, data?, message?, errorCode? }`
- ✅ Pagination: `?page=1&size=12`
- ✅ Search: `?q=keyword`
- ✅ Swagger documentation

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── app.js                 # Main Express app
│   ├── db.js                  # MSSQL connection
│   ├── mw/                    # Middleware
│   │   ├── auth.js           # JWT authentication
│   │   └── error.js          # Error handler
│   ├── utils/                # Utilities
│   │   ├── paging.js         # Pagination helper
│   │   └── slugify.js        # Slugify helper
│   ├── modules/              # API modules (routes + services)
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
│       └── openapi.js        # Swagger specification
├── database/
│   ├── createdb.sql          # Database schema
│   └── insertdb.sql          # Sample data
├── .env                      # Environment variables
├── .env.example              # Environment template
├── package.json              # Dependencies
├── README.md                 # Full documentation
└── QUICKSTART.md            # This file
```

## 🔍 Troubleshooting

### Database Connection Issues
1. Check MSSQL server is running
2. Verify credentials in `.env`
3. Ensure database `wattpad` exists
4. Check firewall/port settings (default 1433)

### Cloudinary Upload Issues
1. Verify credentials in `.env`
2. Check API key permissions
3. Ensure image size < 5MB

### JWT Token Issues
1. Token expires after 2 hours (get new one via login)
2. Include `Bearer ` prefix in Authorization header
3. Verify JWT_SECRET matches between requests

## 📖 Full Documentation

See [README.md](./README.md) for complete API documentation.

## 🎯 What's Next?

1. **Test Auth Flow**: Register → Login → Get profile
2. **Test Story CRUD**: Create → Update → Publish → List
3. **Test Chapter CRUD**: Create → List → Update
4. **Test Comments & Votes**: Add comments, vote on chapters
5. **Test Upload**: Upload cover images for stories

Happy coding! 🚀
