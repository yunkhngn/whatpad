import React from 'react';
import { useUserStories } from '../../hooks/useUserStories';
import StoryCard from '../StoryCard';
import './UserStoriesWidget.css';

/**
 * Reusable component to display user stories with filtering and pagination
 * 
 * @param {Object} props
 * @param {string|number} props.userId - The ID of the user
 * @param {string} props.status - Filter by status: 'all', 'published', 'draft' (default: 'all')
 * @param {number} props.pageSize - Number of stories per page (default: 10)
 * @param {boolean} props.showPagination - Whether to show pagination controls (default: true)
 * @param {boolean} props.showFilters - Whether to show status filter tabs (default: false)
 * @param {string} props.title - Widget title (optional)
 * @param {string} props.emptyMessage - Message to show when no stories found (optional)
 */
const UserStoriesWidget = ({ 
    userId, 
    status = 'all',
    pageSize = 10,
    showPagination = true,
    showFilters = false,
    title = 'Stories',
    emptyMessage = 'No stories found'
}) => {
    const [currentStatus, setCurrentStatus] = React.useState(status);
    
    const {
        stories,
        loading,
        error,
        pagination,
        setPage
    } = useUserStories(userId, {
        status: currentStatus,
        page: 1,
        size: pageSize,
        autoFetch: true
    });

    const handleStatusChange = (newStatus) => {
        setCurrentStatus(newStatus);
        setPage(1); // Reset to first page
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading && stories.length === 0) {
        return (
            <div className="user-stories-widget">
                <div className="loading">Loading stories...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-stories-widget">
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="user-stories-widget">
            {/* Header with optional title and filters */}
            <div className="widget-header">
                {title && <h3 className="widget-title">{title}</h3>}
                
                {showFilters && (
                    <div className="status-filters">
                        <button
                            className={`filter-btn ${currentStatus === 'all' ? 'active' : ''}`}
                            onClick={() => handleStatusChange('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${currentStatus === 'published' ? 'active' : ''}`}
                            onClick={() => handleStatusChange('published')}
                        >
                            Published
                        </button>
                        <button
                            className={`filter-btn ${currentStatus === 'draft' ? 'active' : ''}`}
                            onClick={() => handleStatusChange('draft')}
                        >
                            Drafts
                        </button>
                    </div>
                )}
            </div>

            {/* Stories list */}
            {stories.length === 0 ? (
                <div className="empty-state">
                    <p>{emptyMessage}</p>
                </div>
            ) : (
                <>
                    <div className="stories-list">
                        {stories.map((story) => (
                            <StoryCard key={story.id} story={story} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {showPagination && pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                ← Previous
                            </button>
                            
                            <span className="page-info">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            
                            <button
                                className="page-btn"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default UserStoriesWidget;
