/**
 * Utility functions for handling Cloudinary images
 */

/**
 * Transform a Cloudinary URL to a specific size
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @param {string} crop - Crop mode (fill, fit, scale, etc.)
 * @returns {string} Transformed URL
 */
export const getCloudinaryImageUrl = (url, width, height, crop = 'fill') => {
  if (!url) return null;
  
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  
  // Check if it already has transformations
  if (url.includes('/upload/')) {
    // Insert transformation parameters after /upload/
    const transformation = `c_${crop},w_${width},h_${height},q_auto,f_auto`;
    return url.replace('/upload/', `/upload/${transformation}/`);
  }
  
  return url;
};

/**
 * Get story cover image URL with proper dimensions
 * @param {string} coverUrl - Original cover URL
 * @returns {string} Transformed URL for story card (218x210)
 */
export const getStoryCoverUrl = (coverUrl) => {
  return getCloudinaryImageUrl(coverUrl, 218, 210, 'fill');
};

/**
 * Get large story cover image URL
 * @param {string} coverUrl - Original cover URL
 * @returns {string} Transformed URL for story detail page (400x600)
 */
export const getStoryDetailCoverUrl = (coverUrl) => {
  return getCloudinaryImageUrl(coverUrl, 400, 600, 'fill');
};

/**
 * Get thumbnail image URL
 * @param {string} coverUrl - Original cover URL
 * @returns {string} Transformed URL for thumbnail (100x150)
 */
export const getThumbnailUrl = (coverUrl) => {
  return getCloudinaryImageUrl(coverUrl, 100, 150, 'fill');
};

/**
 * Get genre card image URL
 * @param {string} coverUrl - Original cover URL
 * @returns {string} Transformed URL for genre card (218x218)
 */
export const getGenreCoverUrl = (coverUrl) => {
  return getCloudinaryImageUrl(coverUrl, 218, 218, 'fill');
};
