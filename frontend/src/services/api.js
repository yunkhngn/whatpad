// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    // Try to get the error message from the response body
    let errorMessage = `${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (jsonError) {
      // If parsing JSON fails, keep the status text
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
};

// ================== Auth API ==================
export const registerUser = async (userData) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (credentials) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const getCurrentUser = async () => {
  return apiRequest("/auth/me");
};

// ================== Stories API ==================
export const getStories = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiRequest(
    `/stories${queryString ? `?${queryString}` : ""}`
  );
  return {
    stories: response.stories || response.data || [],
    page: response.page,
    size: response.size,
  };
};

export const getStoriesByUserId = async (userId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiRequest(
    `/users/${userId}/stories${queryString ? `?${queryString}` : ""}`
  );
  return {
    stories: response.data || [],
    page: response.page,
    size: response.size,
  };
};

export const getPublishedStoriesByUserId = async (userId, params = {}) => {
  const queryString = new URLSearchParams({ ...params, status: 'published' }).toString();
  const response = await apiRequest(
    `/users/${userId}/stories${queryString ? `?${queryString}` : ""}`
  );
  return {
    stories: response.stories || [],
    total: response.total || response.stories?.length || 0,
    page: response.page,
    size: response.size,
  };
};

export const getDraftStoriesByUserId = async (userId, params = {}) => {
  const queryString = new URLSearchParams({ ...params, status: 'draft' }).toString();
  const response = await apiRequest(
    `/users/${userId}/stories${queryString ? `?${queryString}` : ""}`
  );
  return {
    stories: response.stories || [],
    total: response.total || response.stories?.length || 0,
    page: response.page,
    size: response.size,
  };
};

export const getStoryById = async (id) => {
  const response = await apiRequest(`/stories/${id}`);
  return { story: response.data };
};

export const createStory = async (storyData) => {
  return apiRequest("/stories", {
    method: "POST",
    body: JSON.stringify(storyData),
  });
};

export const updateStory = async (id, storyData) => {
  return apiRequest(`/stories/${id}`, {
    method: "PUT",
    body: JSON.stringify(storyData),
  });
};

export const deleteStory = async (id) => {
  return apiRequest(`/stories/${id}`, {
    method: "DELETE",
  });
};

export const publishStory = async (id) => {
  return apiRequest(`/stories/${id}/publish`, {
    method: "PUT",
  });
};

// ================== Chapters API ==================
export const getStoryChapters = async (storyId) => {
  const response = await apiRequest(`/stories/${storyId}/chapters`);
  return { chapters: response.data || [] };
};

// Get chapter by ID (legacy - for reading page)
export const getChapterById = async (chapterId) => {
  const response = await apiRequest(`/chapters/${chapterId}`);
  return { chapter: response.chapter };
};

export const getChapterOfStory = async (storyId, chapterId) => {
  const response = await apiRequest(
    `/stories/${storyId}/chapters/${chapterId}`
  );
  return { chapter: response.chapter };
};

// Get chapter by story and chapter ID (with validation)
export const getChapterByStoryAndId = async (storyId, chapterId) => {
  const response = await apiRequest(
    `/stories/${storyId}/chapters/${chapterId}`
  );
  return { chapter: response.chapter };
};

export const createChapter = async (storyId, chapterData) => {
  return apiRequest(`/stories/${storyId}/chapters`, {
    method: "POST",
    body: JSON.stringify(chapterData),
  });
};

export const updateChapter = async (storyId, chapterId, chapterData) => {
  return apiRequest(`/stories/${storyId}/chapters/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify(chapterData),
  });
};

export const deleteChapter = async (storyId, chapterId) => {
  return apiRequest(`/stories/${storyId}/chapters/${chapterId}`, {
    method: "DELETE",
  });
};

