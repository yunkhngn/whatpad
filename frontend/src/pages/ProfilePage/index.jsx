/**
 * APIs cần bổ sung (NOTE):
 *  GET /users/:id/stories - Lấy stories của user (chưa có)
 *  GET /auth/me - Lấy current user từ token (đang dùng localStorage)
 *  POST /upload/image - Upload avatar image (chưa tích hợp)
 *  Conversations/Messages API - Hiển thị hội thoại (chưa có)
 *  POST /favorites/me/favorite-lists - Tạo reading list mới
 *  DELETE /follows/:authorId - Bỏ theo dõi user
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_BASE_URL = 'http://localhost:4000';

const getAuthToken = () => localStorage.getItem('authToken');

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
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState('intro');
  const [currentPage, setCurrentPage] = useState('profile');
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    id: null,
    name: '',
    username: '',
    email: '',
    avatar: '',
    coverImage: '',
    bio: '',
    created_at: null
  });

  const [stats, setStats] = useState({
    works: 0,
    readingLists: 0,
    followers: 0,
    following: 0
  });

  const [readingLists, setReadingLists] = useState([]);
  const [following, setFollowing] = useState([]);
  const [fetchError, setFetchError] = useState(null); // Alert message for fetch errors

  const [editData, setEditData] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        // NOTE: Cần API để lấy current user ID từ token
        const currentUserId = userId || localStorage.getItem('userId') || '1';

        try {
          const profileRes = await apiRequest(`/users/${currentUserId}`);
          if (profileRes.ok) {
            const userData = profileRes.data;
            setProfile({
              id: userData.id,
              name: userData.username,
              username: `@${userData.username}`,
              email: userData.email,
              avatar: userData.avatar_url || 'https://via.placeholder.com/200',
              coverImage: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=1200&h=300&fit=crop',
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

        // NOTE: Cần API GET /users/:id/stories để lấy stories của user

        try {
          const listsRes = await apiRequest('/favorites/me/favorite-lists');
          if (listsRes.ok) {
            setReadingLists(listsRes.data);
            setStats(prev => ({ ...prev, readingLists: listsRes.data.length }));
          }
        } catch (err) {
          console.log('Error fetching reading lists:', err);
        }

        try {
          const followersRes = await apiRequest(`/users/${currentUserId}/followers`);
          if (followersRes.ok) {
            setStats(prev => ({ ...prev, followers: followersRes.data.length }));
          }
        } catch (err) {
          console.log('Error fetching followers:', err);
        }

        try {
          const followingRes = await apiRequest(`/users/${currentUserId}/following`);
          if (followingRes.ok) {
            setFollowing(followingRes.data);
            setStats(prev => ({ ...prev, following: followingRes.data.length }));
          }
        } catch (err) {
          console.log('Error fetching following:', err);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setFetchError('Đã xảy ra lỗi khi tải dữ liệu. Một số thông tin có thể không hiển thị.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

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
          avatar: editData.avatar_url
        });
        setCurrentPage('profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Không thể cập nhật hồ sơ');
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
                      <img 
                        src={profile.avatar} 
                        alt={profile.name}
                        className="rounded-circle object-fit-cover"
                        style={{width: '128px', height: '128px'}}
                      />
                      <button className="btn btn-primary btn-sm rounded-pill position-absolute bottom-0 end-0">
                        Thay Đổi Avatar
                      </button>
                    </div>

                    <h5>{profile.name}</h5>
                    <p className="text-muted small">{profile.username}</p>
                    <div className="d-flex justify-content-center gap-4 small text-muted">
                      <span>{stats.works} Tác phẩm</span>
                      <span>{stats.readingLists} Danh Sách Đọc</span>
                      <span>{stats.followers} Người Theo Dõi</span>
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

      {/* Cover Image */}
      <div className="position-relative overflow-hidden" style={{height: '250px'}}>
        <img src={profile.coverImage} alt="Cover" className="w-100 h-100 object-fit-cover" style={{opacity: 0.8}} />
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient" style={{background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', mixBlendMode: 'multiply'}}></div>
      </div>

      {/* Profile Section */}
      <div className="container" style={{marginTop: '-80px'}}>
        <div className="card shadow-lg mb-4">
          <div className="card-body p-4">
            <div className="text-center">
              <div className="position-relative d-inline-block mb-3">
                <img 
                  src={profile.avatar} 
                  alt={profile.name}
                  className="rounded-circle border border-white border-4 shadow-lg object-fit-cover"
                  style={{width: '128px', height: '128px'}}
                />
              </div>
              
              <h1 className="h3 fw-bold mb-2">{profile.name}</h1>
              <p className="text-muted mb-3">{profile.username}</p>
              
              <button 
                className="btn btn-outline-warning rounded-pill px-4 py-2 mb-3"
                onClick={handleOpenEdit}
              >
                <i className="bi bi-pencil-fill me-2"></i>
                Sửa Hồ Sơ
              </button>
              
              <div className="d-flex justify-content-center gap-5 mb-3">
                <div className="text-center">
                  <div className="h4 fw-bold mb-0">{stats.works}</div>
                  <small className="text-muted">Tác phẩm</small>
                </div>
                <div className="text-center">
                  <div className="h4 fw-bold mb-0">{stats.readingLists}</div>
                  <small className="text-muted">Danh Sách Đọc</small>
                </div>
                <div className="text-center">
                  <div className="h4 fw-bold mb-0">{stats.followers}</div>
                  <small className="text-muted">Người Theo Dõi</small>
                </div>
              </div>
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
                className={`nav-link w-100 ${activeTab === 'conversations' ? 'active text-warning border-warning border-bottom-3' : 'text-secondary'}`}
                onClick={() => setActiveTab('conversations')}
              >
                Hội Thoại
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
                          <button 
                            className="btn btn-warning btn-sm text-white"
                            onClick={handleOpenEdit}
                          >
                            Thêm Mô Tả
                          </button>
                        </div>
                      )}

                      <div className="border-bottom pb-3 mb-3">
                        <h6 className="small fw-semibold mb-3">CHIA SẺ HỒ SƠ</h6>
                        <div className="d-flex gap-2">
                          <button className="btn btn-primary btn-sm rounded-circle p-2" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-facebook"></i>
                          </button>
                          <button className="btn btn-info btn-sm rounded-circle p-2 text-white" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-twitter"></i>
                          </button>
                          <button className="btn btn-danger btn-sm rounded-circle p-2" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-pinterest"></i>
                          </button>
                          <button className="btn btn-secondary btn-sm rounded-circle p-2" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-link-45deg"></i>
                          </button>
                          <button className="btn btn-warning btn-sm rounded-circle p-2 text-white" style={{width: '32px', height: '32px'}}>
                            <i className="bi bi-envelope"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-9">
                  <h5 className="mb-3">Danh Sách Đọc ({stats.readingLists})</h5>
                  {readingLists.length > 0 ? (
                    <>
                      <div className="row g-3">
                        {readingLists.slice(0, 4).map((list) => (
                          <div key={list.id} className="col-6 col-md-3">
                            <div className="card h-100">
                              <div className="card-body text-center p-3">
                                <i className="bi bi-bookmark-fill text-warning" style={{fontSize: '2rem'}}></i>
                                <h6 className="small mt-2 mb-1">{list.name}</h6>
                                <small className="text-muted">
                                  {list.is_private ? <i className="bi bi-lock-fill"></i> : <i className="bi bi-globe"></i>}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {readingLists.length > 4 && (
                        <div className="text-center mt-3">
                          <button className="btn btn-link text-warning">
                            Xem tất cả ({readingLists.length})
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="row g-3">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="col-6 col-md-3">
                          <div className="bg-secondary bg-opacity-25 rounded" style={{paddingBottom: '133.33%'}}></div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-center mt-4">
                    <button className="btn btn-warning text-white rounded-pill px-4 py-2">
                      Tạo Danh sách Đọc
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'conversations' && (
              <div className="text-center py-5">
                <i className="bi bi-chat-dots text-secondary" style={{fontSize: '64px'}}></i>
                <h5 className="mt-4 mb-2">Chưa có hội thoại</h5>
                <p className="text-muted">
                  {/* NOTE: Cần API để lấy conversations/messages của user */}
                  Các cuộc hội thoại của bạn sẽ xuất hiện ở đây
                </p>
              </div>
            )}

            {activeTab === 'following' && (
              <div className="py-4">
                {following.length > 0 ? (
                  <div className="row g-3">
                    {following.map((user) => (
                      <div key={user.id} className="col-md-6">
                        <div className="card">
                          <div className="card-body d-flex align-items-center gap-3">
                            <img 
                              src={user.avatar_url || 'https://via.placeholder.com/50'} 
                              alt={user.username}
                              className="rounded-circle"
                              style={{width: '50px', height: '50px', objectFit: 'cover'}}
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-0">{user.username}</h6>
                              <small className="text-muted">
                                Đã theo dõi từ {new Date(user.followed_at).toLocaleDateString('vi-VN')}
                              </small>
                            </div>
                            <button className="btn btn-outline-warning btn-sm">
                              Bỏ theo dõi
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="bg-secondary bg-opacity-25 rounded-circle mx-auto d-flex align-items-center justify-content-center mb-4" style={{width: '64px', height: '64px'}}>
                      <i className="bi bi-people-fill text-secondary" style={{fontSize: '32px'}}></i>
                    </div>
                    <h5 className="mb-2">Chưa theo dõi ai</h5>
                    <p className="text-muted mb-3">Tìm kiếm và theo dõi những tác giả bạn yêu thích</p>
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