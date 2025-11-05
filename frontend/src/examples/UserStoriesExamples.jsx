/**
 * USAGE EXAMPLES FOR USER STORIES API
 * 
 * This file demonstrates various ways to use the updated User Stories API
 * in your React components.
 */

import React, { useState, useEffect } from 'react';
import { 
    getStoriesByUserId, 
    getPublishedStoriesByUserId,
    getDraftStoriesByUserId 
} from '../services/api';
import { useUserStories } from '../hooks/useUserStories';
import UserStoriesWidget from '../components/UserStoriesWidget';

// ============================================================================
// EXAMPLE 1: Basic Usage - Fetch all stories for a user
// ============================================================================
export const Example1_BasicFetch = ({ userId }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await getStoriesByUserId(userId);
                setStories(response.stories);
            } catch (error) {
                console.error('Error fetching stories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, [userId]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2>All Stories</h2>
            {stories.map(story => (
                <div key={story.id}>{story.title}</div>
            ))}
        </div>
    );
};

// ============================================================================
// EXAMPLE 2: Fetch Published Stories Only
// ============================================================================
export const Example2_PublishedOnly = ({ userId }) => {
    const [stories, setStories] = useState([]);

    useEffect(() => {
        const fetchStories = async () => {
            // Method 1: Using the dedicated helper function
            const response = await getPublishedStoriesByUserId(userId);
            
            // Method 2: Using getStoriesByUserId with status parameter
            // const response = await getStoriesByUserId(userId, { status: 'published' });
            
            setStories(response.stories);
        };

        fetchStories();
    }, [userId]);

    return (
        <div>
            <h2>Published Stories</h2>
            {stories.map(story => (
                <div key={story.id}>{story.title}</div>
            ))}
        </div>
    );
};

