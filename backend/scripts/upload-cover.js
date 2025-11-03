require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const pool = require('../src/db');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImageToCloudinary(imagePath, publicId) {
  try {
    console.log('📤 Uploading image to Cloudinary...');
    console.log('   File:', imagePath);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'whatpad/story-covers',
      public_id: publicId,
      overwrite: true,
      transformation: [
        { width: 800, height: 1200, crop: 'fill', gravity: 'center' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    console.log('✅ Upload successful!');
    console.log('   Cloudinary URL:', result.secure_url);
    console.log('   Public ID:', result.public_id);
    console.log('   Format:', result.format);
    console.log('   Size:', `${result.width}x${result.height}`);
    
    return result.secure_url;
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    throw error;
  }
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file
      reject(err);
    });
  });
}

async function updateStoryCover(storyId, coverUrl) {
  try {
    console.log(`\n📚 Updating story ID ${storyId} in database...`);
    
    const [result] = await pool.query(
      'UPDATE stories SET cover_url = ?, updated_at = NOW() WHERE id = ?',
      [coverUrl, storyId]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Database updated successfully!');
      
      // Verify the update
      const [stories] = await pool.query(
        'SELECT id, title, cover_url FROM stories WHERE id = ?',
        [storyId]
      );
      
      if (stories.length > 0) {
        console.log('\n📖 Story Details:');
        console.log('   ID:', stories[0].id);
        console.log('   Title:', stories[0].title);
        console.log('   Cover URL:', stories[0].cover_url);
      }
    } else {
      console.log('⚠️  No story found with ID:', storyId);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Database error:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('=== Whatpad Story Cover Uploader ===\n');
    console.log('Usage:');
    console.log('  node scripts/upload-cover.js <story_id> <image_path_or_url>\n');
    console.log('Example:');
    console.log('  node scripts/upload-cover.js 1 ./uploads/cover.jpg');
    console.log('  node scripts/upload-cover.js 1 https://example.com/image.jpg\n');
    console.log('For "Ánh Trăng Và Em" story, use ID: 1');
    process.exit(0);
  }
  
  const storyId = parseInt(args[0]);
  const imageSource = args[1];
  
  console.log('=== Whatpad Story Cover Uploader ===\n');
  console.log('Story ID:', storyId);
  console.log('Image source:', imageSource);
  console.log('');
  
  let imagePath = imageSource;
  let isTempFile = false;
  
  // If it's a URL, download it first
  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    console.log('📥 Downloading image from URL...');
    const tempPath = path.join(__dirname, '../uploads/temp-cover.jpg');
    await downloadImage(imageSource, tempPath);
    imagePath = tempPath;
    isTempFile = true;
    console.log('✅ Download complete!\n');
  }
  
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Error: Image file not found at ${imagePath}`);
    process.exit(1);
  }
  
  try {
    // Generate a slug for the public ID
    const publicId = `story-${storyId}-cover`;
    
    // Upload to Cloudinary
    const coverUrl = await uploadImageToCloudinary(imagePath, publicId);
    
    // Update database
    await updateStoryCover(storyId, coverUrl);
    
    // Clean up temp file if downloaded
    if (isTempFile) {
      fs.unlinkSync(imagePath);
    }
    
    console.log('\n🎉 All done!');
    console.log('\nYou can now view the story with the new cover in your app!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

main();
