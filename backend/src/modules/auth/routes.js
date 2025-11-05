const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');
const auth = require('../../mw/auth');

const router = express.Router();

// Input validation helpers
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 30) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 100;
};

// Sanitize input
const sanitizeInput = (input) => {
  if (!input) return '';
  return input.trim();
};

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Missing required fields', errorCode: 'MISSING_FIELDS' });
    }

    // Sanitize inputs
    const cleanUsername = sanitizeInput(username);
    const cleanEmail = sanitizeInput(email);

    // Validate inputs
    if (!validateUsername(cleanUsername)) {
      return res.status(400).json({
        ok: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
        errorCode: 'INVALID_USERNAME'
      });
    }

    if (!validateEmail(cleanEmail)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid email format',
        errorCode: 'INVALID_EMAIL'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        ok: false,
        message: 'Password must be 6-100 characters',
        errorCode: 'INVALID_PASSWORD'
      });
    }

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [cleanEmail, cleanUsername]
    );

    if (existing.length > 0) {
      return res.status(409).json({ ok: false, message: 'User already exists', errorCode: 'USER_EXISTS' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [cleanUsername, cleanEmail, password_hash]
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Missing username or password', errorCode: 'MISSING_CREDENTIALS' });
    }

    // Sanitize input
    const cleanUsername = sanitizeInput(username);

    // Validate inputs
    if (!validateUsername(cleanUsername) && !validateEmail(cleanUsername)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Invalid username format. Username must be 3-30 characters and contain only letters, numbers, and underscores', 
        errorCode: 'INVALID_USERNAME_FORMAT' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Password must be at least 6 characters', 
        errorCode: 'INVALID_PASSWORD_FORMAT' 
      });
    }

    // Get user by username or email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanUsername]
    );
    const user = users[0];

    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Username or email not found. Please check your username or sign up for a new account', 
        errorCode: 'USER_NOT_FOUND' 
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ 
        ok: false, 
        message: 'Incorrect password. Please try again', 
        errorCode: 'INCORRECT_PASSWORD' 
      });
    }

    // Generate JWT (2 hours expiry)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '2h' }
    );

    delete user.password_hash;

    res.json({
      user,
      token
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
