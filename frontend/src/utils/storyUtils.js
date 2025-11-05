/**
 * Utility functions for working with user stories
 */

/**
 * Filter stories by status
 * @param {Array} stories - Array of story objects
 * @param {string} status - 'published' or 'draft'
 * @returns {Array} Filtered stories
 */
export const filterStoriesByStatus = (stories, status) => {
    if (!status || status === 'all') return stories;
    return stories.filter(story => story.status === status);
};

/**
 * Sort stories by date
 * @param {Array} stories - Array of story objects
 * @param {string} order - 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted stories
 */
export const sortStoriesByDate = (stories, order = 'desc') => {
    return [...stories].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
};

/**
 * Sort stories by update date
 * @param {Array} stories - Array of story objects
 * @param {string} order - 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted stories
 */
export const sortStoriesByUpdateDate = (stories, order = 'desc') => {
    return [...stories].sort((a, b) => {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
};

/**
 * Sort stories by chapter count
 * @param {Array} stories - Array of story objects
 * @param {string} order - 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted stories
 */
export const sortStoriesByChapterCount = (stories, order = 'desc') => {
    return [...stories].sort((a, b) => {
        const countA = a.chapter_count || 0;
        const countB = b.chapter_count || 0;
        return order === 'asc' ? countA - countB : countB - countA;
    });
};

/**
 * Sort stories alphabetically by title
 * @param {Array} stories - Array of story objects
 * @param {string} order - 'asc' or 'desc' (default: 'asc')
 * @returns {Array} Sorted stories
 */
export const sortStoriesByTitle = (stories, order = 'asc') => {
    return [...stories].sort((a, b) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return order === 'asc' 
            ? titleA.localeCompare(titleB) 
            : titleB.localeCompare(titleA);
    });
};

/**
 * Group stories by status
 * @param {Array} stories - Array of story objects
 * @returns {Object} Object with keys 'published' and 'draft'
 */
export const groupStoriesByStatus = (stories) => {
    return stories.reduce((acc, story) => {
        const status = story.status || 'draft';
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(story);
        return acc;
    }, { published: [], draft: [] });
};

/**
 * Get story statistics
 * @param {Array} stories - Array of story objects
 * @returns {Object} Statistics object
 */
export const getStoryStatistics = (stories) => {
    const grouped = groupStoriesByStatus(stories);
    const totalChapters = stories.reduce((sum, story) => sum + (story.chapter_count || 0), 0);
    
    return {
        total: stories.length,
        published: grouped.published.length,
        draft: grouped.draft.length,
        totalChapters,
        averageChapters: stories.length > 0 ? (totalChapters / stories.length).toFixed(1) : 0
    };
};

/**
 * Format story date for display
 * @param {string} dateString - ISO date string
 * @param {string} format - 'short', 'long', or 'relative' (default: 'short')
 * @returns {string} Formatted date
 */
export const formatStoryDate = (dateString, format = 'short') => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (format === 'relative') {
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 30) {
            return date.toLocaleDateString();
        } else if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    } else if (format === 'long') {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } else {
        return date.toLocaleDateString();
    }
};

/**
 * Search stories by keyword
 * @param {Array} stories - Array of story objects
 * @param {string} keyword - Search keyword
 * @returns {Array} Filtered stories
 */
export const searchStories = (stories, keyword) => {
    if (!keyword || keyword.trim() === '') return stories;
    
    const lowerKeyword = keyword.toLowerCase();
    return stories.filter(story => {
        const title = (story.title || '').toLowerCase();
        const description = (story.description || '').toLowerCase();
        const author = (story.author_name || '').toLowerCase();
        
        return title.includes(lowerKeyword) || 
               description.includes(lowerKeyword) || 
               author.includes(lowerKeyword);
    });
};

/**
 * Filter stories by tags
 * @param {Array} stories - Array of story objects
 * @param {Array} tagNames - Array of tag names to filter by
 * @returns {Array} Filtered stories
 */
export const filterStoriesByTags = (stories, tagNames) => {
    if (!tagNames || tagNames.length === 0) return stories;
    
    return stories.filter(story => {
        if (!story.tags || story.tags.length === 0) return false;
        const storyTagNames = story.tags.map(tag => tag.name.toLowerCase());
        return tagNames.some(tagName => 
            storyTagNames.includes(tagName.toLowerCase())
        );
    });
};

/**
 * Paginate stories array
 * @param {Array} stories - Array of story objects
 * @param {number} page - Current page (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Object} Paginated result with stories and metadata
 */
export const paginateStories = (stories, page = 1, pageSize = 10) => {
    const total = stories.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
        stories: stories.slice(start, end),
        page,
        size: pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};

/**
 * Get story status badge color
 * @param {string} status - Story status
 * @returns {string} CSS color class or color code
 */
export const getStatusColor = (status) => {
    const colors = {
        published: '#28a745',  // green
        draft: '#6c757d',      // gray
        archived: '#dc3545'    // red
    };
    return colors[status] || colors.draft;
};

/**
 * Calculate reading time estimate
 * @param {number} chapterCount - Number of chapters
 * @param {number} avgMinutesPerChapter - Average minutes per chapter (default: 15)
 * @returns {string} Reading time estimate
 */
export const calculateReadingTime = (chapterCount, avgMinutesPerChapter = 15) => {
    const totalMinutes = chapterCount * avgMinutesPerChapter;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
        return `${minutes} min`;
    } else if (minutes === 0) {
        return `${hours} hr`;
    } else {
        return `${hours} hr ${minutes} min`;
    }
};

/**
 * Validate story data
 * @param {Object} story - Story object
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
export const validateStoryData = (story) => {
    const errors = [];
    
    if (!story.title || story.title.trim() === '') {
        errors.push('Title is required');
    }
    
    if (story.title && story.title.length > 200) {
        errors.push('Title must be less than 200 characters');
    }
    
    if (story.description && story.description.length > 2000) {
        errors.push('Description must be less than 2000 characters');
    }
    
    if (!story.status || !['published', 'draft'].includes(story.status)) {
        errors.push('Invalid status');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

const storyUtils = {
    filterStoriesByStatus,
    sortStoriesByDate,
    sortStoriesByUpdateDate,
    sortStoriesByChapterCount,
    sortStoriesByTitle,
    groupStoriesByStatus,
    getStoryStatistics,
    formatStoryDate,
    searchStories,
    filterStoriesByTags,
    paginateStories,
    getStatusColor,
    calculateReadingTime,
    validateStoryData
};

export default storyUtils;
