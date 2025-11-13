/**
 * Handle avatar image load errors by falling back to UI Avatars
 * @param {Event} e - The error event from the img element
 * @param {string} name - The user's name for generating initials
 */
export const handleAvatarError = (e, name = 'User') => {
  // Prevent infinite loop if UI Avatars also fails
  if (e.target.src.includes('ui-avatars.com')) {
    e.target.src = '/default-avatar.png';
    return;
  }
  
  // Generate avatar with initials using UI Avatars
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=f26500&color=fff&size=150`;
};

/**
 * Get avatar URL with fallback
 * @param {string} avatarUrl - The original avatar URL
 * @param {string} name - The user's name
 * @returns {string} - The avatar URL or fallback
 */
export const getAvatarUrl = (avatarUrl, name = 'User') => {
  if (!avatarUrl || avatarUrl === 'null' || avatarUrl === null) {
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=f26500&color=fff&size=150`;
  }
  
  return avatarUrl;
};
