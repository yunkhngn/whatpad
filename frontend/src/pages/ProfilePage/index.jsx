/**
 * APIs cần bổ sung (NOTE):
 *  GET /users/:id/stories - Lấy stories của user (chưa có)
 *  GET /auth/me - Lấy current user từ token (đang dùng localStorage)
 *  POST /upload/image - Upload avatar image (chưa tích hợp)
 *  GET /reading/me/continue-reading - Lấy truyện đang đọc của user
 *  POST /stories/add-to-reading - Thêm truyện vào danh sách đọc
 *  DELETE /follows/:authorId - Bỏ theo dõi user
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ContinueReading from '../../components/ContinueReading';

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

export default function WattpadProfile() {
  const { userId } = useParams(); // URL param for viewing other profiles
  const navigate = useNavigate();
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
    avatar_url: ''
  });

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

        try {
          // Fetch followed stories (assuming API endpoint for stories user is following)
          const followingStoriesRes = await apiRequest(`/stories/following`);
          if (followingStoriesRes.ok) {
            setFollowingStories(followingStoriesRes.data);
            setStats(prev => ({ ...prev, following: followingStoriesRes.data.length }));
          }
        } catch (err) {
          console.log('Error fetching following stories:', err);
          setFollowingStories([]);
          setStats(prev => ({ ...prev, following: 0 }));
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setFetchError('Đã xảy ra lỗi khi tải dữ liệu. Một số thông tin có thể không hiển thị.');
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
      const response = await apiRequest(`/stories/${storyId}/unfollow`, { method: 'DELETE' });
      if (response.ok) {
        // Remove story from following list
        setFollowingStories(prev => prev.filter(story => story.id !== storyId));
        setStats(prev => ({ ...prev, following: prev.following - 1 }));
      }
    } catch (err) {
      console.error('Error unfollowing story:', err);
      setFetchError('Không thể bỏ theo dõi truyện này');
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
      alert('Không thể cập nhật hồ sơ');
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
      alert('Không thể upload ảnh đại diện');
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
                    <h4 className="mb-0">Chỉnh sửa hồ sơ</h4>
                    <button 
                      className="btn btn-link text-muted text-decoration-none"
                      onClick={handleCancelEdit}
                    >
                      <i className="bi bi-x-lg me-2"></i>
                      Bỏ qua
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
                      <span>{stats.works} Tác phẩm</span>
                      <span>{stats.following} Truyện Theo Dõi</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Tên người dùng</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập tên người dùng"
                      value={editData.username}
                      onChange={(e) => setEditData({...editData, username: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Giới thiệu</label>
                    <textarea
                      className="form-control"
                      rows="6"
                      placeholder="Viết về bản thân..."
                      maxLength="2000"
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    />
                    <div className="text-end small text-muted mt-1">{editData.bio.length}/2000</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">URL Avatar</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Nhập URL hình đại diện"
                      value={editData.avatar_url}
                      onChange={(e) => setEditData({...editData, avatar_url: e.target.value})}
                    />
                    <small className="text-muted">
                      {/* NOTE: Cần tích hợp upload image API từ /upload/image */}
                      Hoặc sử dụng tính năng upload ảnh
                    </small>
                  </div>

                  <div className="d-flex justify-content-end gap-3">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={handleCancelEdit}
                    >
                      Hủy
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-warning text-white rounded-pill px-4"
                      onClick={handleSaveProfile}
                    >
                      Lưu Thay Đổi
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

      {/* Profile Section */}
      <div className="container py-4">
                <div className="card shadow mb-4">
          <div className="card-body p-4">
            <div className="text-center">
              <div className="position-relative d-inline-block mb-3">
                <AvatarImage 
                  src={profile.avatar} 
                  alt={profile.name}
                  className="rounded-circle border border-3 border-warning shadow object-fit-cover"
                  style={{width: '120px', height: '120px'}}
                />
              </div>              <h1 className="h3 fw-bold mb-2">{profile.name}</h1>
              <p className="text-muted mb-3">{profile.username}</p>
              
              {isOwnProfile ? (
                <button 
                  className="btn btn-outline-warning rounded-pill px-4 py-2 mb-3"
                  onClick={handleOpenEdit}
                >
                  <i className="bi bi-pencil-fill me-2"></i>
                  Sửa Hồ Sơ
                </button>
              ) : (
                <div className="d-flex gap-2 mb-3">
                  <button className="btn btn-primary rounded-pill px-4 py-2">
                    <i className="bi bi-person-plus-fill me-2"></i>
                    Theo dõi
                  </button>
                  <button className="btn btn-outline-secondary rounded-pill px-4 py-2">
                    <i className="bi bi-chat-fill me-2"></i>
                    Nhắn tin
                  </button>
                </div>
              )}
              
              <div className="d-flex justify-content-center gap-5 mb-3">
                <div className="text-center">
                  <div className="h4 fw-bold mb-0">{stats.works}</div>
                  <small className="text-muted">Tác phẩm</small>
                </div>
                <div className="text-center">
                  <div className="h4 fw-bold mb-0">{stats.following}</div>
                  <small className="text-muted">Truyện Theo Dõi</small>
                </div>
              </div>

              {/* Follow Button for other users only */}
              {!isOwnProfile && (
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-outline-warning rounded-pill px-4"
                    onClick={handleFollowUser}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <i className={`bi ${isFollowing ? 'bi-person-check' : 'bi-person-plus'} me-2`}></i>
                    )}
                    {isFollowing ? 'Đang Theo Dõi' : 'Theo Dõi'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card shadow">
          <ul className="nav nav-tabs border-bottom">
            <li className="nav-item flex-fill">
              <button 
                className={`nav-link w-100 ${activeTab === 'intro' ? 'active text-warning border-warning border-bottom-3' : 'text-secondary'}`}
                onClick={() => setActiveTab('intro')}
              >
                Giới thiệu
              </button>
            </li>

            <li className="nav-item flex-fill">
              <button 
                className={`nav-link w-100 ${activeTab === 'works' ? 'active text-warning border-warning border-bottom-3' : 'text-secondary'}`}
                onClick={() => setActiveTab('works')}
              >
                Tác phẩm
              </button>
            </li>

            <li className="nav-item flex-fill">
              <button 
                className={`nav-link w-100 ${activeTab === 'following' ? 'active text-warning border-warning border-bottom-3' : 'text-secondary'}`}
                onClick={() => setActiveTab('following')}
              >
                Đang theo dõi
              </button>
            </li>
          </ul>

          <div className="card-body p-4">
            {activeTab === 'intro' && (
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="card border">
                    <div className="card-body p-3">
                      <div className="border-bottom pb-3 mb-3">
                        <p className="small fw-semibold mb-2">{profile.name}</p>
                        <p className="small text-muted mb-0">
                          Đã tham gia {profile.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </p>
                      </div>

                      {profile.bio ? (
                        <div className="border-bottom pb-3 mb-3">
                          <h6 className="small fw-semibold mb-2">Giới thiệu</h6>
                          <p className="small text-muted mb-0">{profile.bio}</p>
                        </div>
                      ) : (
                        <div className="border-bottom pb-3 mb-3">
                          <p className="small text-muted fst-italic">Chưa có giới thiệu</p>
                          {isOwnProfile && (
                            <button 
                              className="btn btn-warning btn-sm text-white"
                              onClick={handleOpenEdit}
                            >
                              Thêm Mô Tả
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-9">
                  <ContinueReading />
                </div>
              </div>
            )}

            {activeTab === 'works' && (
              <div className="py-4">
                <h5 className="mb-3">Tác Phẩm ({userWorks.length})</h5>
                {userWorks.length > 0 ? (
                  <div className="row g-3">
                    {userWorks.map((story) => (
                      <div key={story.id} className="col-md-6 col-lg-4">
                        <div className="card h-100">
                          <img 
                            src={story.cover_image || 'https://via.placeholder.com/150x200/6c757d/ffffff?text=No+Cover'} 
                            alt={story.title}
                            className="card-img-top object-fit-cover"
                            style={{height: '240px'}}
                          />
                          <div className="card-body p-3">
                            <h6 className="card-title mb-2">{story.title}</h6>
                            <p className="card-text text-muted small mb-2">
                              {story.description ? 
                                (story.description.length > 80 ? 
                                  story.description.substring(0, 80) + '...' : 
                                  story.description) 
                                : 'Chưa có mô tả'
                              }
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {story.chapters_count || 0} chương
                              </small>
                              <small className="text-muted">
                                {story.views_count || 0} lượt đọc
                              </small>
                            </div>
                            <div className="mt-2">
                              <small className="text-success">
                                Cập nhật: {story.updated_at ? new Date(story.updated_at).toLocaleDateString('vi-VN') : 'Không rõ'}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-book text-secondary" style={{fontSize: '64px'}}></i>
                    <h5 className="mt-4 mb-2">Chưa có tác phẩm nào</h5>
                    <p className="text-muted">
                      {isOwnProfile ? 
                        'Hãy viết và chia sẻ câu chuyện đầu tiên của bạn' : 
                        'Tác giả chưa đăng tác phẩm nào'
                      }
                    </p>
                    {isOwnProfile && (
                      <button 
                        className="btn btn-warning text-white rounded-pill px-4 py-2 mt-3"
                        onClick={() => navigate('/work/story')}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Viết Truyện Mới
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="py-4">
                <h5 className="mb-3">Đang Theo Dõi ({followingStories.length})</h5>
                {followingStories.length > 0 ? (
                  <div className="row g-3">
                    {followingStories.map((story) => (
                      <div key={story.id} className="col-md-6">
                        <div className="card">
                          <div className="card-body d-flex align-items-center gap-3">
                            <img 
                              src={story.cover_image || 'https://via.placeholder.com/60x80/6c757d/ffffff?text=No+Cover'} 
                              alt={story.title}
                              className="rounded object-fit-cover"
                              style={{width: '60px', height: '80px'}}
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{story.title}</h6>
                              <small className="text-muted d-block">Tác giả: {story.author}</small>
                              <small className="text-muted d-block">
                                Cập nhật: {story.updated_at ? new Date(story.updated_at).toLocaleDateString('vi-VN') : 'Không rõ'}
                              </small>
                              <small className="text-success">
                                Đã theo dõi từ {story.followed_at ? new Date(story.followed_at).toLocaleDateString('vi-VN') : 'Không rõ'}
                              </small>
                            </div>
                            {isOwnProfile && (
                              <button 
                                className="btn btn-outline-warning btn-sm"
                                onClick={() => handleUnfollowStory(story.id)}
                              >
                                Bỏ theo dõi
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
                    <h5 className="mt-4 mb-2">Chưa theo dõi truyện nào</h5>
                    <p className="text-muted">
                      Khi bạn theo dõi truyện, chúng sẽ xuất hiện ở đây
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}