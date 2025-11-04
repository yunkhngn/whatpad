import { useState, useEffect, useCallback } from 'react';
import { 
    getStoriesByUserId,
    getPublishedStoriesByUserId,
    getDraftStoriesByUserId 
} from '../services/api';

/**
 * Custom hook for fetching and managing user stories
 * @param {string|number} userId - The ID of the user
 * @param {Object} options - Configuration options
 * @param {string} options.status - Filter by status: 'all', 'published', 'draft'
 * @param {number} options.page - Current page number (default: 1)
 * @param {number} options.size - Items per page (default: 10)
 * @param {boolean} options.autoFetch - Whether to fetch automatically on mount (default: true)
 * @returns {Object} - { stories, loading, error, refetch, pagination }
 */
export const useUserStories = (userId, options = {}) => {
    const {
        status = 'all',
        page = 1,
        size = 10,
        autoFetch = true
    } = options;

    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: page,
        pageSize: size,
        total: 0,
        totalPages: 0
    });

    const fetchStories = useCallback(async () => {
        if (!userId) {
            setError('User ID is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let response;
            const params = { page: pagination.currentPage, size: pagination.pageSize };

            switch (status) {
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
            setPagination(prev => ({
                ...prev,
                total: response.total || response.stories?.length || 0,
                totalPages: Math.ceil((response.total || response.stories?.length || 0) / prev.pageSize),
                currentPage: response.page || prev.currentPage
            }));
        } catch (err) {
            console.error('Error fetching user stories:', err);
            setError(err.message || 'Failed to fetch stories');
            setStories([]);
        } finally {
            setLoading(false);
        }
    }, [userId, status, pagination.currentPage, pagination.pageSize]);

    useEffect(() => {
        if (autoFetch) {
            fetchStories();
        }
    }, [autoFetch, fetchStories]);

    const refetch = useCallback(() => {
        fetchStories();
    }, [fetchStories]);

    const setPage = useCallback((newPage) => {
        setPagination(prev => ({
            ...prev,
            currentPage: newPage
        }));
    }, []);

    const setPageSize = useCallback((newSize) => {
        setPagination(prev => ({
            ...prev,
            pageSize: newSize,
            currentPage: 1 // Reset to first page when changing page size
        }));
    }, []);

    return {
        stories,
        loading,
        error,
        refetch,
        pagination,
        setPage,
        setPageSize
    };
};

export default useUserStories;