// ============================================================================
// EXAMPLE 3: With Pagination
// ============================================================================
export const Example3_WithPagination = ({ userId }) => {
    const [stories, setStories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        const fetchStories = async () => {
            const response = await getStoriesByUserId(userId, {
                page: currentPage,
                size: pageSize,
                status: 'published'
            });

            setStories(response.stories);
            setTotalPages(Math.ceil(response.total / pageSize));
        };

        fetchStories();
    }, [userId, currentPage]);

    return (
        <div>
            <h2>Stories - Page {currentPage}</h2>
            
            {stories.map(story => (
                <div key={story.id}>{story.title}</div>
            ))}

            <div>
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                >
                    Previous
                </button>
                
                <span>Page {currentPage} of {totalPages}</span>
                
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// EXAMPLE 4: With Status Filtering
// ============================================================================
export const Example4_WithFiltering = ({ userId }) => {
    const [stories, setStories] = useState([]);
    const [status, setStatus] = useState('all'); // 'all', 'published', 'draft'

    useEffect(() => {
        const fetchStories = async () => {
            let response;
            
            switch (status) {
                case 'published':
                    response = await getPublishedStoriesByUserId(userId);
                    break;
                case 'draft':
                    response = await getDraftStoriesByUserId(userId);
                    break;
                case 'all':
                default:
                    response = await getStoriesByUserId(userId);
                    break;
            }

            setStories(response.stories);
        };

        fetchStories();
    }, [userId, status]);

    return (
        <div>
            <div>
                <button onClick={() => setStatus('all')}>All</button>
                <button onClick={() => setStatus('published')}>Published</button>
                <button onClick={() => setStatus('draft')}>Drafts</button>
            </div>

            <h2>
                {status === 'all' ? 'All Stories' : 
                 status === 'published' ? 'Published Stories' : 
                 'Draft Stories'}
            </h2>

            {stories.map(story => (
                <div key={story.id}>
                    {story.title} - {story.status}
                </div>
            ))}
        </div>
    );
};

// ============================================================================
// EXAMPLE 5: Using the Custom Hook (Recommended)
// ============================================================================
export const Example5_UsingHook = ({ userId }) => {
    const { 
        stories, 
        loading, 
        error, 
        pagination,
        setPage 
    } = useUserStories(userId, {
        status: 'published',
        page: 1,
        size: 10
    });

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Stories (Using Hook)</h2>
            
            {stories.map(story => (
                <div key={story.id}>{story.title}</div>
            ))}

            {pagination.totalPages > 1 && (
                <div>
                    <button 
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPage(pagination.currentPage - 1)}
                    >
                        Previous
                    </button>
                    
                    <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                    
                    <button 
                        disabled={pagination.currentPage === pagination.totalPages}
                        onClick={() => setPage(pagination.currentPage + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// EXAMPLE 6: Using the Reusable Widget Component (Easiest)
// ============================================================================
export const Example6_UsingWidget = ({ userId }) => {
    return (
        <div>
            {/* Basic usage - shows all published stories */}
            <UserStoriesWidget 
                userId={userId}
                status="published"
            />

            {/* With all features enabled */}
            <UserStoriesWidget 
                userId={userId}
                status="all"
                pageSize={12}
                showPagination={true}
                showFilters={true}
                title="User's Stories"
                emptyMessage="This user hasn't published any stories yet"
            />
        </div>
    );
};

// ============================================================================
// EXAMPLE 7: Advanced - Multiple Status Tabs with Separate States
// ============================================================================
export const Example7_AdvancedTabs = ({ userId }) => {
    const [activeTab, setActiveTab] = useState('published');

    // Separate hooks for each tab to cache results
    const publishedStories = useUserStories(userId, {
        status: 'published',
        autoFetch: activeTab === 'published'
    });

    const draftStories = useUserStories(userId, {
        status: 'draft',
        autoFetch: activeTab === 'draft'
    });

    const allStories = useUserStories(userId, {
        status: 'all',
        autoFetch: activeTab === 'all'
    });

    const getCurrentData = () => {
        switch (activeTab) {
            case 'published': return publishedStories;
            case 'draft': return draftStories;
            case 'all': return allStories;
            default: return allStories;
        }
    };

    const { stories, loading, error } = getCurrentData();

    return (
        <div>
            <div>
                <button onClick={() => setActiveTab('all')}>
                    All ({allStories.pagination.total})
                </button>
                <button onClick={() => setActiveTab('published')}>
                    Published ({publishedStories.pagination.total})
                </button>
                <button onClick={() => setActiveTab('draft')}>
                    Drafts ({draftStories.pagination.total})
                </button>
            </div>

            {loading && <div>Loading...</div>}
            {error && <div>Error: {error}</div>}

            {stories.map(story => (
                <div key={story.id}>{story.title}</div>
            ))}
        </div>
    );
};

// ============================================================================
// EXAMPLE 8: Error Handling and Loading States
// ============================================================================
export const Example8_ErrorHandling = ({ userId }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await getStoriesByUserId(userId, {
                    status: 'published',
                    page: 1,
                    size: 20
                });
                
                setStories(response.stories);
            } catch (err) {
                console.error('Failed to fetch stories:', err);
                setError('Unable to load stories. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, [userId]);

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading stories...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <div className="empty-state">
                <p>No stories found</p>
            </div>
        );
    }

    return (
        <div>
            {stories.map(story => (
                <div key={story.id}>{story.title}</div>
            ))}
        </div>
    );
};

// ============================================================================
// EXAMPLE 9: Real-time Refetch with Manual Trigger
// ============================================================================
export const Example9_ManualRefetch = ({ userId }) => {
    const { 
        stories, 
        loading, 
        refetch 
    } = useUserStories(userId, {
        status: 'all',
        autoFetch: true
    });

    const handleRefresh = () => {
        refetch();
    };

    return (
        <div>
            <button onClick={handleRefresh} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Stories'}
            </button>

            {stories.map(story => (
                <div key={story.id}>{story.title}</div>
            ))}
        </div>
    );
};

const UserStoriesExamples = {
    Example1_BasicFetch,
    Example2_PublishedOnly,
    Example3_WithPagination,
    Example4_WithFiltering,
    Example5_UsingHook,
    Example6_UsingWidget,
    Example7_AdvancedTabs,
    Example8_ErrorHandling,
    Example9_ManualRefetch
};

export default UserStoriesExamples;
