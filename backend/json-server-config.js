// Load environment variables
require('dotenv').config();

const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const PORT = process.env.PORT || 4000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify Cloudinary configuration
console.log('=== CLOUDINARY CONFIG ===');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
console.log('========================');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware
server.use(middlewares);
server.use(jsonServer.bodyParser);

// CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'No token provided', errorCode: 'NO_TOKEN' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token expired', errorCode: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ ok: false, message: 'Invalid token', errorCode: 'INVALID_TOKEN' });
  }
};

// Optional auth middleware
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required', errorCode: 'FORBIDDEN' });
  }
  next();
};

// Disable cache middleware
server.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Helper to get db
const getDb = () => {
  const dbPath = path.join(__dirname, 'db.json');
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

// Helper to save db
const saveDb = (data) => {
  const dbPath = path.join(__dirname, 'db.json');
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Helper to generate ID
const generateId = (items) => {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(item => item.id || 0)) + 1;
};

// Health check
server.get('/health', (req, res) => {
  res.json({ ok: true });
});

// ==================== AUTH ROUTES ====================

// POST /auth/register
server.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Missing required fields', errorCode: 'MISSING_FIELDS' });
    }

    const db = getDb();
    
    // Check if user exists
    const existing = db.users.find(u => u.email === email || u.username === username);
    if (existing) {
      return res.status(409).json({ ok: false, message: 'User already exists', errorCode: 'USER_EXISTS' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: generateId(db.users),
      username,
      email,
      password_hash,
      role: 'user', // Default role
      bio: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.users.push(user);
    saveDb(db);

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      ok: true,
      data: userWithoutPassword,
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /auth/login
server.post('/auth/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email; // Accept either username or email

    if (!loginIdentifier || !password) {
      return res.status(400).json({ ok: false, message: 'Username and password are required', errorCode: 'MISSING_CREDENTIALS' });
    }

    const db = getDb();
    // Find user by email or username
    const user = db.users.find(u => u.email === loginIdentifier || u.username === loginIdentifier);

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Username not found', errorCode: 'USER_NOT_FOUND' });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Incorrect password', errorCode: 'WRONG_PASSWORD' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    res.json({
      ok: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /auth/me
server.get('/auth/me', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Remove password from response
    const { password_hash: _, ...userWithoutPassword } = user;

    res.json({
      ok: true,
      data: userWithoutPassword
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== ADMIN ROUTES ====================

// GET /admin/stories/pending - Get stories waiting for approval
server.get('/admin/stories/pending', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { 
      tag, 
      author, 
      search,
      timeFilter, // 'today', 'week', 'month', or 'all'
      page = 1, 
      size = 20 
    } = req.query;
    
    console.log('[Admin Stories] Query params:', { tag, author, search, timeFilter, page, size });
    
    // New system with chapter-level control:
    // - published=false, approved=false → Draft (NOT shown in admin)
    // - published=true, approved=false → Pending (shown in admin, waiting approval)
    // - published=true, approved=true → Approved (visible on homepage)
    // - Story shown if: story is pending OR story has any pending chapters
    
    // Get stories that are published but not yet approved
    let pendingStories = db.stories.filter(s => s.published === true && s.approved === false);
    
    // Also get stories that have at least one pending chapter (published but not approved)
    const storiesWithPendingChapters = [];
    db.stories.forEach(story => {
      if (story.published === true && story.approved === true) {
        // Check if this approved story has any pending chapters
        const hasPendingChapters = db.chapters.some(c => 
          c.story_id === story.id && 
          c.published === true && 
          c.approved === false
        );
        if (hasPendingChapters) {
          storiesWithPendingChapters.push(story);
        }
      }
    });
    
    // Combine both lists and remove duplicates
    const storyIds = new Set([...pendingStories.map(s => s.id), ...storiesWithPendingChapters.map(s => s.id)]);
    let stories = db.stories.filter(s => storyIds.has(s.id));
    
    console.log(`[Admin Stories] Pending stories: ${pendingStories.length}, Stories with pending chapters: ${storiesWithPendingChapters.length}, Total: ${stories.length}`);
    
    // Filter by author name if provided
    if (author) {
      const authorLower = author.toLowerCase();
      stories = stories.filter(s => {
        const user = db.users.find(u => u.id === s.user_id);
        return user?.username?.toLowerCase().includes(authorLower);
      });
    }
    
    // Filter by tag if provided
    if (tag) {
      const storyIds = db.story_tags
        .filter(st => {
          const tagObj = db.tags.find(t => t.id === st.tag_id && t.name === tag);
          return !!tagObj;
        })
        .map(st => st.story_id);
      
      stories = stories.filter(s => storyIds.includes(s.id));
    }
    
    // General search - searches in title, description, author name, and tags
    if (search) {
      const searchLower = search.toLowerCase();
      stories = stories.filter(s => {
        // Check title and description
        const titleMatch = s.title?.toLowerCase().includes(searchLower);
        const descMatch = s.description?.toLowerCase().includes(searchLower);
        
        // Check author name
        const author = db.users.find(u => u.id === s.user_id);
        const authorMatch = author?.username?.toLowerCase().includes(searchLower);
        
        // Check tags
        const storyTagIds = db.story_tags.filter(st => st.story_id === s.id).map(st => st.tag_id);
        const storyTags = db.tags.filter(t => storyTagIds.includes(t.id));
        const tagMatch = storyTags.some(t => t.name?.toLowerCase().includes(searchLower));
        
        return titleMatch || descMatch || authorMatch || tagMatch;
      });
    }
    
    // Filter by time
    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      stories = stories.filter(s => {
        const createdAt = new Date(s.created_at);
        
        if (timeFilter === 'today') {
          return createdAt >= today;
        } else if (timeFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt >= weekAgo;
        } else if (timeFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return createdAt >= monthAgo;
        }
        
        return true;
      });
    }
    
    // Add author info and tags
    stories = stories.map(story => {
      const author = db.users.find(u => u.id === story.user_id);
      const storyTagIds = db.story_tags.filter(st => st.story_id === story.id).map(st => st.tag_id);
      const tags = db.tags.filter(t => storyTagIds.includes(t.id));
      
      return {
        ...story,
        author_name: author?.username,
        tags: tags,
        chapter_count: db.chapters.filter(c => c.story_id === story.id).length
      };
    });
    
    // Sort by created_at descending (newest first)
    stories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const offset = (page - 1) * size;
    const paginatedStories = stories.slice(offset, offset + parseInt(size));
    
    res.json({
      ok: true,
      stories: paginatedStories,
      total: stories.length,
      page: parseInt(page),
      size: parseInt(size)
    });
  } catch (err) {
    console.error('Get pending stories error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /admin/stories/:id/approve - Approve a story
server.put('/admin/stories/:id/approve', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.id);
    const storyIndex = db.stories.findIndex(s => s.id === storyId);
    
    if (storyIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }
    
    // Set approved to true (story must be published=true already)
    db.stories[storyIndex].approved = true;
    db.stories[storyIndex].approved_at = new Date().toISOString();
    db.stories[storyIndex].approved_by = req.user.id;
    db.stories[storyIndex].updated_at = new Date().toISOString();
    
    // Clear rejection flags when approving
    db.stories[storyIndex].rejected = false;
    db.stories[storyIndex].rejected_at = null;
    db.stories[storyIndex].rejected_by = null;
    db.stories[storyIndex].rejection_reason = null;
    
    saveDb(db);
    
    res.json({
      ok: true,
      data: db.stories[storyIndex],
      message: 'Story approved successfully'
    });
  } catch (err) {
    console.error('Approve story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /admin/stories/:id/unapprove - Unapprove a story
server.put('/admin/stories/:id/unapprove', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.id);
    const storyIndex = db.stories.findIndex(s => s.id === storyId);
    
    if (storyIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }
    
    // Set approved to false but keep published=true so it goes back to pending
    db.stories[storyIndex].approved = false;
    db.stories[storyIndex].approved_at = null;
    db.stories[storyIndex].approved_by = null;
    db.stories[storyIndex].updated_at = new Date().toISOString();
    
    saveDb(db);
    
    res.json({
      ok: true,
      data: db.stories[storyIndex],
      message: 'Story unapproved successfully'
    });
  } catch (err) {
    console.error('Unapprove story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /admin/stories/:id/reject - Reject a story
server.put('/admin/stories/:id/reject', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.id);
    const { reason } = req.body; // Get rejection reason from request body
    const storyIndex = db.stories.findIndex(s => s.id === storyId);
    
    if (storyIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ ok: false, message: 'Rejection reason is required' });
    }
    
    // Reject story by setting both published and approved to false
    db.stories[storyIndex].published = false;
    db.stories[storyIndex].approved = false;
    db.stories[storyIndex].approved_at = null;
    db.stories[storyIndex].approved_by = null;
    db.stories[storyIndex].rejected = true;
    db.stories[storyIndex].rejected_at = new Date().toISOString();
    db.stories[storyIndex].rejected_by = req.user.id;
    db.stories[storyIndex].rejection_reason = reason.trim();
    db.stories[storyIndex].updated_at = new Date().toISOString();
    
    // Also unpublish all chapters
    db.chapters.forEach((chapter, idx) => {
      if (chapter.story_id === storyId) {
        db.chapters[idx].published = false;
        db.chapters[idx].approved = false;
        db.chapters[idx].updated_at = new Date().toISOString();
      }
    });
    
    saveDb(db);
    
    res.json({
      ok: true,
      data: db.stories[storyIndex],
      message: 'Story rejected successfully'
    });
  } catch (err) {
    console.error('Reject story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /admin/chapters/:id/approve - Approve a chapter
server.put('/admin/chapters/:id/approve', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const chapterId = parseInt(req.params.id);
    const chapterIndex = db.chapters.findIndex(c => c.id === chapterId);
    
    if (chapterIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }
    
    const chapter = db.chapters[chapterIndex];
    
    // Verify chapter is published (can only approve published chapters)
    if (!chapter.published) {
      return res.status(400).json({ ok: false, message: 'Cannot approve unpublished chapter' });
    }
    
    // Set approved to true
    db.chapters[chapterIndex].approved = true;
    db.chapters[chapterIndex].approved_at = new Date().toISOString();
    db.chapters[chapterIndex].approved_by = req.user.id;
    db.chapters[chapterIndex].updated_at = new Date().toISOString();
    
    saveDb(db);
    
    res.json({
      ok: true,
      data: db.chapters[chapterIndex],
      message: 'Chapter approved successfully'
    });
  } catch (err) {
    console.error('Approve chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /admin/chapters/:id/unapprove - Unapprove a chapter
server.put('/admin/chapters/:id/unapprove', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const chapterId = parseInt(req.params.id);
    const chapterIndex = db.chapters.findIndex(c => c.id === chapterId);
    
    if (chapterIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }
    
    // Set approved to false but keep published=true so it goes back to pending
    db.chapters[chapterIndex].approved = false;
    db.chapters[chapterIndex].approved_at = null;
    db.chapters[chapterIndex].approved_by = null;
    db.chapters[chapterIndex].updated_at = new Date().toISOString();
    
    saveDb(db);
    
    res.json({
      ok: true,
      data: db.chapters[chapterIndex],
      message: 'Chapter unapproved successfully'
    });
  } catch (err) {
    console.error('Unapprove chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /admin/stories/:id/pending-chapters - Get pending chapters for a story
server.get('/admin/stories/:id/pending-chapters', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.id);
    
    // Verify story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }
    
    // Get all pending chapters for this story
    const pendingChapters = db.chapters.filter(c => 
      c.story_id === storyId && 
      c.published === true && 
      c.approved === false
    );
    
    res.json({
      ok: true,
      chapters: pendingChapters,
      count: pendingChapters.length
    });
  } catch (err) {
    console.error('Get pending chapters error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /admin/stories/:id/chapters - Get all chapters for a story (admin view)
server.get('/admin/stories/:id/chapters', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.id);
    
    // Verify story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }
    
    // Get all chapters for this story
    const allChapters = db.chapters.filter(c => c.story_id === storyId);
    
    // Separate into pending and approved
    const pendingChapters = allChapters.filter(c => c.published === true && c.approved === false);
    const approvedChapters = allChapters.filter(c => c.published === true && c.approved === true);
    
    res.json({
      ok: true,
      chapters: allChapters,
      pendingChapters: pendingChapters,
      approvedChapters: approvedChapters,
      totalCount: allChapters.length,
      pendingCount: pendingChapters.length,
      approvedCount: approvedChapters.length
    });
  } catch (err) {
    console.error('Get story chapters error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /admin/reports/chapters - Get reported chapters
server.get('/admin/reports/chapters', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, size = 20 } = req.query;
    
    let reports = db.reports.filter(r => r.type === 'chapter' && r.status === 'pending');
    
    // Add chapter and story info
    reports = reports.map(report => {
      const chapter = db.chapters.find(c => c.id === report.entity_id);
      const story = chapter ? db.stories.find(s => s.id === chapter.story_id) : null;
      const reporter = db.users.find(u => u.id === report.user_id);
      
      return {
        ...report,
        chapter: chapter,
        story: story,
        reporter_name: reporter?.username
      };
    });
    
    // Pagination
    const offset = (page - 1) * size;
    const paginatedReports = reports.slice(offset, offset + parseInt(size));
    
    res.json({
      ok: true,
      reports: paginatedReports,
      total: reports.length,
      page: parseInt(page),
      size: parseInt(size)
    });
  } catch (err) {
    console.error('Get chapter reports error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /admin/reports/comments - Get reported comments
server.get('/admin/reports/comments', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, size = 20 } = req.query;
    
    let reports = db.reports.filter(r => r.type === 'comment' && r.status === 'pending');
    
    // Add comment info
    reports = reports.map(report => {
      const comment = db.comments.find(c => c.id === report.entity_id);
      const commenter = comment ? db.users.find(u => u.id === comment.user_id) : null;
      const reporter = db.users.find(u => u.id === report.user_id);
      
      return {
        ...report,
        comment: comment,
        commenter_name: commenter?.username,
        commenter_id: commenter?.id,
        reporter_name: reporter?.username
      };
    });
    
    // Pagination
    const offset = (page - 1) * size;
    const paginatedReports = reports.slice(offset, offset + parseInt(size));
    
    res.json({
      ok: true,
      reports: paginatedReports,
      total: reports.length,
      page: parseInt(page),
      size: parseInt(size)
    });
  } catch (err) {
    console.error('Get comment reports error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /admin/reports/:id/approve - Approve report (delete content and ban user)
server.post('/admin/reports/:id/approve', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const reportId = parseInt(req.params.id);
    const reportIndex = db.reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Report not found' });
    }
    
    const report = db.reports[reportIndex];
    
    if (report.type === 'comment') {
      // Delete comment
      const commentIndex = db.comments.findIndex(c => c.id === report.entity_id);
      if (commentIndex !== -1) {
        const comment = db.comments[commentIndex];
        db.comments.splice(commentIndex, 1);
        
        // Ban user for 2 days
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + 2);
        
        const bannedUser = {
          id: generateId(db.banned_users),
          user_id: comment.user_id,
          banned_by: req.user.id,
          reason: `Comment reported: ${report.reason}`,
          banned_at: new Date().toISOString(),
          ban_until: banUntil.toISOString(),
          type: 'comment_ban'
        };
        
        db.banned_users.push(bannedUser);
      }
    } else if (report.type === 'chapter') {
      // Delete chapter
      const chapterIndex = db.chapters.findIndex(c => c.id === report.entity_id);
      if (chapterIndex !== -1) {
        db.chapters.splice(chapterIndex, 1);
      }
    } else if (report.type === 'story') {
      // Delete story and all its chapters
      const storyIndex = db.stories.findIndex(s => s.id === report.entity_id);
      if (storyIndex !== -1) {
        db.stories.splice(storyIndex, 1);
        db.chapters = db.chapters.filter(c => c.story_id !== report.entity_id);
      }
    }
    
    // Update report status
    db.reports[reportIndex].status = 'approved';
    db.reports[reportIndex].reviewed_by = req.user.id;
    db.reports[reportIndex].reviewed_at = new Date().toISOString();
    
    saveDb(db);
    
    res.json({
      ok: true,
      message: 'Report approved and action taken'
    });
  } catch (err) {
    console.error('Approve report error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /admin/reports/:id/reject - Reject report
server.post('/admin/reports/:id/reject', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const reportId = parseInt(req.params.id);
    const reportIndex = db.reports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Report not found' });
    }
    
    db.reports[reportIndex].status = 'rejected';
    db.reports[reportIndex].reviewed_by = req.user.id;
    db.reports[reportIndex].reviewed_at = new Date().toISOString();
    
    saveDb(db);
    
    res.json({
      ok: true,
      message: 'Report rejected'
    });
  } catch (err) {
    console.error('Reject report error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /admin/banned-users - Get all banned users
server.get('/admin/banned-users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, size = 20 } = req.query;
    
    // Get active bans
    const now = new Date().toISOString();
    let bannedUsers = db.banned_users.filter(b => b.ban_until > now);
    
    // Add user info
    bannedUsers = bannedUsers.map(ban => {
      const user = db.users.find(u => u.id === ban.user_id);
      const bannedBy = db.users.find(u => u.id === ban.banned_by);
      
      return {
        ...ban,
        user: user,
        banned_by_name: bannedBy?.username
      };
    });
    
    // Pagination
    const offset = (page - 1) * size;
    const paginatedBans = bannedUsers.slice(offset, offset + parseInt(size));
    
    res.json({
      ok: true,
      banned_users: paginatedBans,
      total: bannedUsers.length,
      page: parseInt(page),
      size: parseInt(size)
    });
  } catch (err) {
    console.error('Get banned users error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /admin/banned-users/:id/unban - Unban a user
server.post('/admin/banned-users/:id/unban', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const banId = parseInt(req.params.id);
    const banIndex = db.banned_users.findIndex(b => b.id === banId);
    
    if (banIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Ban not found' });
    }
    
    // Remove the ban
    db.banned_users.splice(banIndex, 1);
    saveDb(db);
    
    res.json({
      ok: true,
      message: 'User unbanned successfully'
    });
  } catch (err) {
    console.error('Unban user error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== REPORT ROUTES ====================

// POST /reports - Create a report
server.post('/reports', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { type, entity_id, reason } = req.body;
    
    if (!type || !entity_id || !reason) {
      return res.status(400).json({ ok: false, message: 'Missing required fields' });
    }
    
    // Check if user is banned from commenting
    if (type === 'comment') {
      const now = new Date().toISOString();
      const activeBan = db.banned_users.find(b => 
        b.user_id === req.user.id && 
        b.ban_until > now &&
        b.type === 'comment_ban'
      );
      
      if (activeBan) {
        return res.status(403).json({
          ok: false,
          message: 'You are banned from reporting',
          banned_until: activeBan.ban_until
        });
      }
    }
    
    const report = {
      id: generateId(db.reports),
      type,
      entity_id: parseInt(entity_id),
      user_id: req.user.id,
      reason,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    db.reports.push(report);
    saveDb(db);
    
    res.status(201).json({
      ok: true,
      data: report,
      message: 'Report submitted successfully'
    });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /users/search - Search for users by username or email
// IMPORTANT: This must come BEFORE /users/:id to avoid route matching issues
server.get('/users/search', (req, res) => {
  try {
    const db = getDb();
    const { q } = req.query;
    
    if (!q) {
      return res.json({ ok: true, data: [], users: [] });
    }
    
    const searchLower = q.toLowerCase();
    
    // Search by username or email
    const users = db.users.filter(user => {
      const usernameMatch = user.username && user.username.toLowerCase().includes(searchLower);
      const emailMatch = user.email && user.email.toLowerCase().includes(searchLower);
      return usernameMatch || emailMatch;
    }).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar_url || user.avatar || null, // Support both avatar_url and avatar
      avatar_url: user.avatar_url || user.avatar || null,
      bio: user.bio || '',
      role: user.role,
      created_at: user.created_at
    }));
    
    res.json({ ok: true, data: users, users: users });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /users/:id - Get user profile
server.get('/users/:id', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id);
    
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }
    
    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({ ok: true, data: userWithoutPassword });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /users/:id - Update user profile
server.put('/users/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userIdParam = req.params.id;
    
    // Support /users/me as an alias for current user
    const userId = userIdParam === 'me' ? req.user.id : parseInt(userIdParam);
    
    // Check if user is updating their own profile or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
    
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }
    
    // Update only allowed fields
    const { username, bio, avatar_url, banner_url } = req.body;
    
    if (username !== undefined) {
      // Check if username is already taken by another user
      const existingUser = db.users.find(u => u.username === username && u.id !== userId);
      if (existingUser) {
        return res.status(400).json({ ok: false, message: 'Username already taken' });
      }
      db.users[userIndex].username = username;
    }
    
    if (bio !== undefined) {
      db.users[userIndex].bio = bio;
    }
    
    if (avatar_url !== undefined) {
      db.users[userIndex].avatar_url = avatar_url;
    }
    
    if (banner_url !== undefined) {
      db.users[userIndex].banner_url = banner_url;
    }
    
    db.users[userIndex].updated_at = new Date().toISOString();
    
    saveDb(db);
    
    // Return user without password
    const { password_hash, ...userWithoutPassword } = db.users[userIndex];
    
    res.json({ ok: true, data: userWithoutPassword, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /users/:id/ban-status - Check if user is banned
server.get('/users/:id/ban-status', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id);
    
    // Only allow users to check their own ban status or admins
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
    
    const now = new Date().toISOString();
    const activeBan = db.banned_users.find(b => 
      b.user_id === userId && 
      b.ban_until > now
    );
    
    if (activeBan) {
      return res.json({
        ok: true,
        banned: true,
        ban: activeBan
      });
    }
    
    res.json({
      ok: true,
      banned: false
    });
  } catch (err) {
    console.error('Check ban status error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== STORIES ROUTES ====================

// GET /stories - Get published/approved stories
server.get('/stories', optionalAuthMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { q, tag, sort = 'created_at', order = 'desc', page = 1, size = 20 } = req.query;
    
    // Only show stories that are BOTH published AND approved
    let stories = db.stories.filter(s => s.published === true && s.approved === true);
    
    // Search filter
    if (q) {
      const searchLower = q.toLowerCase();
      stories = stories.filter(s => 
        s.title?.toLowerCase().includes(searchLower) || 
        s.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Tag filter
    if (tag) {
      const storyIds = db.story_tags
        .filter(st => {
          const tagObj = db.tags.find(t => t.id === st.tag_id && t.name === tag);
          return !!tagObj;
        })
        .map(st => st.story_id);
      
      stories = stories.filter(s => storyIds.includes(s.id));
    }
    
    // Add metadata
    stories = stories.map(story => {
      const author = db.users.find(u => u.id === story.user_id);
      const storyTagIds = db.story_tags.filter(st => st.story_id === story.id).map(st => st.tag_id);
      const tags = db.tags.filter(t => storyTagIds.includes(t.id));
      const chapters = db.chapters.filter(c => c.story_id === story.id);
      
      return {
        ...story,
        cover_url: story.cover_image_url, // Add cover_url alias for frontend
        author_name: author?.username,
        tags: tags,
        chapter_count: chapters.length
      };
    });
    
    // Sort
    stories.sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // Pagination
    const offset = (page - 1) * size;
    const paginatedStories = stories.slice(offset, offset + parseInt(size));
    
    res.json({
      ok: true,
      stories: paginatedStories,
      total: stories.length,
      page: parseInt(page),
      size: parseInt(size)
    });
  } catch (err) {
    console.error('Get stories error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /users/:userId/stories - Get user's stories (with status filter)
server.get('/users/:userId/stories', optionalAuthMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.userId);
    const { status, page = 1, size = 20 } = req.query;
    
    // Get user's stories
    let stories = db.stories.filter(s => s.user_id === userId);
    
    // Apply status filter - map old status values to new published/approved system
    if (status) {
      if (status === 'draft' || status === 'pending') {
        // Draft/Pending: not published OR published but not approved
        stories = stories.filter(s => !s.published || (s.published && !s.approved));
      } else if (status === 'published') {
        // Published: both published AND approved
        stories = stories.filter(s => s.published && s.approved);
      }
    }
    
    // Check if user can view private stories
    const isOwner = req.user && req.user.id === userId;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      // Non-owners can only see published AND approved stories
      stories = stories.filter(s => s.published === true && s.approved === true);
    }
    
    // Add metadata
    stories = stories.map(story => {
      const author = db.users.find(u => u.id === story.user_id);
      const storyTagIds = db.story_tags.filter(st => st.story_id === story.id).map(st => st.tag_id);
      const tags = db.tags.filter(t => storyTagIds.includes(t.id));
      const chapters = db.chapters.filter(c => c.story_id === story.id);
      
      // Calculate read_count and vote_count
      let readCount = 0;
      if (db.story_reads) {
        const uniqueReaders = new Set(
          db.story_reads
            .filter(sr => sr.story_id === story.id)
            .map(sr => sr.user_id)
        );
        readCount = uniqueReaders.size;
      }
      
      let totalVotes = 0;
      if (db.votes && chapters.length > 0) {
        const chapterIds = chapters.map(c => c.id);
        const storyVotes = db.votes.filter(v => chapterIds.includes(v.chapter_id));
        const upvotes = storyVotes.filter(v => v.vote_type === 'up').length;
        const downvotes = storyVotes.filter(v => v.vote_type === 'down').length;
        totalVotes = upvotes - downvotes;
      }
      
      return {
        ...story,
        cover_url: story.cover_image_url, // Add cover_url alias for frontend
        author_name: author?.username,
        tags: tags,
        chapter_count: chapters.length,
        read_count: readCount,
        vote_count: totalVotes
      };
    });
    
    // Sort by created_at descending
    stories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const offset = (page - 1) * size;
    const paginatedStories = stories.slice(offset, offset + parseInt(size));
    
    res.json({
      ok: true,
      stories: paginatedStories,
      data: paginatedStories, // For compatibility
      total: stories.length,
      page: parseInt(page),
      size: parseInt(size)
    });
  } catch (err) {
    console.error('Get user stories error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /stories - Create a story
server.post('/stories', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, description, cover_image_url, cover_url, mature_content, tags } = req.body;
    
    if (!title) {
      return res.status(400).json({ ok: false, message: 'Title is required' });
    }
    
    // Accept both cover_url and cover_image_url for flexibility
    const coverUrl = cover_url || cover_image_url || null;
    
    const story = {
      id: generateId(db.stories),
      user_id: req.user.id,
      title,
      description: description || null,
      cover_image_url: coverUrl,
      mature_content: mature_content || false,
      published: false, // Stories start as unpublished drafts
      approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.stories.push(story);
    
    // Save tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      tags.forEach(tagId => {
        const storyTag = {
          id: generateId(db.story_tags),
          story_id: story.id,
          tag_id: tagId
        };
        db.story_tags.push(storyTag);
      });
    }
    
    saveDb(db);
    
    res.status(201).json({
      ok: true,
      data: {
        ...story,
        cover_url: story.cover_image_url // Add cover_url alias for frontend
      },
      message: 'Story created successfully'
    });
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /stories/:id - Get single story
server.get('/stories/:id', optionalAuthMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.id);
    const story = db.stories.find(s => s.id === storyId);
    
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }
    
    // Check if user can view this story
    const isOwner = req.user && req.user.id === story.user_id;
    const isAdmin = req.user && req.user.role === 'admin';
    
    // Only show stories that are both published AND approved (unless owner/admin)
    if ((!story.published || !story.approved) && !isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, message: 'Story not available' });
    }
    
    // Add metadata
    const author = db.users.find(u => u.id === story.user_id);
    const storyTagIds = db.story_tags.filter(st => st.story_id === story.id).map(st => st.tag_id);
    const tags = db.tags.filter(t => storyTagIds.includes(t.id));
    const chapters = db.chapters.filter(c => c.story_id === story.id);
    
    // Calculate total votes for the story (sum of all chapter votes)
    let totalVotes = 0;
    let totalUpvotes = 0;
    let totalDownvotes = 0;
    
    if (db.votes && chapters.length > 0) {
      const chapterIds = chapters.map(c => c.id);
      const storyVotes = db.votes.filter(v => chapterIds.includes(v.chapter_id));
      totalUpvotes = storyVotes.filter(v => v.vote_type === 'up').length;
      totalDownvotes = storyVotes.filter(v => v.vote_type === 'down').length;
      totalVotes = totalUpvotes - totalDownvotes;
    }
    
    // Calculate read count from story_reads table - count UNIQUE users who read the story
    let readCount = 0;
    if (db.story_reads) {
      const uniqueReaders = new Set(
        db.story_reads
          .filter(sr => sr.story_id === story.id)
          .map(sr => sr.user_id)
      );
      readCount = uniqueReaders.size;
    }
    
    res.json({
      ok: true,
      data: {
        ...story,
        cover_url: story.cover_image_url, // Add cover_url alias for frontend
        author_name: author?.username,
        author_avatar: author?.avatar_url || null, // Add author avatar
        tags: tags,
        chapter_count: chapters.length,
        votes: totalVotes,
        vote_count: totalVotes, // Add vote_count alias for frontend compatibility
        upvotes: totalUpvotes,
        downvotes: totalDownvotes,
        read_count: readCount // Count unique users who read the story
      }
    });
  } catch (err) {
    console.error('Get story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /stories/:id - Update story
server.put('/stories/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.id);
    const storyIndex = db.stories.findIndex(s => s.id === storyId);
    
    if (storyIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }
    
    const story = db.stories[storyIndex];
    
    // Check ownership
    if (story.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized' });
    }
    
    // Update fields
    const { title, description, cover_image_url, cover_url, mature_content, published, tags } = req.body;
    
    if (title !== undefined) story.title = title;
    if (description !== undefined) story.description = description;
    // Accept both cover_url and cover_image_url
    if (cover_url !== undefined) story.cover_image_url = cover_url;
    if (cover_image_url !== undefined) story.cover_image_url = cover_image_url;
    if (mature_content !== undefined) story.mature_content = mature_content;
    
    // New publish/unpublish system:
    // When user publishes (published=true): Story appears in admin dashboard (published=true, approved=false)
    // When admin approves: Story appears on homepage (published=true, approved=true)
    // When user unpublishes (published=false): Remove BOTH published and approved flags
    //   This forces user to get approval again when they re-publish
    if (published !== undefined) {
      if (published === true) {
        // User is publishing the story
        story.published = true;
        // Clear rejection flags when republishing
        story.rejected = false;
        story.rejected_at = null;
        story.rejected_by = null;
        story.rejection_reason = null;
        // If story was previously approved and user unpublished then republished,
        // they need to get approval again (keep approved=false)
        // Only keep approved=true if story is already approved and just being updated
        if (!story.approved) {
          story.approved = false;
        }
        
        // Publish all chapters of this story
        db.chapters.forEach((chapter, index) => {
          if (chapter.story_id === storyId) {
            db.chapters[index].published = true;
            if (!db.chapters[index].approved) {
              db.chapters[index].approved = false;
            }
            db.chapters[index].updated_at = new Date().toISOString();
          }
        });
      } else {
        // User is unpublishing - remove BOTH flags to force re-approval
        story.published = false;
        story.approved = false;
        story.approved_at = null;
        story.approved_by = null;
        
        // Unpublish all chapters too
        db.chapters.forEach((chapter, index) => {
          if (chapter.story_id === storyId) {
            db.chapters[index].published = false;
            db.chapters[index].approved = false;
          }
        });
      }
    }
    
    story.updated_at = new Date().toISOString();
    
    // Update tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      // Remove existing tags
      db.story_tags = db.story_tags.filter(st => st.story_id !== storyId);
      
      // Add new tags
      tags.forEach(tagId => {
        const storyTag = {
          id: generateId(db.story_tags),
          story_id: storyId,
          tag_id: tagId
        };
        db.story_tags.push(storyTag);
      });
    }
    
    db.stories[storyIndex] = story;
    saveDb(db);
    
    res.json({
      ok: true,
      data: {
        ...story,
        cover_url: story.cover_image_url // Add cover_url alias for frontend
      },
      message: 'Story updated successfully'
    });
  } catch (err) {
    console.error('Update story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== CHAPTERS ROUTES ====================

// GET /stories/:storyId/chapters - Get all chapters for a story
server.get('/stories/:storyId/chapters', optionalAuthMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.storyId);

    // Verify story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }

    let chapters = db.chapters ? 
      db.chapters.filter(c => c.story_id === storyId) : [];

    // Check if user is the story owner
    const isOwner = req.user && req.user.id === story.user_id;
    
    // Filter chapters based on user permissions
    if (!isOwner) {
      // Non-owners only see published AND approved chapters
      chapters = chapters.filter(c => 
        c.published === true && c.approved === true
      );
    }

    res.json({ ok: true, data: chapters });
  } catch (err) {
    console.error('Get chapters error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /stories/:storyId/chapters/:chapterId - Get a specific chapter
server.get('/stories/:storyId/chapters/:chapterId', optionalAuthMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.storyId);
    const chapterId = parseInt(req.params.chapterId);

    // Verify story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }

    const chapter = db.chapters ?
      db.chapters.find(c => c.id === chapterId && c.story_id === storyId) : null;

    if (!chapter) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }

    // Check if user is the story owner
    const isOwner = req.user && req.user.id === story.user_id;
    
    // Only allow viewing unpublished/unapproved chapters if user is the owner
    const isPublishedAndApproved = chapter.published === true && chapter.approved === true;
    
    if (!isPublishedAndApproved && !isOwner) {
      return res.status(403).json({ ok: false, message: 'Chapter not available' });
    }

    // Calculate vote count for this chapter
    const chapterVotes = db.votes ? db.votes.filter(v => v.chapter_id === chapterId) : [];
    const upvotes = chapterVotes.filter(v => v.vote_type === 'up').length;
    const downvotes = chapterVotes.filter(v => v.vote_type === 'down').length;
    const netVotes = upvotes - downvotes;
    
    // Calculate comment count for this chapter
    const commentsCount = db.comments ? db.comments.filter(c => c.chapter_id === chapterId).length : 0;

    res.json({ 
      ok: true, 
      chapter: { ...chapter, votes: netVotes, upvotes, downvotes, comments_count: commentsCount }, 
      data: { ...chapter, votes: netVotes, upvotes, downvotes, comments_count: commentsCount }, 
      isOwner 
    });
  } catch (err) {
    console.error('Get chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /chapters/:chapterId - Get a chapter by ID (legacy support)
server.get('/chapters/:chapterId', optionalAuthMiddleware, (req, res) => {
  try {
    const db = getDb();
    const chapterId = parseInt(req.params.chapterId);

    const chapter = db.chapters ?
      db.chapters.find(c => c.id === chapterId) : null;

    if (!chapter) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }

    // Get the story to check ownership
    const story = db.stories.find(s => s.id === chapter.story_id);
    const isOwner = req.user && story && req.user.id === story.user_id;
    
    // Only allow viewing unpublished chapters if user is the owner
    // Handle both 'is_published' and 'published' field names for compatibility
    const isPublished = chapter.is_published === 1 || 
                       chapter.is_published === true || 
                       chapter.published === 1 || 
                       chapter.published === true;
    
    if (!isPublished && !isOwner) {
      return res.status(403).json({ ok: false, message: 'Chapter not published' });
    }

    // Calculate vote count for this chapter
    const chapterVotes = db.votes ? db.votes.filter(v => v.chapter_id === chapterId) : [];
    const upvotes = chapterVotes.filter(v => v.vote_type === 'up').length;
    const downvotes = chapterVotes.filter(v => v.vote_type === 'down').length;
    const netVotes = upvotes - downvotes;
    
    // Calculate comment count for this chapter
    const commentsCount = db.comments ? db.comments.filter(c => c.chapter_id === chapterId).length : 0;

    res.json({ 
      ok: true, 
      chapter: { ...chapter, votes: netVotes, upvotes, downvotes, comments_count: commentsCount }, 
      data: { ...chapter, votes: netVotes, upvotes, downvotes, comments_count: commentsCount }, 
      isOwner 
    });
  } catch (err) {
    console.error('Get chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /stories/:storyId/chapters - Create a new chapter
server.post('/stories/:storyId/chapters', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.storyId);
    const userId = req.user.id;
    const { title, content } = req.body;

    // Verify story exists and user owns it
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }

    if (story.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized to add chapters to this story' });
    }

    if (!title) {
      return res.status(400).json({ ok: false, message: 'Chapter title is required' });
    }

    // Initialize chapters array if it doesn't exist
    if (!db.chapters) {
      db.chapters = [];
    }

    // Get chapter number (next in sequence)
    const existingChapters = db.chapters.filter(c => c.story_id === storyId);
    const chapterNumber = existingChapters.length + 1;

    const chapter = {
      id: generateId(db.chapters),
      story_id: storyId,
      title: title || 'Untitled',
      content: content || '',
      chapter_number: chapterNumber,
      published: false,  // New chapters start as drafts
      approved: false,   // Need admin approval before going live
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.chapters.push(chapter);
    saveDb(db);

    res.status(201).json({
      ok: true,
      data: chapter,
      message: 'Chapter created successfully'
    });
  } catch (err) {
    console.error('Create chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// PUT /stories/:storyId/chapters/:chapterId - Update a chapter
server.put('/stories/:storyId/chapters/:chapterId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.storyId);
    const chapterId = parseInt(req.params.chapterId);
    const userId = req.user.id;

    // Verify story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }

    // Check ownership
    if (story.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized to update this chapter' });
    }

    if (!db.chapters) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }

    const chapterIndex = db.chapters.findIndex(c => c.id === chapterId && c.story_id === storyId);
    if (chapterIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }

    const chapter = db.chapters[chapterIndex];

    // Update fields
    const { title, content, publish, unpublish } = req.body;
    
    if (title !== undefined) chapter.title = title;
    if (content !== undefined) chapter.content = content;
    
    // Handle publish action
    if (publish === true) {
      chapter.published = true;
      // Keep existing approved status - if it was previously approved and is just being edited,
      // it needs re-approval. If it's newly published, it starts as not approved.
      // To prevent exploit: if unpublished before, approved should be false
      if (chapter.approved !== true) {
        chapter.approved = false;
      }
      
      // Also publish the story if it's not already published
      const storyIndex = db.stories.findIndex(s => s.id === storyId);
      if (storyIndex !== -1 && !db.stories[storyIndex].published) {
        db.stories[storyIndex].published = true;
        db.stories[storyIndex].approved = false; // Story needs approval too
        db.stories[storyIndex].updated_at = new Date().toISOString();
      }
    }
    
    // Handle unpublish action - removes both published and approved to force re-approval
    if (unpublish === true) {
      chapter.published = false;
      chapter.approved = false;
    }
    
    chapter.updated_at = new Date().toISOString();
    
    db.chapters[chapterIndex] = chapter;
    saveDb(db);
    
    res.json({
      ok: true,
      data: chapter,
      message: 'Chapter updated successfully'
    });
  } catch (err) {
    console.error('Update chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// DELETE /stories/:storyId/chapters/:chapterId - Delete a chapter
server.delete('/stories/:storyId/chapters/:chapterId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.storyId);
    const chapterId = parseInt(req.params.chapterId);
    const userId = req.user.id;

    // Verify story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }

    // Check ownership
    if (story.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized to delete this chapter' });
    }

    if (!db.chapters) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }

    const chapterIndex = db.chapters.findIndex(c => c.id === chapterId && c.story_id === storyId);
    if (chapterIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }

    db.chapters.splice(chapterIndex, 1);
    saveDb(db);

    res.json({ ok: true, message: 'Chapter deleted successfully' });
  } catch (err) {
    console.error('Delete chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== READING HISTORY ROUTES ====================

// GET /reading/me/reading-history - Get user's reading history
server.get('/reading/me/reading-history', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Get user's reading history
    const readingHistory = db.reading_history ? 
      db.reading_history.filter(rh => rh.user_id === userId) : [];

    // Sort by most recent first
    const sortedHistory = readingHistory.sort((a, b) => 
      new Date(b.last_read_at) - new Date(a.last_read_at)
    );

    // Enrich with story and chapter details
    const enrichedHistory = sortedHistory.map(rh => {
      const story = db.stories.find(s => s.id === rh.story_id);
      const chapter = db.chapters.find(c => c.id === rh.chapter_id);
      
      return {
        id: rh.id,
        user_id: rh.user_id,
        story_id: rh.story_id,
        chapter_id: rh.chapter_id,
        last_chapter_id: rh.chapter_id, // For navigation
        last_read_at: rh.last_read_at,
        updated_at: rh.last_read_at,
        // Flatten story data
        story_title: story?.title || 'Unknown Story',
        story_cover_url: story?.cover_image_url || null,
        story_description: story?.description || '',
        story_author: story?.user_id || null,
        // Flatten chapter data
        chapter_title: chapter?.title || 'Unknown Chapter',
        chapter_number: chapter?.chapter_number || 0
      };
    }).filter(rh => rh.story_title !== 'Unknown Story'); // Filter out items where story not found

    res.json({ ok: true, data: enrichedHistory });
  } catch (err) {
    console.error('Get reading history error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /reading/story/:storyId - Get reading progress for a story
server.get('/reading/story/:storyId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const storyId = parseInt(req.params.storyId);

    const progress = db.reading_history ?
      db.reading_history.find(rh => rh.user_id === userId && rh.story_id === storyId) : null;

    res.json({ ok: true, data: progress || null });
  } catch (err) {
    console.error('Get reading progress error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /reading - Save/update reading progress
server.post('/reading', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { story_id, chapter_id } = req.body;
    
    if (!story_id || !chapter_id) {
      return res.status(400).json({ ok: false, message: 'story_id and chapter_id are required' });
    }
    
    if (!db.reading_history) {
      db.reading_history = [];
    }
    
    // Initialize story_reads array if it doesn't exist
    if (!db.story_reads) {
      db.story_reads = [];
    }
    
    // Find existing progress
    const existingIndex = db.reading_history.findIndex(
      rh => rh.user_id === userId && rh.story_id === story_id
    );
    
    const now = new Date().toISOString();
    
    if (existingIndex === -1) {
      // Create new progress entry
      const newProgress = {
        id: generateId(db.reading_history),
        user_id: userId,
        story_id,
        chapter_id,
        last_read_at: now
      };
      db.reading_history.push(newProgress);
    } else {
      // Update existing progress
      db.reading_history[existingIndex].chapter_id = chapter_id;
      db.reading_history[existingIndex].last_read_at = now;
    }
    
    // Record in story_reads for analytics - only once per user per story
    // Check if user has already read this story (any chapter)
    const hasReadStory = db.story_reads.some(
      sr => sr.user_id === userId && sr.story_id === story_id
    );
    
    // Only add to story_reads if this is the user's first read of the story
    if (!hasReadStory) {
      const readRecord = {
        id: generateId(db.story_reads),
        user_id: userId,
        story_id: story_id,
        chapter_id: chapter_id,
        created_at: now
      };
      db.story_reads.push(readRecord);
    }
    
    saveDb(db);
    
    res.json({ ok: true, message: 'Reading progress saved' });
  } catch (err) {
    console.error('Save reading progress error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== READING LISTS ROUTES ====================

// POST /reading-lists - Create a reading list for current user
server.post('/reading-lists', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { name, description, is_public } = req.body;
    
    if (!name) {
      return res.status(400).json({ ok: false, message: 'Name is required' });
    }
    
    if (!db.reading_lists) {
      db.reading_lists = [];
    }
    
    const newList = {
      id: generateId(db.reading_lists),
      user_id: userId,
      name,
      description: description || null,
      is_public: is_public !== undefined ? is_public : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.reading_lists.push(newList);
    saveDb(db);
    
    res.status(201).json({ ok: true, data: newList });
  } catch (err) {
    console.error('Create reading list error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /users/:userId/reading-lists - Get user's reading lists
server.get('/users/:userId/reading-lists', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.userId);
    
    if (!db.reading_lists) {
      db.reading_lists = [];
    }
    
    // Get reading lists for this user
    const lists = db.reading_lists.filter(rl => rl.user_id === userId);
    
    // Add story count to each list
    const enrichedLists = lists.map(list => {
      const storyCount = db.reading_list_stories ?
        db.reading_list_stories.filter(rls => rls.reading_list_id === list.id).length : 0;
      
      return {
        ...list,
        story_count: storyCount
      };
    });
    
    res.json({ ok: true, data: enrichedLists });
  } catch (err) {
    console.error('Get reading lists error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /users/:userId/reading-lists - Create a reading list
server.post('/users/:userId/reading-lists', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.userId);
    const { name, description, is_public } = req.body;
    
    // Check authorization
    if (req.user.id !== userId) {
      return res.status(403).json({ ok: false, message: 'Not authorized' });
    }
    
    if (!name) {
      return res.status(400).json({ ok: false, message: 'Name is required' });
    }
    
    if (!db.reading_lists) {
      db.reading_lists = [];
    }
    
    const newList = {
      id: generateId(db.reading_lists),
      user_id: userId,
      name,
      description: description || null,
      is_public: is_public !== undefined ? is_public : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.reading_lists.push(newList);
    saveDb(db);
    
    res.status(201).json({ ok: true, data: newList });
  } catch (err) {
    console.error('Create reading list error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== COMMENTS ROUTES ====================

// GET /comments/story/:storyId - Get comments for a story (from all its chapters)
server.get('/comments/story/:storyId', (req, res) => {
  try {
    const db = getDb();
    const storyId = parseInt(req.params.storyId);
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // First, get all chapters for this story
    const storyChapters = db.chapters ? 
      db.chapters.filter(c => c.story_id === storyId) : [];
    
    const chapterIds = storyChapters.map(c => c.id);

    // Then get all comments for those chapters
    let allComments = db.comments ?
      db.comments.filter(c => chapterIds.includes(c.chapter_id)) : [];
    
    // Sort by created_at (newest first)
    allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const totalComments = allComments.length;
    const totalPages = Math.ceil(totalComments / limit);
    
    // Apply pagination
    const paginatedComments = allComments.slice(offset, offset + limit);

    // Enrich with user details and chapter info
    const enrichedComments = paginatedComments.map(comment => {
      const user = db.users.find(u => u.id === comment.user_id);
      const chapter = storyChapters.find(ch => ch.id === comment.chapter_id);
      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        chapter_id: comment.chapter_id,
        user_id: comment.user_id,
        username: user?.username || 'Unknown',
        avatar_url: user?.avatar_url || null,
        chapter_title: chapter?.title || null,
        chapter_order: chapter?.chapter_number || null
      };
    });

    res.json({ 
      ok: true, 
      data: enrichedComments,
      pagination: {
        page,
        limit,
        total: totalComments,
        totalPages
      }
    });
  } catch (err) {
    console.error('Get story comments error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /comments/chapter/:chapterId - Get comments for a chapter
server.get('/comments/chapter/:chapterId', (req, res) => {
  try {
    const db = getDb();
    const chapterId = parseInt(req.params.chapterId);
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    let allComments = db.comments ?
      db.comments.filter(c => c.chapter_id === chapterId) : [];
      
    // Sort by created_at (newest first)
    allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const totalComments = allComments.length;
    const totalPages = Math.ceil(totalComments / limit);
    
    // Apply pagination
    const paginatedComments = allComments.slice(offset, offset + limit);

    // Enrich with user details
    const enrichedComments = paginatedComments.map(comment => {
      const user = db.users.find(u => u.id === comment.user_id);
      return {
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        } : null
      };
    });

    res.json({ 
      ok: true, 
      data: enrichedComments,
      pagination: {
        page,
        limit,
        total: totalComments,
        totalPages
      }
    });
  } catch (err) {
    console.error('Get chapter comments error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /comments/chapter/:chapterId - Create a comment
server.post('/comments/chapter/:chapterId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const chapterId = parseInt(req.params.chapterId);
    const { content, parent_comment_id } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ ok: false, message: 'Comment content is required' });
    }

    // Verify chapter exists
    const chapter = db.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({ ok: false, message: 'Chapter not found' });
    }

    // Initialize comments array if it doesn't exist
    if (!db.comments) {
      db.comments = [];
    }

    const comment = {
      id: generateId(db.comments),
      user_id: userId,
      story_id: chapter.story_id,
      chapter_id: chapterId,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.comments.push(comment);
    saveDb(db);

    // Return comment with user details
    const user = db.users.find(u => u.id === userId);
    const enrichedComment = {
      ...comment,
      user: user ? {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url
      } : null
    };

    res.status(201).json({ ok: true, data: enrichedComment });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// DELETE /comments/:id - Delete a comment
server.delete('/comments/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!db.comments) {
      return res.status(404).json({ ok: false, message: 'Comment not found' });
    }

    const commentIndex = db.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Comment not found' });
    }

    const comment = db.comments[commentIndex];

    // Check if user owns the comment or is admin
    if (comment.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Not authorized to delete this comment' });
    }

    db.comments.splice(commentIndex, 1);
    saveDb(db);

    res.json({ ok: true, message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== FOLLOWS ROUTES ====================

// GET /follows/check - Check if current user follows another user
server.get('/follows/check', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const followerId = req.user.id;
    const followingId = parseInt(req.query.userId);

    if (!followingId) {
      return res.status(400).json({ ok: false, message: 'userId query parameter is required' });
    }

    if (!db.follows) {
      db.follows = [];
    }

    const isFollowing = db.follows.some(f => 
      f.follower_id === followerId && f.following_id === followingId
    );

    res.json({ ok: true, data: { isFollowing } });
  } catch (err) {
    console.error('Check follow error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /followed-stories/:storyId/check - Check if current user follows a story
server.get('/followed-stories/:storyId/check', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const storyId = parseInt(req.params.storyId);

    // Check if story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Story not found',
        isFollowing: false
      });
    }

    if (!db.story_follows) {
      db.story_follows = [];
    }

    const isFollowing = db.story_follows.some(sf => 
      sf.user_id === userId && sf.story_id === storyId
    );

    res.json({ ok: true, isFollowing });
  } catch (err) {
    console.error('Check story follow error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /follows - Follow a user
server.post('/follows', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const followerId = req.user.id;
    const { userId: followingId } = req.body;

    if (!followingId) {
      return res.status(400).json({ ok: false, message: 'userId is required' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ ok: false, message: 'Cannot follow yourself' });
    }

    // Check if user exists
    const userExists = db.users.find(u => u.id === followingId);
    if (!userExists) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    if (!db.follows) {
      db.follows = [];
    }

    // Check if already following
    const existingFollow = db.follows.find(f => 
      f.follower_id === followerId && f.following_id === followingId
    );

    if (existingFollow) {
      return res.status(409).json({ ok: false, message: 'Already following this user' });
    }

    const follow = {
      id: generateId(db.follows),
      follower_id: followerId,
      following_id: followingId,
      created_at: new Date().toISOString()
    };

    db.follows.push(follow);
    saveDb(db);

    res.status(201).json({ ok: true, data: follow });
  } catch (err) {
    console.error('Follow user error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /follows/:userId/followers - Get user's followers
server.get('/follows/:userId/followers', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.userId);
    
    if (!db.follows) {
      return res.json({ ok: true, data: [], followers: [] });
    }
    
    // Get all users who follow this user
    const followerIds = db.follows
      .filter(f => f.following_id === userId)
      .map(f => f.follower_id);
    
    const followers = db.users.filter(u => followerIds.includes(u.id)).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null
    }));
    
    res.json({ ok: true, data: followers, followers: followers });
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /follows/:userId/following - Get users this user follows
server.get('/follows/:userId/following', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.userId);
    
    if (!db.follows) {
      return res.json({ ok: true, data: [], following: [] });
    }
    
    // Get all users this user follows
    const followingIds = db.follows
      .filter(f => f.follower_id === userId)
      .map(f => f.following_id);
    
    const following = db.users.filter(u => followingIds.includes(u.id)).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null
    }));
    
    res.json({ ok: true, data: following, following: following });
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// Alias: GET /users/:userId/followers
server.get('/users/:userId/followers', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.userId);
    
    if (!db.follows) {
      return res.json({ ok: true, data: [], followers: [] });
    }
    
    // Get all followers of this user
    const followerIds = db.follows
      .filter(f => f.following_id === userId)
      .map(f => f.follower_id);
    
    const followers = db.users.filter(u => followerIds.includes(u.id)).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null
    }));
    
    res.json({ ok: true, data: followers, followers: followers });
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// Alias: GET /users/:userId/following
server.get('/users/:userId/following', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.userId);
    
    if (!db.follows) {
      return res.json({ ok: true, data: [], following: [] });
    }
    
    // Get all users this user follows
    const followingIds = db.follows
      .filter(f => f.follower_id === userId)
      .map(f => f.following_id);
    
    const following = db.users.filter(u => followingIds.includes(u.id)).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null
    }));
    
    res.json({ ok: true, data: following, following: following });
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// DELETE /follows/:userId - Unfollow a user
server.delete('/follows/:userId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    if (!db.follows) {
      return res.status(404).json({ ok: false, message: 'Not following this user' });
    }

    const followIndex = db.follows.findIndex(f => 
      f.follower_id === followerId && f.following_id === followingId
    );

    if (followIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Not following this user' });
    }

    db.follows.splice(followIndex, 1);
    saveDb(db);

    res.json({ ok: true, message: 'Unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow user error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// GET /followed-stories - Get stories followed by current user
server.get('/followed-stories', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    
    if (!db.story_follows) {
      return res.json({ ok: true, data: [], stories: [] });
    }
    
    // Get all stories this user follows with timestamps
    const userFollows = db.story_follows.filter(sf => sf.user_id === userId);
    
    let stories = userFollows.map(follow => {
      const story = db.stories.find(s => s.id === follow.story_id);
      if (!story) return null;
      
      const author = db.users.find(u => u.id === story.user_id);
      const storyTagIds = db.story_tags.filter(st => st.story_id === story.id).map(st => st.tag_id);
      const tags = db.tags.filter(t => storyTagIds.includes(t.id));
      const chapters = db.chapters.filter(c => c.story_id === story.id);
      
      // Calculate real-time vote count from all chapters
      const chapterIds = chapters.map(c => c.id);
      const voteCount = db.votes ? db.votes.filter(v => chapterIds.includes(v.chapter_id)).length : 0;
      
      // Calculate real-time read count from reading_history (unique users who read this story)
      const readCount = db.reading_history ? 
        new Set(db.reading_history.filter(rh => rh.story_id === story.id).map(rh => rh.user_id)).size : 0;
      
      return {
        ...story,
        cover_url: story.cover_image_url,
        author_name: author?.username,
        tags: tags,
        chapter_count: chapters.length,
        vote_count: voteCount,
        read_count: readCount, // Real-time count of unique readers
        following_since: follow.created_at, // Add the timestamp when user followed this story
        followed_at: follow.created_at // Alternative field name
      };
    }).filter(Boolean); // Remove null entries for deleted stories
    
    res.json({ ok: true, data: stories, stories: stories });
  } catch (err) {
    console.error('Get followed stories error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /followed-stories/:storyId - Follow a story
server.post('/followed-stories/:storyId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const storyId = parseInt(req.params.storyId);

    if (!storyId) {
      return res.status(400).json({ ok: false, message: 'storyId is required' });
    }

    // Check if story exists
    const storyExists = db.stories.find(s => s.id === storyId);
    if (!storyExists) {
      return res.status(404).json({ ok: false, message: 'Story not found' });
    }

    if (!db.story_follows) {
      db.story_follows = [];
    }

    // Check if already following
    const existingFollow = db.story_follows.find(sf => 
      sf.user_id === userId && sf.story_id === storyId
    );

    if (existingFollow) {
      return res.json({ ok: true, message: 'Already following this story' });
    }

    const storyFollow = {
      id: generateId(db.story_follows),
      user_id: userId,
      story_id: storyId,
      created_at: new Date().toISOString()
    };

    db.story_follows.push(storyFollow);
    saveDb(db);

    res.status(201).json({ ok: true, message: 'Story followed' });
  } catch (err) {
    console.error('Follow story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// DELETE /followed-stories/:storyId - Unfollow a story
server.delete('/followed-stories/:storyId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const storyId = parseInt(req.params.storyId);

    // Check if story exists
    const story = db.stories.find(s => s.id === storyId);
    if (!story) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Story not found' 
      });
    }

    if (!db.story_follows) {
      return res.json({ ok: true, message: 'Not following this story' });
    }

    const followIndex = db.story_follows.findIndex(sf => 
      sf.user_id === userId && sf.story_id === storyId
    );

    if (followIndex === -1) {
      return res.json({ ok: true, message: 'Not following this story' });
    }

    db.story_follows.splice(followIndex, 1);
    saveDb(db);

    res.json({ ok: true, message: 'Story unfollowed' });
  } catch (err) {
    console.error('Unfollow story error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== VOTES ROUTES ====================

// GET /votes/chapter/:chapterId - Get votes for a chapter
server.get('/votes/chapter/:chapterId', optionalAuthMiddleware, (req, res) => {
  try {
    const db = getDb();
    const chapterId = parseInt(req.params.chapterId);
    
    if (!db.votes) {
      return res.json({ ok: true, data: { upvotes: 0, downvotes: 0, userVote: null } });
    }
    
    const votes = db.votes.filter(v => v.chapter_id === chapterId);
    const upvotes = votes.filter(v => v.vote_type === 'up').length;
    const downvotes = votes.filter(v => v.vote_type === 'down').length;
    
    let userVote = null;
    if (req.user) {
      const userVoteRecord = votes.find(v => v.user_id === req.user.id);
      userVote = userVoteRecord ? userVoteRecord.vote_type : null;
    }
    
    res.json({ ok: true, data: { upvotes, downvotes, userVote } });
  } catch (err) {
    console.error('Get chapter votes error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// POST /votes/chapter/:chapterId - Vote on a chapter
server.post('/votes/chapter/:chapterId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const chapterId = parseInt(req.params.chapterId);
    const { vote_type } = req.body; // 'up' or 'down'
    
    if (!vote_type || !['up', 'down'].includes(vote_type)) {
      return res.status(400).json({ ok: false, message: 'vote_type must be "up" or "down"' });
    }
    
    if (!db.votes) {
      db.votes = [];
    }
    
    // Check if user already voted
    const existingVoteIndex = db.votes.findIndex(
      v => v.user_id === userId && v.chapter_id === chapterId
    );
    
    if (existingVoteIndex !== -1) {
      // Update existing vote
      db.votes[existingVoteIndex].vote_type = vote_type;
      db.votes[existingVoteIndex].updated_at = new Date().toISOString();
    } else {
      // Create new vote
      const newVote = {
        id: generateId(db.votes),
        user_id: userId,
        chapter_id: chapterId,
        vote_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.votes.push(newVote);
    }
    
    saveDb(db);
    
    res.json({ ok: true, message: 'Vote recorded' });
  } catch (err) {
    console.error('Vote chapter error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// DELETE /votes/chapter/:chapterId - Remove vote from chapter
server.delete('/votes/chapter/:chapterId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const chapterId = parseInt(req.params.chapterId);
    
    if (!db.votes) {
      return res.status(404).json({ ok: false, message: 'Vote not found' });
    }
    
    const voteIndex = db.votes.findIndex(
      v => v.user_id === userId && v.chapter_id === chapterId
    );
    
    if (voteIndex === -1) {
      return res.status(404).json({ ok: false, message: 'Vote not found' });
    }
    
    db.votes.splice(voteIndex, 1);
    saveDb(db);
    
    res.json({ ok: true, message: 'Vote removed' });
  } catch (err) {
    console.error('Remove vote error:', err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

// ==================== UPLOAD ROUTES ====================

// Upload image to Cloudinary
server.post('/upload/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No file uploaded' });
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        ok: false, 
        message: 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' 
      });
    }

    // Upload to Cloudinary using upload_stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'whatpad',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ 
            ok: false, 
            message: 'Failed to upload to Cloudinary',
            error: error.message 
          });
        }

        res.json({
          ok: true,
          data: {
            image_url: result.secure_url,
            url: result.secure_url,
            public_id: result.public_id
          }
        });
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const streamifier = require('streamifier');
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ ok: false, message: 'Upload failed', error: error.message });
  }
});

// Use default router for other routes
server.use(router);

// Start server
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = server;
