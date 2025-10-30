import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { 
    getUserProfile, 
    getStoriesByUserId,
    getPublishedStoriesByUserId,
    getDraftStoriesByUserId 
} from '../../services/api';
import StoryCard from '../../components/StoryCard';
import './UserProfilePage.css';

const UserProfilePage = () => {
    const { userId } = useParams();
    
    const [user, setUser] = useState(null);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination and filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalStories, setTotalStories] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft'

    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await getUserProfile(userId);
            setUser(response.data);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Failed to load user profile');
        }
    }, [userId]);

    const fetchUserStories = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            let response;
            const params = { page: currentPage, size: pageSize };
            
            switch (statusFilter) {
                case 'published':
                    response = await getPublishedStoriesByUserId(userId, params);
                    break;
                case 'draft':
                    response = await getDraftStoriesByUserId(userId, params);
                    break;
                case 'all':
                default:
                    response = await getStoriesByUserId(userId, params);
                    break;
            }
            
            setStories(response.stories || []);
            setTotalStories(response.total || response.stories?.length || 0);
        } catch (err) {
            console.error('Error fetching user stories:', err);
            setError('Failed to load stories');
        } finally {
            setLoading(false);
        }
    }, [userId, currentPage, pageSize, statusFilter]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    useEffect(() => {
        fetchUserStories();
    }, [fetchUserStories]);

    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1); // Reset to first page when changing filter
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = Math.ceil(totalStories / pageSize);

    if (loading && !stories.length) {
        return <div className="user-profile-loading">Loading...</div>;
    }

    return (
        <div className="user-profile-page">
            {/* User Profile Section */}
            {user && (
                <div className="user-profile-header">
                    <div className="user-avatar">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} />
                        ) : (
                            <div className="avatar-placeholder">{user.username?.[0]?.toUpperCase()}</div>
                        )}
                    </div>
                    <div className="user-info">
                        <h1>{user.username}</h1>
                        {user.bio && <p className="user-bio">{user.bio}</p>}
                        <div className="user-meta">
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Stories Section */}
            <div className="user-stories-section">
                <div className="stories-header">
                    <h2>Stories</h2>
                    
                    {/* Status Filter Tabs */}
                    <div className="status-filter-tabs">
                        <button
                            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleStatusFilterChange('all')}
                        >
                            All Stories
                        </button>
                        <button
                            className={`filter-tab ${statusFilter === 'published' ? 'active' : ''}`}
                            onClick={() => handleStatusFilterChange('published')}
                        >
                            Published
                        </button>
                        <button
                            className={`filter-tab ${statusFilter === 'draft' ? 'active' : ''}`}
                            onClick={() => handleStatusFilterChange('draft')}
                        >
                            Drafts
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && <div className="error-message">{error}</div>}

                {/* Stories Grid */}
                {loading ? (
                    <div className="stories-loading">Loading stories...</div>
                ) : stories.length === 0 ? (
                    <div className="no-stories">
                        <p>No {statusFilter !== 'all' ? statusFilter : ''} stories found.</p>
                    </div>
                ) : (
                    <>
                        <div className="stories-grid">
                            {stories.map((story) => (
                                <StoryCard key={story.id} story={story} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                
                                <div className="pagination-info">
                                    Page {currentPage} of {totalPages}
                                </div>
                                
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfilePage;
