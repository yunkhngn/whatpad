const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Missing required fields', errorCode: 'MISSING_FIELDS' });
    }

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, message: 'User already exists', errorCode: 'USER_EXISTS' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, password_hash]
    );

    const [users] = await pool.query('SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?', [result.insertId]);
    const user = users[0];

    res.status(201).json({ 
      ok: true, 
      data: user,
      message: 'User registered successfully' 
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Missing email or password', errorCode: 'MISSING_CREDENTIALS' });
    }

    // Get user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' });
    }

    // Generate JWT (2 hours expiry)
    const access = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '2h' }
    );

    delete user.password_hash;

    res.json({
      ok: true,
      data: {
        user,
        access
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me (protected)
router.get('/me', auth, async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found', errorCode: 'USER_NOT_FOUND' });
    }

    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