// Toggle chapter publish status (publish/unpublish)
export const toggleChapterPublish = async (storyId, chapterId, isPublished) => {
  return apiRequest(`/stories/${storyId}/chapters/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify({ is_published: isPublished ? 1 : 0 }),
  });
};

// Toggle story publish status (publish/unpublish) and all its chapters
export const toggleStoryPublish = async (storyId, isPublished) => {
  return apiRequest(`/stories/${storyId}`, {
    method: "PUT",
    body: JSON.stringify({ status: isPublished ? 'published' : 'draft' }),
  });
};

// ================== Tags API ==================
export const getTags = async () => {
  const response = await apiRequest("/tags");
  return { tags: response.data || [] };
};

// ================== Users API ==================
export const searchUsers = async (query) => {
  const response = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
  return { users: response.data || [] };
};

export const getUserProfile = async (id) => {
  return apiRequest(`/users/${id}`);
};

export const updateCurrentUser = async (userData) => {
  return apiRequest("/users/me", {
    method: "PUT",
    body: JSON.stringify(userData),
  });
};

// ================== Comments API ==================
export const getCommentsByStoryId = async (storyId) => {
  return apiRequest(`/comments/story/${storyId}`);
};

export const getCommentsByChapterId = async (chapterId) => {
  return apiRequest(`/comments/chapter/${chapterId}`);
};

export const createComment = async (commentData) => {
  const { chapter_id, content, parent_comment_id } = commentData;
  return apiRequest(`/comments/chapter/${chapter_id}`, {
    method: "POST",
    body: JSON.stringify({ content, parent_comment_id }),
  });
};

export const deleteComment = async (id) => {
  return apiRequest(`/comments/${id}`, {
    method: "DELETE",
  });
};

// Votes API
export const checkVote = async (chapterId) => {
  return apiRequest(`/votes/chapter/${chapterId}`);
};

export const voteChapter = async (chapterId) => {
  return apiRequest(`/votes/chapter/${chapterId}`, {
    method: "POST",
  });
};

export const unvoteChapter = async (chapterId) => {
  return apiRequest(`/votes/chapter/${chapterId}`, {
    method: "DELETE",
  });
};

// ================== Favorites API ==================
export const getFavoriteLists = async () => {
  return apiRequest("/favorites");
};

export const createFavoriteList = async (listData) => {
  return apiRequest("/favorites", {
    method: "POST",
    body: JSON.stringify(listData),
  });
};

export const addStoryToFavorite = async (listId, storyId) => {
  return apiRequest(`/favorites/${listId}/items`, {
    method: "POST",
    body: JSON.stringify({ story_id: storyId }),
  });
};

export const removeStoryFromFavorite = async (listId, storyId) => {
  return apiRequest(`/favorites/${listId}/items/${storyId}`, {
    method: "DELETE",
  });
};

// ================== Follows API ==================
export const followUser = async (userId) => {
  return apiRequest("/follows", {
    method: "POST",
    body: JSON.stringify({ following_id: userId }),
  });
};

export const unfollowUser = async (userId) => {
  return apiRequest(`/follows/${userId}`, {
    method: "DELETE",
  });
};

export const getUserFollowers = async (userId) => {
  return apiRequest(`/follows/${userId}/followers`);
};

export const getUserFollowing = async (userId) => {
  return apiRequest(`/follows/${userId}/following`);
};

// ================== Story Follow API ==================
export const followStory = async (storyId) => {
  return apiRequest(`/followed-stories/${storyId}`, {
    method: "POST",
  });
};

export const unfollowStory = async (storyId) => {
  return apiRequest(`/followed-stories/${storyId}`, {
    method: "DELETE",
  });
};

export const checkIfFollowingStory = async (storyId) => {
  return apiRequest(`/followed-stories/${storyId}/check`);
};

export const getFollowedStories = async () => {
  return apiRequest("/followed-stories");
};

// ================== Reading API ==================
export const updateReadingProgress = async (storyId, chapterId) => {
  return apiRequest("/reading", {
    method: "POST",
    body: JSON.stringify({
      story_id: storyId,
      last_chapter_id: chapterId,
    }),
  });
};

export const getReadingHistory = async () => {
  // Check if user is logged in first - prevent unnecessary API calls
  const token = getAuthToken();
  if (!token || token.trim().length === 0) {
    // Return empty data structure instead of making API call
    return { ok: true, data: [] };
  }
  
  return apiRequest('/reading/me/reading-history');
};

export const getReadingProgress = async (storyId) => {
  return apiRequest(`/reading/story/${storyId}`);
};

// ================== Upload API ==================
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Upload Error: ${response.status}`);
  }

  return response.json();
};

// Helper functions for backward compatibility and convenience
export const searchStories = (query) => {
  return getStories({ q: query });
};

export const getStoriesByGenre = (genre) => {
  return getStories({ tag: genre });
};
