/**
 * APIs needed (NOTE):
 *  GET /users/:id/stories - Get user's stories (not yet available)
 *  GET /auth/me - Get current user from token (currently using localStorage)
 *  POST /upload/image - Upload avatar image (not yet integrated)
 *  GET /reading/me/continue-reading - Get user's reading stories
 *  POST /stories/add-to-reading - Add story to reading list
 *  DELETE /follows/:authorId - Unfollow user
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_BASE_URL = 'http://localhost:4000';

const getAuthToken = () => localStorage.getItem('authToken');

// Decode JWT token to get current user ID
const getCurrentUserId = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    // Simple JWT decode (base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || payload.userId || payload.sub;
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
};

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

export default function ProfilePage() {
  const { userId } = useParams(); // URL param for viewing other profiles
  const [activeTab, setActiveTab] = useState('intro');
  const [currentPage, setCurrentPage] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const [profile, setProfile] = useState({
    id: null,
    name: '',
    username: '',
    email: '',
    avatar: '',
    bio: '',
    created_at: null
  });

  const [stats, setStats] = useState({
    works: 0,
    followers: 0,
    following: 0
  });

  const [followingStories, setFollowingStories] = useState([]);
  const [userWorks, setUserWorks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null); // Alert message for fetch errors

  const [editData, setEditData] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    bannerUrl: ''
  });

  // Reading Lists
  const [readingLists, setReadingLists] = useState([]);
  const [readingListThumbnails, setReadingListThumbnails] = useState({}); // { listId: [thumbnails] }
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListPrivacy, setNewListPrivacy] = useState('public');
  
  // View reading list contents
  const [viewingList, setViewingList] = useState(null);
  const [listStories, setListStories] = useState([]);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const STORIES_PER_PAGE = 5;

  // Avatar component with loading state to prevent flickering
  const AvatarImage = ({ src, alt, className, style, onError }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const defaultAvatar = 'https://via.placeholder.com/150/6c757d/ffffff?text=User';

    return (
      <div className="position-relative" style={{ width: 'fit-content' }}>
        {imageLoading && (
          <div 
            className={`${className} d-flex align-items-center justify-content-center bg-light border`}
            style={style}
          >
            <div className="spinner-border spinner-border-sm text-secondary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        <img
          src={imageError ? defaultAvatar : (src || defaultAvatar)}
          alt={alt}
          className={`${className} ${imageLoading ? 'd-none' : ''}`}
          style={style}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
            if (onError) onError();
          }}
        />
      </div>
    );
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        // Get current user ID from token or use URL param
        const currentUserId = getCurrentUserId();
        const profileUserId = userId || currentUserId || localStorage.getItem('userId') || '1';
        
        // Check if viewing own profile
        setIsOwnProfile(!userId || userId === String(currentUserId));

        try {
          const profileRes = await apiRequest(`/users/${profileUserId}`);
          if (profileRes.ok) {
            const userData = profileRes.data;
            setProfile({
              id: userData.id,
              name: userData.username,
              username: `@${userData.username}`,
              email: userData.email,
              avatar: userData.avatar_url || `${API_BASE_URL}/uploads/avatars/default-avatar.png`,
              bio: userData.bio || '',
              created_at: userData.created_at
            });

            setEditData({
              username: userData.username,
              bio: userData.bio || '',
              avatar_url: userData.avatar_url || ''
            });
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setFetchError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
        }

        // Fetch user works/stories
        try {
          const worksRes = await apiRequest(`/users/${profileUserId}/stories`);
          if (worksRes.ok) {
            setUserWorks(worksRes.data || []);
            setStats(prev => ({ ...prev, works: worksRes.data?.length || 0 }));
          }
        } catch (err) {
          console.log('Error fetching user works:', err);
          setUserWorks([]);
          setStats(prev => ({ ...prev, works: 0 }));
        }

        try {
          const followersRes = await apiRequest(`/users/${profileUserId}/followers`);
          if (followersRes.ok) {
            setStats(prev => ({ ...prev, followers: followersRes.data.length }));
            
            // Check if current user is following this profile
            const currentUserId = getCurrentUserId();
            if (currentUserId && !isOwnProfile) {
              const isFollowingUser = followersRes.data.some(
                follower => follower.id === currentUserId
              );
              setIsFollowing(isFollowingUser);
            }
          }
        } catch (err) {
          console.log('Error fetching followers:', err);
        }

        // Fetch followed stories
        try {
          const followingStoriesRes = await apiRequest(`/followed-stories`);
          console.log('Followed stories response:', followingStoriesRes);
          if (followingStoriesRes.ok) {
            setFollowingStories(followingStoriesRes.data || []);
            setStats(prev => ({ ...prev, following: followingStoriesRes.data?.length || 0 }));
          }
        } catch (err) {
          console.log('Error fetching following stories:', err);
          setFollowingStories([]);
          setStats(prev => ({ ...prev, following: 0 }));
        }

        // Fetch reading lists for the user
        try {
          const readingListsRes = await apiRequest(`/users/${profileUserId}/reading-lists`);
          console.log('Reading lists response:', readingListsRes);
          // apiRequest returns the parsed JSON directly (array of lists)
          const lists = Array.isArray(readingListsRes) ? readingListsRes : [];
          setReadingLists(lists);
          
          // Fetch thumbnails for each list
          const thumbnailsMap = {};
          for (const list of lists) {
            try {
              const thumbnails = await apiRequest(`/reading-lists/${list.id}/thumbnails`);
              thumbnailsMap[list.id] = Array.isArray(thumbnails) ? thumbnails : [];
            } catch (err) {
              console.log(`Error fetching thumbnails for list ${list.id}:`, err);
              thumbnailsMap[list.id] = [];
            }
          }
          setReadingListThumbnails(thumbnailsMap);
        } catch (err) {
          console.log('Error fetching reading lists:', err);
          setReadingLists([]);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setFetchError('An error occurred while loading data. Some information may not be displayed.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, isOwnProfile]);

  // Follow/Unfollow functions
  const handleFollowUser = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await apiRequest(`/follows/${profile.id}`, { method });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        setStats(prev => ({ 
          ...prev, 
          followers: prev.followers + (isFollowing ? -1 : 1) 
        }));
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      setFetchError('Không thể thực hiện hành động này');
    }
    setFollowLoading(false);
  };

  const handleUnfollowStory = async (storyId) => {
    try {
      const response = await apiRequest(`/followed-stories/${storyId}`, { method: 'DELETE' });
      if (response.ok) {
        // Remove story from following list
        setFollowingStories(prev => prev.filter(story => story.id !== storyId));
        setStats(prev => ({ ...prev, following: prev.following - 1 }));
      }
    } catch (err) {
      console.error('Error unfollowing story:', err);
      setFetchError('Unable to unfollow this story');
    }
  };

  const handleOpenEdit = () => {
    setEditData({
      username: profile.name.replace('@', ''),
      bio: profile.bio,
      avatar_url: profile.avatar
    });
    setCurrentPage('edit');
  };

  const handleSaveProfile = async () => {
    try {
      const response = await apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          username: editData.username,
          bio: editData.bio,
          avatar_url: editData.avatar_url
        })
      });

      if (response.ok) {
        setProfile({
          ...profile,
          name: editData.username,
          username: `@${editData.username}`,
          bio: editData.bio,
          avatar: editData.avatar_url || `${API_BASE_URL}/uploads/avatars/default-avatar.png`
        });
        setCurrentPage('profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Unable to update profile');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
          ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setEditData({
          ...editData,
          avatar_url: result.url || result.data?.url
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Unable to upload avatar image');
    }
  };

  // Reading List Handlers
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reading-lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
        },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
          privacy: newListPrivacy
        })
      });

      if (response.ok) {
        const newList = await response.json();
        setReadingLists([...readingLists, newList]);
        setShowCreateListModal(false);
        setNewListName('');
        setNewListDescription('');
        setNewListPrivacy('public');
      } else {
        alert('Failed to create reading list');
      }
    } catch (err) {
      console.error('Error creating reading list:', err);
      alert('Unable to create reading list');
    }
  };

  const fetchListStories = async (listId) => {
    try {
      console.log('Fetching stories for list:', listId);
      const stories = await apiRequest(`/reading-lists/${listId}/stories`);
      console.log('List stories response:', stories);
      // apiRequest returns the parsed JSON directly (array of stories)
      setListStories(Array.isArray(stories) ? stories : []);
      setListCurrentPage(1); // Reset to first page
      console.log('Set listStories to:', Array.isArray(stories) ? stories : []);
    } catch (err) {
      console.error('Error fetching list stories:', err);
      setListStories([]);
    }
  };

  const handleRemoveFromList = async (listId, storyId) => {
    try {
      await apiRequest(`/reading-lists/${listId}/stories/${storyId}`, {
        method: 'DELETE'
      });
      // Refresh the list stories
      await fetchListStories(listId);
      // Update thumbnails
      const thumbnails = await apiRequest(`/reading-lists/${listId}/thumbnails`);
      setReadingListThumbnails(prev => ({
        ...prev,
        [listId]: Array.isArray(thumbnails) ? thumbnails : []
      }));
    } catch (err) {
      console.error('Error removing story from list:', err);
      alert('Failed to remove story from list');
    }
  };

  const handleCancelEdit = () => {
    setCurrentPage('profile');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (currentPage === 'edit') {
    return (
      <div className="min-vh-100 bg-light">
        {/* Error Alert */}
        {fetchError && (
          <div className="container pt-3">
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {fetchError}
              <button type="button" className="btn-close" onClick={() => setFetchError(null)}></button>
            </div>
          </div>
        )}
        
        {/* Edit Profile Page */}
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow">
                <div className="card-header bg-white border-bottom py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Edit Profile</h4>
                    <button 
                      className="btn btn-link text-muted text-decoration-none"
                      onClick={handleCancelEdit}
                    >
                      <i className="bi bi-x-lg me-2"></i>
                      Cancel
                    </button>
                  </div>
                </div>
                
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <div className="position-relative d-inline-block mb-3">
                      <AvatarImage 
                        src={editData.avatar_url || profile.avatar} 
                        alt={profile.name}
                        className="rounded-circle object-fit-cover border border-3 border-warning"
                        style={{width: '128px', height: '128px'}}
                      />
                      <label 
                        htmlFor="avatar-upload"
                        className="btn btn-primary btn-sm rounded-pill position-absolute bottom-0 end-0"
                        style={{cursor: 'pointer'}}
                      >
                        <i className="bi bi-camera-fill"></i>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{display: 'none'}}
                      />
                    </div>

                    <h5>{profile.name}</h5>
                    <p className="text-muted small">{profile.username}</p>
                    <div className="d-flex justify-content-center gap-4 small text-muted">
                      <span>{stats.works} Works</span>
                      <span>{stats.following} Following Stories</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter username"
                      value={editData.username}
                      onChange={(e) => setEditData({...editData, username: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">About</label>
                    <textarea
                      className="form-control"
                      rows="6"
                      placeholder="Write about yourself..."
                      maxLength="2000"
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    />
                    <div className="text-end small text-muted mt-1">{editData.bio.length}/2000</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Avatar URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Enter avatar image URL"
                      value={editData.avatar_url}
                      onChange={(e) => setEditData({...editData, avatar_url: e.target.value})}
                    />
                    <small className="text-muted">
                      {/* NOTE: Need to integrate upload image API from /upload/image */}
                      Or use image upload feature
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Banner Background URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Enter banner background image URL"
                      value={editData.bannerUrl}
                      onChange={(e) => setEditData({...editData, bannerUrl: e.target.value})}
                    />
                    <small className="text-muted">
                      This will be the brown background banner on your profile
                    </small>
                  </div>

                  <div className="d-flex justify-content-end gap-3">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-warning text-white rounded-pill px-4"
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Error Alert */}
      {fetchError && (
        <div className="container pt-3">
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {fetchError}
            <button type="button" className="btn-close" onClick={() => setFetchError(null)}></button>
          </div>
        </div>
      )}

      {/* Header Banner with Background Image */}
      <div 
        className="position-relative" 
        style={{
          height: '280px',
          backgroundImage: editData.bannerUrl ? `url(${editData.bannerUrl})` : 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Avatar positioned at bottom of banner */}
        <div className="position-absolute w-100 d-flex justify-content-center" style={{bottom: '-60px'}}>
          <AvatarImage 
            src={profile.avatar} 
            alt={profile.name}
            className="rounded-circle border border-4 border-white shadow object-fit-cover bg-white"
            style={{width: '120px', height: '120px'}}
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="container" style={{marginTop: '80px'}}>
        <div className="text-center mb-3">
          <h1 className="h3 fw-bold mb-1">{profile.name}</h1>
          <p className="text-muted mb-3">{profile.username}</p>
          
          {/* Stats inline with separators */}
          <div className="d-flex justify-content-center align-items-center gap-2 mb-3 text-muted">
            <span>{stats.works} <span className="fw-normal">Works</span></span>
            <span>|</span>
            <span>{readingLists.length} <span className="fw-normal">Reading Lists</span></span>
            <span>|</span>
            <span>{stats.followers} <span className="fw-normal">Followers</span></span>
          </div>
        </div>

        {/* Horizontal Tabs like Wattpad */}
        <div className="bg-white border-bottom">
          <div className="container">
            <ul className="nav nav-tabs border-0" style={{marginBottom: '-1px'}}>
              <li className="nav-item">
                <button 
                  className={`nav-link border-0 px-4 py-3 ${activeTab === 'intro' ? 'active border-bottom border-3 text-dark fw-semibold' : 'text-muted'}`}
                onClick={() => setActiveTab('intro')}
                style={{background: 'transparent', borderBottomColor: activeTab === 'intro' ? '#FF6B00 !important' : 'transparent'}}
              >
                About
              </button>
            </li>

            <li className="nav-item">
              <button 
                className={`nav-link border-0 px-4 py-3 ${activeTab === 'library' ? 'active border-bottom border-3 text-dark fw-semibold' : 'text-muted'}`}
                onClick={() => setActiveTab('library')}
                style={{background: 'transparent', borderBottomColor: activeTab === 'library' ? '#FF6B00 !important' : 'transparent'}}
              >
                Library
              </button>
            </li>

            <li className="nav-item">
              <button 
                className={`nav-link border-0 px-4 py-3 ${activeTab === 'following' ? 'active border-bottom border-3 text-dark fw-semibold' : 'text-muted'}`}
                onClick={() => setActiveTab('following')}
                style={{background: 'transparent', borderBottomColor: activeTab === 'following' ? '#FF6B00 !important' : 'transparent'}}
              >
                Following
              </button>
            </li>
          </ul>
          </div>
        </div>

        {/* Tab Content with Sidebar Layout */}
        <div className="container py-4">
          <div className="row g-4">
            {/* Left Sidebar */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                  {/* Follow/Edit Button */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    {isOwnProfile ? (
                      <button 
                        className="btn btn-outline-secondary btn-sm w-100"
                        onClick={handleOpenEdit}
                      >
                        <i className="bi bi-gear me-2"></i>
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button 
                          className="btn btn-warning btn-sm me-2 flex-grow-1"
                          onClick={handleFollowUser}
                          disabled={followLoading}
                        >
                          {followLoading ? (
                            <span className="spinner-border spinner-border-sm me-2"></span>
                          ) : (
                            <i className={`bi ${isFollowing ? 'bi-person-check' : 'bi-person-plus'} me-2`}></i>
                          )}
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button className="btn btn-outline-secondary btn-sm">
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      </>
                    )}
                  </div>

                  {/* About Section */}
                  {profile.bio ? (
                    <div className="mb-3">
                      <p className="small mb-0">{profile.bio}</p>
                    </div>
                  ) : isOwnProfile && (
                    <div className="text-center py-4 mb-3 bg-light rounded">
                      <p className="small fw-semibold mb-2">Help people get to know you</p>
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={handleOpenEdit}
                      >
                        Add Description
                      </button>
                    </div>
                  )}

                  {/* Joined Date */}
                  <div className="mb-3">
                    <p className="small text-muted mb-1">
                      <i className="bi bi-calendar3 me-2"></i>
                      <strong>Joined</strong> {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="col-md-8">
            {activeTab === 'intro' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Stories by {profile.name.split(' ')[0]}</h5>
                  {isOwnProfile && (
                    <button className="btn btn-link text-muted">
                      <i className="bi bi-gear"></i>
                    </button>
                  )}
                </div>
                {userWorks.length > 0 ? (
                  <>
                    <p className="text-muted small mb-3">
                      {userWorks.filter(s => s.status === 'published').length} Published Stories • {userWorks.filter(s => s.status === 'draft').length} Drafts (only visible to you)
                    </p>
                    <div className="row g-3">
                      {userWorks.map((story) => (
                        <div key={story.id} className="col-12">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body d-flex gap-3">
                              <img 
                                src={story.cover_image || story.cover_url || '/assests/icons/default-cover.png'} 
                                alt={story.title}
                                className="rounded object-fit-cover"
                                style={{width: '80px', height: '120px'}}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assests/icons/default-cover.png';
                                }}
                              />
                              <div className="flex-grow-1">
                                <h6 className="fw-bold mb-2">{story.title}</h6>
                                <p className="small text-muted mb-2">
                                  {story.description ? 
                                    (story.description.length > 120 ? 
                                      story.description.substring(0, 120) + '...' : 
                                      story.description) 
                                    : 'No description'
                                  }
                                </p>
                                <div className="d-flex gap-3 small text-muted">
                                  <span><i className="bi bi-eye me-1"></i>{story.views_count || 0}</span>
                                  <span><i className="bi bi-star me-1"></i>{story.vote_count || 0}</span>
                                  <span><i className="bi bi-book me-1"></i>{story.chapters_count || 0} chapters</span>
                                </div>
                                <div className="mt-2">
                                  <small className="text-muted">
                                    {story.status === 'draft' ? (
                                      <span className="badge bg-secondary">DRAFT (only visible to you)</span>
                                    ) : (
                                      <span>Updated: {story.updated_at ? new Date(story.updated_at).toLocaleDateString('en-US') : 'Unknown'}</span>
                                    )}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-book text-secondary" style={{fontSize: '64px'}}></i>
                    <h5 className="mt-4 mb-2">No works yet</h5>
                    <p className="text-muted">
                      {isOwnProfile ? 
                        'Write and share your first story' : 
                        'This author hasn\'t published any works yet'
                      }
                    </p>
                    {isOwnProfile && (
                      <button 
                        className="btn btn-warning"
                        onClick={() => window.location.href = '/create-story'}
                      >
                        <i className="bi bi-plus-lg me-2"></i>
                        Create Story
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'library' && (
              <div>
                {/* Create Reading List Button */}
                {isOwnProfile && (
                  <button 
                    className="btn btn-dark rounded-pill mb-4"
                    onClick={() => setShowCreateListModal(true)}
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Create reading list
                  </button>
                )}

                {/* Display all reading lists */}
                {readingLists.map((list) => {
                  const thumbnails = readingListThumbnails[list.id] || [];
                  const storyCount = list.story_count || 0;
                  
                  return (
                    <div 
                      key={list.id}
                      className="card border mb-3"
                      style={{cursor: 'pointer'}}
                      onClick={() => {
                        setViewingList(list);
                        // Fetch stories for this list
                        fetchListStories(list.id);
                      }}
                    >
                      <div className="card-body d-flex align-items-center gap-3 p-4">
                        {/* Thumbnail Display */}
                        <div className="d-flex gap-1">
                          {storyCount >= 3 && thumbnails.length >= 3 ? (
                            // Show first thumbnail + 2 smaller thumbnails on the side
                            <>
                              <img 
                                src={thumbnails[0].cover_url || '/assests/icons/default-cover.png'} 
                                alt="Story 1"
                                className="rounded object-fit-cover"
                                style={{width: '60px', height: '90px'}}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assests/icons/default-cover.png';
                                }}
                              />
                              <div className="d-flex flex-column gap-1">
                                <img 
                                  src={thumbnails[1].cover_url || '/assests/icons/default-cover.png'} 
                                  alt="Story 2"
                                  className="rounded object-fit-cover"
                                  style={{width: '30px', height: '43px'}}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assests/icons/default-cover.png';
                                  }}
                                />
                                <img 
                                  src={thumbnails[2].cover_url || '/assests/icons/default-cover.png'} 
                                  alt="Story 3"
                                  className="rounded object-fit-cover"
                                  style={{width: '30px', height: '43px'}}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assests/icons/default-cover.png';
                                  }}
                                />
                              </div>
                            </>
                          ) : thumbnails.length > 0 ? (
                            // Show only the first story's thumbnail
                            <img 
                              src={thumbnails[0].cover_url || '/assests/icons/default-cover.png'} 
                              alt="Story"
                              className="rounded object-fit-cover"
                              style={{width: '60px', height: '90px'}}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assests/icons/default-cover.png';
                              }}
                            />
                          ) : (
                            // Default placeholder
                            <>
                              <div 
                                className="d-flex align-items-center justify-content-center rounded"
                                style={{
                                  width: '60px',
                                  height: '90px',
                                  backgroundColor: '#E8E8E8'
                                }}
                              >
                                <i className="bi bi-book text-secondary" style={{fontSize: '24px'}}></i>
                              </div>
                              <div className="d-flex flex-column gap-1">
                                <div 
                                  className="d-flex align-items-center justify-content-center rounded"
                                  style={{
                                    width: '30px',
                                    height: '43px',
                                    backgroundColor: '#E8E8E8'
                                  }}
                                >
                                  <span className="text-secondary" style={{fontSize: '12px', fontWeight: 'bold'}}>W</span>
                                </div>
                                <div 
                                  className="d-flex align-items-center justify-content-center rounded"
                                  style={{
                                    width: '30px',
                                    height: '43px',
                                    backgroundColor: '#E8E8E8'
                                  }}
                                >
                                  <span className="text-secondary" style={{fontSize: '12px', fontWeight: 'bold'}}>W</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="fw-bold mb-2">{list.name}</h5>
                          {list.description && (
                            <p className="small text-muted mb-2">{list.description}</p>
                          )}
                          <div className="text-muted small">
                            <span>{storyCount} {storyCount === 1 ? 'story' : 'stories'}</span>
                            {!list.is_public && (
                              <i className="bi bi-lock-fill ms-2"></i>
                            )}
                          </div>
                        </div>
                        <button 
                          className="btn btn-link text-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle menu options
                          }}
                        >
                          <i className="bi bi-three-dots-vertical" style={{fontSize: '24px'}}></i>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {readingLists.length === 0 && (
                  <div className="text-center py-5">
                    <i className="bi bi-bookmark text-muted" style={{fontSize: '64px'}}></i>
                    <h5 className="mt-3 mb-2">No reading lists yet</h5>
                    <p className="text-muted">Create your first reading list to organize your stories</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="py-4">
                <h5 className="mb-3">Following ({followingStories.length})</h5>
                {followingStories.length > 0 ? (
                  <div className="row g-3">
                    {followingStories.map((story) => (
                      <div key={story.id} className="col-12">
                        <div className="card border-0 shadow-sm">
                          <div className="card-body d-flex gap-3">
                            <Link to={`/story/${story.id}`}>
                              <img 
                                src={story.cover_url || '/assests/icons/default-cover.png'} 
                                alt={story.title}
                                className="rounded object-fit-cover"
                                style={{width: '80px', height: '120px'}}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assests/icons/default-cover.png';
                                }}
                              />
                            </Link>
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-2">
                                <Link to={`/story/${story.id}`} className="text-decoration-none text-dark">
                                  {story.title}
                                </Link>
                              </h6>
                              <p className="small text-muted mb-2">
                                by <Link to={`/profile/${story.user_id}`} className="text-decoration-none">
                                  {story.author_name}
                                </Link>
                              </p>
                              {story.description && (
                                <p className="small text-muted mb-2">
                                  {story.description.length > 120 ? 
                                    story.description.substring(0, 120) + '...' : 
                                    story.description
                                  }
                                </p>
                              )}
                              <div className="d-flex gap-3 small text-muted">
                                <span><i className="bi bi-eye me-1"></i>{story.read_count || 0}</span>
                                <span><i className="bi bi-star me-1"></i>{story.vote_count || 0}</span>
                                <span><i className="bi bi-book me-1"></i>{story.chapter_count || 0} chapters</span>
                              </div>
                              <div className="mt-2">
                                <small className="text-muted">
                                  Updated: {story.updated_at ? new Date(story.updated_at).toLocaleDateString('en-US') : 'Unknown'}
                                </small>
                                <small className="text-success d-block">
                                  Following since {story.followed_at ? new Date(story.followed_at).toLocaleDateString('en-US') : 'Unknown'}
                                </small>
                              </div>
                            </div>
                            {isOwnProfile && (
                              <button 
                                className="btn btn-sm p-1 align-self-start"
                                onClick={() => handleUnfollowStory(story.id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#dc3545',
                                  fontSize: '14px',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-book-heart text-secondary" style={{fontSize: '64px'}}></i>
                    <h5 className="mt-4 mb-2">Not following any stories yet</h5>
                    <p className="text-muted">
                      When you follow stories, they will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Reading List Modal */}
      {showCreateListModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Create a new reading list</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreateListModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">List Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter list name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    maxLength="100"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description (optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="What's this list about?"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    maxLength="500"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Privacy</label>
                  <select 
                    className="form-select"
                    value={newListPrivacy}
                    onChange={(e) => setNewListPrivacy(e.target.value)}
                  >
                    <option value="public">Public - Anyone can see this list</option>
                    <option value="private">Private - Only you can see this list</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setShowCreateListModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning text-white rounded-pill px-4"
                  onClick={handleCreateList}
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Reading List Contents Modal */}
      {viewingList && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060}}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0">
                <div>
                  <h5 className="modal-title fw-bold mb-0">{viewingList.name}</h5>
                  <small className="text-muted">{listStories.length} {listStories.length === 1 ? 'story' : 'stories'}</small>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setViewingList(null);
                    setListStories([]);
                    setListSearchQuery('');
                    setListCurrentPage(1);
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{maxHeight: '70vh'}}>
                {/* Search Bar */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search stories in this list..."
                      value={listSearchQuery}
                      onChange={(e) => {
                        setListSearchQuery(e.target.value);
                        setListCurrentPage(1); // Reset to first page on search
                      }}
                    />
                  </div>
                </div>

                {/* Stories in List */}
                {(() => {
                  const filteredStories = listStories.filter(story => 
                    story.title.toLowerCase().includes(listSearchQuery.toLowerCase())
                  );
                  
                  const totalPages = Math.ceil(filteredStories.length / STORIES_PER_PAGE);
                  const startIndex = (listCurrentPage - 1) * STORIES_PER_PAGE;
                  const endIndex = startIndex + STORIES_PER_PAGE;
                  const paginatedStories = filteredStories.slice(startIndex, endIndex);
                  
                  return (
                    <>
                      <div className="row g-3" style={{maxHeight: '50vh', overflowY: 'auto'}}>
                        {filteredStories.length === 0 ? (
                          <div className="col-12">
                            <div className="text-center py-5">
                              <i className="bi bi-bookmark text-muted" style={{fontSize: '64px'}}></i>
                              <h5 className="mt-3 mb-2">
                                {listSearchQuery ? 'No stories found' : 'No stories yet'}
                              </h5>
                              <p className="text-muted">
                                {listSearchQuery ? 
                                  'Try a different search term' : 
                                  'Stories you add will appear here'
                                }
                              </p>
                            </div>
                          </div>
                        ) : (
                          paginatedStories.map((story) => (
                            <div key={story.id} className="col-12">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body d-flex gap-3">
                                  <img 
                                    src={story.cover_url || '/assests/icons/default-cover.png'} 
                                    alt={story.title}
                                    className="rounded object-fit-cover"
                                    style={{width: '80px', height: '120px'}}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/assests/icons/default-cover.png';
                                    }}
                                  />
                                  <div className="flex-grow-1">
                                    <h6 className="fw-bold mb-2">
                                      <a href={`/story/${story.id}`} className="text-decoration-none text-dark">
                                        {story.title}
                                      </a>
                                    </h6>
                                    <p className="small text-muted mb-2">
                                      by {story.author_name || story.username}
                                    </p>
                                    <p className="small text-muted mb-2">
                                      {story.description ? 
                                        (story.description.length > 150 ? 
                                          story.description.substring(0, 150) + '...' : 
                                          story.description) 
                                        : 'No description'
                                      }
                                    </p>
                                    <div className="d-flex gap-3 small text-muted">
                                      <span><i className="bi bi-eye me-1"></i>{story.read_count || 0}</span>
                                      <span><i className="bi bi-star me-1"></i>{story.vote_count || 0}</span>
                                      <span><i className="bi bi-book me-1"></i>{story.chapter_count || 0} {story.chapter_count === 1 ? 'chapter' : 'chapters'}</span>
                                    </div>
                                  </div>
                                  {isOwnProfile && (
                                    <div className="d-flex flex-column justify-content-between">
                                      <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveFromList(viewingList.id, story.id);
                                        }}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            disabled={listCurrentPage === 1}
                            onClick={() => setListCurrentPage(prev => Math.max(1, prev - 1))}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <span className="small text-muted">
                            Page {listCurrentPage} of {totalPages}
                          </span>
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            disabled={listCurrentPage === totalPages}
                            onClick={() => setListCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}