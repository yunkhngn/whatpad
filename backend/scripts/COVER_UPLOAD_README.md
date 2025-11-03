# Story Cover Upload Guide

## Quick Start

### Upload a Cover Image for a Story

1. **Save your image** to `backend/uploads/` folder
2. **Run the upload script**:
   ```bash
   node scripts/upload-cover.js <story_id> <image_path>
   ```

### Examples

**Upload from local file:**
```bash
node scripts/upload-cover.js 1 ./uploads/my-cover.jpg
```

**Upload from URL:**
```bash
node scripts/upload-cover.js 1 https://example.com/cover.jpg
```

### List All Stories

To see all stories and their IDs:
```bash
node scripts/update-story-cover.js list
```

## Current Stories

| ID | Story Title | Current Cover |
|----|-------------|---------------|
| 1  | Ánh Trăng Và Em | ❌ Not set |
| 2  | Hành Tinh Song Song | ❌ Not set |
| 3  | Kẻ Lang Thang Trong Mê Cung | ❌ Not set |

## What the Script Does

1. ✅ Uploads image to Cloudinary
2. ✅ Optimizes image (max 800x1200px)
3. ✅ Converts to optimal format (WebP when supported)
4. ✅ Updates database with Cloudinary URL
5. ✅ Verifies the update

## Cloudinary Configuration

The script uses environment variables from `.env`:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Images are uploaded to: `whatpad/story-covers/` folder in Cloudinary.

## Troubleshooting

### "Image file not found"
- Make sure the file path is correct
- Use relative path from backend folder: `./uploads/image.jpg`
- Or use absolute path

### "No story found with ID"
- Run `node scripts/update-story-cover.js list` to see available stories
- Check that you're using the correct story ID

### "Upload error"
- Check your Cloudinary credentials in `.env`
- Make sure image file is valid (JPG, PNG, etc.)
- Check file size (should be < 5MB)

## Notes

- Supported formats: JPG, PNG, GIF, WebP
- Maximum file size: 5MB
- Images are automatically optimized for web
- Old covers are overwritten if you upload again
