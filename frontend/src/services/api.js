// API Configuration
const API_BASE_URL = 'http://localhost:4000';

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
};

// Auth API
export const authAPI = {
    register: async (userData) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    login: async (credentials) => {
        const res = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        // Token backend trả về nằm ở res.data.access
        const token = res.token;
        if (token) {
            localStorage.setItem('authToken', token);
            console.log('✅ Token saved to localStorage:', token);
        } else {
            console.warn('⚠️ No token found in response:', res);
        }

        return res;
    },


    me: async () => {
        const token = localStorage.getItem('authToken');
        return apiRequest('/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    },
};

// Stories API
export const storiesAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiRequest(`/stories${queryString ? `?${queryString}` : ''}`);
        return {
            stories: response.data || [],
            page: response.page,
            size: response.size
        };
    },

    getById: async (id) => {
        const response = await apiRequest(`/stories/${id}`);
        return { story: response.data };
    },

    create: async (storyData) => {
        return apiRequest('/stories', {
            method: 'POST',
            body: JSON.stringify(storyData),
        });
    },

    update: async (id, storyData) => {
        return apiRequest(`/stories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(storyData),
        });
    },

    delete: async (id) => {
        return apiRequest(`/stories/${id}`, {
            method: 'DELETE',
        });
    },

    publish: async (id) => {
        return apiRequest(`/stories/${id}/publish`, {
            method: 'PUT',
        });
    },
};

// Chapters API
export const chaptersAPI = {
    getByStoryId: async (storyId) => {
        const response = await apiRequest(`/chapters/story/${storyId}`);
        return { chapters: response.data || [] };
    },

    getById: async (id) => {
        const response = await apiRequest(`/chapters/${id}`);
        return { chapter: response.data };
    },

    create: async (chapterData) => {
        return apiRequest('/chapters', {
            method: 'POST',
            body: JSON.stringify(chapterData),
        });
    },

    update: async (id, chapterData) => {
        return apiRequest(`/chapters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(chapterData),
        });
    },

    delete: async (id) => {
        return apiRequest(`/chapters/${id}`, {
            method: 'DELETE',
        });
    },
};

// Tags API
export const tagsAPI = {
    getAll: async () => {
        const response = await apiRequest('/tags');
        return { tags: response.data || [] };
    },
};

// Users API
export const usersAPI = {
    getProfile: async (id) => {
        return apiRequest(`/users/${id}`);
    },

    updateMe: async (userData) => {
        return apiRequest('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },
};

// Comments API
export const commentsAPI = {
    getByChapterId: async (chapterId) => {
        return apiRequest(`/comments/chapter/${chapterId}`);
    },

    create: async (commentData) => {
        return apiRequest('/comments', {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    },

    delete: async (id) => {
        return apiRequest(`/comments/${id}`, {
            method: 'DELETE',
        });
    },
};

// Votes API
export const votesAPI = {
    vote: async (chapterId) => {
        return apiRequest('/votes', {
            method: 'POST',
            body: JSON.stringify({ chapter_id: chapterId }),
        });
    },

    unvote: async (chapterId) => {
        return apiRequest(`/votes/chapter/${chapterId}`, {
            method: 'DELETE',
        });
    },
};

// Favorites API
export const favoritesAPI = {
    getLists: async () => {
        return apiRequest('/favorites');
    },

    createList: async (listData) => {
        return apiRequest('/favorites', {
            method: 'POST',
            body: JSON.stringify(listData),
        });
    },

    addToList: async (listId, storyId) => {
        return apiRequest(`/favorites/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify({ story_id: storyId }),
        });
    },

    removeFromList: async (listId, storyId) => {
        return apiRequest(`/favorites/${listId}/items/${storyId}`, {
            method: 'DELETE',
        });
    },
};

// Follows API
export const followsAPI = {
    follow: async (userId) => {
        return apiRequest('/follows', {
            method: 'POST',
            body: JSON.stringify({ following_id: userId }),
        });
    },

    unfollow: async (userId) => {
        return apiRequest(`/follows/${userId}`, {
            method: 'DELETE',
        });
    },

    getFollowers: async (userId) => {
        return apiRequest(`/follows/${userId}/followers`);
    },

    getFollowing: async (userId) => {
        return apiRequest(`/follows/${userId}/following`);
    },
};

// Reading API
export const readingAPI = {
    updateProgress: async (chapterId, progress) => {
        return apiRequest('/reading', {
            method: 'POST',
            body: JSON.stringify({
                chapter_id: chapterId,
                progress_percentage: progress
            }),
        });
    },

    getProgress: async (storyId) => {
        return apiRequest(`/reading/story/${storyId}`);
    },
};

// Upload API
export const uploadAPI = {
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload Error: ${response.status}`);
        }

        return response.json();
    },
};

// Export all APIs as named exports for easy importing
const apiExports = {
    authAPI,
    storiesAPI,
    chaptersAPI,
    tagsAPI,
    usersAPI,
    commentsAPI,
    votesAPI,
    favoritesAPI,
    followsAPI,
    readingAPI,
    uploadAPI,
};

// Export default for backward compatibility
export default apiExports;

// Backward compatibility functions
export function getStories() {
    return storiesAPI.getAll();
}

export function getStoryById(id) {
    return storiesAPI.getById(id);
}

export function searchStories(query) {
    return storiesAPI.getAll({ q: query });
}

export function getStoriesByGenre(genre) {
    return storiesAPI.getAll({ tag: genre });
}
