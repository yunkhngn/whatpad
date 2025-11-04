const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../../mw/auth');

const router = express.Router();

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

// POST /upload/image - Upload image to Cloudinary
router.post('/image', auth, (req, res, next) => {
  console.log('=== UPLOAD IMAGE REQUEST ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request file:', req.file);
  next();
}, upload.single('image'), async (req, res, next) => {
  try {
    console.log('=== AFTER MULTER ===');
    console.log('File received:', req.file ? 'YES' : 'NO');
    console.log('File details:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No file uploaded', errorCode: 'NO_FILE' });
    }

    // Upload to Cloudinary using buffer
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'wattpad' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({ 
      ok: true, 
      data: { 
        url: result.secure_url,
        public_id: result.public_id
      } 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
