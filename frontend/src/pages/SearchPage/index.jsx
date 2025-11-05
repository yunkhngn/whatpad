import React, { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Form, Spinner, Badge, Pagination } from "react-bootstrap"
import { useSearchParams, Link } from "react-router"
import { getStories, getTags, searchUsers } from "../../services/api"
import styles from "./SearchPage.module.css"

const SearchPage = () => {
    const [searchParams] = useSearchParams()
    const [stories, setStories] = useState([])
    const [users, setUsers] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [resultCount, setResultCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10
    
    // Filter states
    const [selectedLengths, setSelectedLengths] = useState([])
    const [selectedUpdates, setSelectedUpdates] = useState(['anytime'])
    const [selectedTags, setSelectedTags] = useState([])
    const [tagSearchInput, setTagSearchInput] = useState('')
    const [activeTab, setActiveTab] = useState('stories')
    const [filteredSuggestions, setFilteredSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    const query = searchParams.get('q') || ''
    const tagFilter = searchParams.get('tag') || ''
    
    // Check if query is #allStories
    const isAllStoriesQuery = query.toLowerCase() === '#allstories'

    useEffect(() => {
        fetchTags()
    }, [])

    const fetchTags = async () => {
        try {
            const response = await getTags()
            setTags(response.tags || [])
        } catch (err) {
            console.error('Error fetching tags:', err)
        }
    }

    const fetchStories = useCallback(async () => {
        setLoading(true)
        try {
            const params = {
                page: 1,
                size: 50
            }
            
            // Check if query is #allStories - if so, remove it from params to fetch all stories
            if (isAllStoriesQuery) {
                // Don't add query param, just fetch all stories
            } else if (query) {
                params.q = query
            }
            
            if (tagFilter) params.tag = tagFilter
            
            const response = await getStories(params)
            let filteredStories = response.stories || []
            
            console.log('Fetched stories:', filteredStories.length)
            console.log('First story chapter_count:', filteredStories[0]?.chapter_count)
            
            // Apply length filters
            if (selectedLengths.length > 0) {
                filteredStories = filteredStories.filter(story => {
                    const chapterCount = story.chapter_count || 0
                    return selectedLengths.some(range => {
                        if (range === '1-10') return chapterCount >= 1 && chapterCount <= 10
                        if (range === '10-20') return chapterCount >= 10 && chapterCount <= 20
                        if (range === '20-50') return chapterCount >= 20 && chapterCount <= 50
                        if (range === '50+') return chapterCount >= 50
                        return false
                    })
                })
                console.log('After length filter:', filteredStories.length)
            }
            
            // Apply update filters
            if (!selectedUpdates.includes('anytime')) {
                filteredStories = filteredStories.filter(story => {
                    const updatedAt = new Date(story.updated_at)
                    const now = new Date()
                    
                    return selectedUpdates.some(period => {
                        if (period === 'today') {
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                            return updatedAt >= today
                        }
                        if (period === 'week') {
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                            return updatedAt >= weekAgo
                        }
                        if (period === 'month') {
                            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                            return updatedAt >= monthAgo
                        }
                        if (period === 'year') {
                            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                            return updatedAt >= yearAgo
                        }
                        return false
                    })
                })
            }
            
            // Apply tag filters
            if (selectedTags.length > 0) {
                filteredStories = filteredStories.filter(story => {
                    if (!story.tags || story.tags.length === 0) return false
                    return selectedTags.every(selectedTag => 
                        story.tags.some(storyTag => storyTag.name === selectedTag)
                    )
                })
            }
            
            setStories(filteredStories)
            setResultCount(filteredStories.length)
            setCurrentPage(1) // Reset to first page when filters change
        } catch (err) {
            console.error('Error fetching stories:', err)
            setStories([])
        } finally {
            setLoading(false)
        }
    }, [query, tagFilter, selectedLengths, selectedUpdates, selectedTags, isAllStoriesQuery])

    const fetchUsers = useCallback(async () => {
        if (!query) {
            console.log('fetchUsers: No query, clearing users')
            setUsers([])
            return
        }
        
        console.log('fetchUsers: Searching for users with query:', query)
        setLoading(true)
        try {
            const response = await searchUsers(query)
            console.log('fetchUsers: Response:', response)
            console.log('fetchUsers: Users found:', response.users?.length || 0)
            setUsers(response.users || [])
        } catch (err) {
            console.error('Error fetching users:', err)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }, [query])

    useEffect(() => {
        fetchStories()
    }, [fetchStories])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    // Refetch when page becomes visible (user returns from reading)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('SearchPage visible again, refetching...');
                fetchStories();
                fetchUsers();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchStories, fetchUsers]);

    const handleLengthChange = (value) => {
        setSelectedLengths(prev => 
            prev.includes(value) 
                ? prev.filter(v => v !== value)
                : [...prev, value]
        )
    }

    const handleUpdateChange = (value) => {
        if (value === 'anytime') {
            setSelectedUpdates(['anytime'])
        } else {
            setSelectedUpdates(prev => {
                const filtered = prev.filter(v => v !== 'anytime')
                return filtered.includes(value)
                    ? filtered.filter(v => v !== value)
                    : [...filtered, value]
            })
        }
    }

    const handleTagSelect = (tagName) => {
        setSelectedTags(prev => 
            prev.includes(tagName)
                ? prev.filter(t => t !== tagName)
                : [...prev, tagName]
        )
    }

    const handleTagInputChange = (e) => {
        const value = e.target.value
        setTagSearchInput(value)
        
        if (value.trim().length >= 1) {
            // Filter tags that match the input
            const filtered = tags.filter(tag => 
                tag.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5) // Show max 5 suggestions
            
            setFilteredSuggestions(filtered)
            setShowSuggestions(filtered.length > 0)
        } else {
            setFilteredSuggestions([])
            setShowSuggestions(false)
        }
    }

    const handleSuggestionClick = (tagName) => {
        handleTagSelect(tagName)
        setTagSearchInput('')
        setShowSuggestions(false)
        setFilteredSuggestions([])
    }

    const handleTagSearch = (e) => {
        e.preventDefault()
        const trimmedInput = tagSearchInput.trim()
        
        // Validate tag input
        if (!trimmedInput) {
            return
        }
        
        // Check if input is only numbers
        if (/^\d+$/.test(trimmedInput)) {
            console.warn('Tag name cannot be only numbers')
            return
        }
        
        // Check minimum length
        if (trimmedInput.length < 2) {
            console.warn('Tag name must be at least 2 characters')
            return
        }
        
        handleTagSelect(trimmedInput)
        setTagSearchInput('')
        setShowSuggestions(false)
        setFilteredSuggestions([])
    }

    const clearAllFilters = () => {
        setSelectedLengths([])
        setSelectedUpdates(['anytime'])
        setSelectedTags([])
    }

    const hasActiveFilters = selectedLengths.length > 0 || 
                            !selectedUpdates.includes('anytime') || 
                            selectedTags.length > 0

    return (
        <div className={styles.searchPage}>
            <Container fluid>
                <Row>
                    {/* Sidebar Filters */}
                    <Col md={3} lg={2} className={styles.sidebar}>
                        <div className={styles.filterSection}>
                            <h5 className={styles.filterTitle}>
                                {isAllStoriesQuery ? '"All Stories"' : query ? `"${query}"` : tagFilter ? `"${tagFilter}"` : '"All Stories"'}
                            </h5>
                            <p className={styles.resultCount}>{resultCount} results</p>

                            {hasActiveFilters && (
                                <button 
                                    onClick={clearAllFilters}
                                    className={styles.clearFiltersBtn}
                                >
                                    <i className="bi bi-x-circle"></i> Clear all filters
                                </button>
                            )}

                            {/* Active Tags */}
                            {selectedTags.length > 0 && (
                                <div className={styles.activeFilters}>
                                    <p className={styles.activeFiltersTitle}>Active tags:</p>
                                    <div className={styles.activeTagsList}>
                                        {selectedTags.map(tag => (
                                            <div key={tag} className={styles.activeTag}>
                                                <span>{tag}</span>
                                                <button 
                                                    onClick={() => handleTagSelect(tag)}
                                                    className={styles.removeTagBtn}
                                                >
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className={styles.tabs}>
                                <button 
                                    className={`${styles.tab} ${activeTab === 'stories' ? styles.active : ''}`}
                                    onClick={() => setActiveTab('stories')}
                                >
                                    Stories
                                </button>
                                <button 
                                    className={`${styles.tab} ${activeTab === 'profiles' ? styles.active : ''}`}
                                    onClick={() => setActiveTab('profiles')}
                                >
                                    Profiles
                                </button>
                            </div>

                            {/* Show filters only for Stories tab */}
                            {activeTab === 'stories' && (
                                <>
                            {/* Length Filter */}
                            <div className={styles.filterGroup}>
                                <h6 className={styles.filterGroupTitle}>Length</h6>
                                <p className={styles.filterSubtitle}>You can select multiple options</p>
                                
                                <Form.Check 
                                    type="checkbox"
                                    id="length-any"
                                    label="Any Length"
                                    checked={selectedLengths.length === 0}
                                    onChange={() => setSelectedLengths([])}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="length-1-10"
                                    label="1 - 10 Chapters"
                                    checked={selectedLengths.includes('1-10')}
                                    onChange={() => handleLengthChange('1-10')}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="length-10-20"
                                    label="10 - 20 Chapters"
                                    checked={selectedLengths.includes('10-20')}
                                    onChange={() => handleLengthChange('10-20')}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="length-20-50"
                                    label="20 - 50 Chapters"
                                    checked={selectedLengths.includes('20-50')}
                                    onChange={() => handleLengthChange('20-50')}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="length-50-plus"
                                    label="50 Chapters or more"
                                    checked={selectedLengths.includes('50+')}
                                    onChange={() => handleLengthChange('50+')}
                                    className={styles.filterCheckbox}
                                />
                            </div>

                            {/* Last Updated Filter */}
                            <div className={styles.filterGroup}>
                                <h6 className={styles.filterGroupTitle}>Last updated</h6>
                                <p className={styles.filterSubtitle}>You can select multiple options</p>
                                
                                <Form.Check 
                                    type="checkbox"
                                    id="update-anytime"
                                    label="Anytime"
                                    checked={selectedUpdates.includes('anytime')}
                                    onChange={() => handleUpdateChange('anytime')}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="update-today"
                                    label="Today"
                                    checked={selectedUpdates.includes('today')}
                                    onChange={() => handleUpdateChange('today')}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="update-week"
                                    label="This week"
                                    checked={selectedUpdates.includes('week')}
                                    onChange={() => handleUpdateChange('week')}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="update-month"
                                    label="This month"
                                    checked={selectedUpdates.includes('month')}
                                    onChange={() => handleUpdateChange('month')}
                                    className={styles.filterCheckbox}
                                />
                                <Form.Check 
                                    type="checkbox"
                                    id="update-year"
                                    label="This year"
                                    checked={selectedUpdates.includes('year')}
                                    onChange={() => handleUpdateChange('year')}
                                    className={styles.filterCheckbox}
                                />
                            </div>

                            {/* Tag Refinement */}
                            <div className={styles.filterGroup}>
                                <h6 className={styles.filterGroupTitle}>Refine by tag</h6>
                                
                                <div className={styles.tagCloud}>
                                    {tags.slice(0, 8).map(tag => (
                                        <button
                                            key={tag.id}
                                            className={`${styles.tagButton} ${selectedTags.includes(tag.name) ? styles.tagButtonActive : ''}`}
                                            onClick={() => handleTagSelect(tag.name)}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>

                                <Form onSubmit={handleTagSearch} className={styles.tagSearchForm}>
                                    <div className={styles.tagSearchWrapper}>
                                        <div className={styles.tagInputContainer}>
                                            <Form.Control
                                                type="text"
                                                placeholder="Add a tag to refine by"
                                                value={tagSearchInput}
                                                onChange={handleTagInputChange}
                                                onFocus={() => tagSearchInput && setShowSuggestions(filteredSuggestions.length > 0)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                className={styles.tagSearchInput}
                                            />
                                            {showSuggestions && filteredSuggestions.length > 0 && (
                                                <div className={styles.suggestionsList}>
                                                    {filteredSuggestions.map(tag => (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            className={styles.suggestionItem}
                                                            onClick={() => handleSuggestionClick(tag.name)}
                                                        >
                                                            <i className="bi bi-tag"></i>
                                                            <span>{tag.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            type="submit" 
                                            className={styles.tagSearchButton}
                                            disabled={!tagSearchInput.trim()}
                                        >
                                            <i className="bi bi-plus-lg"></i>
                                        </button>
                                    </div>
                                </Form>
                            </div>
                                </>
                            )}
                        </div>
                    </Col>

                    {/* Main Content */}
                    <Col md={9} lg={10} className={styles.mainContent}>
                        {loading ? (
                            <div className={styles.loadingContainer}>
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3">Loading {activeTab === 'profiles' ? 'users' : 'stories'}...</p>
                            </div>
                        ) : activeTab === 'profiles' ? (
                            // Profiles Tab Content
                            users.length > 0 ? (
                                <div className={styles.resultsContainer}>
                                    {users.map((user) => (
                                        <div key={user.id} className={styles.userItem}>
                                            <Link to={`/profile/${user.id}`} className={styles.userLink}>
                                                {user.avatar_url ? (
                                                    <img 
                                                        src={user.avatar_url} 
                                                        alt={user.username}
                                                        className={styles.userAvatar}
                                                    />
                                                ) : (
                                                    <div className={styles.userAvatarPlaceholder}>
                                                        <i className="bi bi-person-circle"></i>
                                                    </div>
                                                )}
                                            </Link>
                                            <div className={styles.userDetails}>
                                                <Link to={`/profile/${user.id}`} className={styles.userNameLink}>
                                                    <h5 className={styles.userName}>{user.username}</h5>
                                                </Link>
                                                {user.bio && (
                                                    <p className={styles.userBio}>{user.bio}</p>
                                                )}
                                                <p className={styles.userJoined}>
                                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <i className="bi bi-person-x"></i>
                                    <h4>No users found</h4>
                                    <p>Try a different search query</p>
                                </div>
                            )
                        ) : (
                            // Stories Tab Content
                            stories.length > 0 ? (
                            <>
                                <div className={styles.resultsContainer}>
                                    {stories
                                        .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                        .map((story) => (
                                    <div key={story.id} className={styles.storyItem}>
                                        <Link to={`/story/${story.id}`} className={styles.storyLink}>
                                            {story.cover_url && (
                                                <img 
                                                    src={story.cover_url} 
                                                    alt={story.title}
                                                    className={styles.storyCover}
                                                />
                                            )}
                                        </Link>
                                        <div className={styles.storyDetails}>
                                            <Link to={`/story/${story.id}`} className={styles.storyTitleLink}>
                                                <h5 className={styles.storyTitle}>{story.title}</h5>
                                            </Link>
                                            
                                            <div className={styles.storyBadges}>
                                                <Badge bg="success" className={styles.badge}>Complete</Badge>
                                                {story.tags && story.tags.slice(0, 3).map(tag => (
                                                    <Badge 
                                                        key={tag.id} 
                                                        bg="secondary" 
                                                        className={styles.badge}
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <div className={styles.storyStats}>
                                                <span className={styles.stat}>
                                                    <i className="bi bi-eye"></i> Reads: {story.read_count || 0}
                                                </span>
                                                <span className={styles.stat}>
                                                    <i className="bi bi-star"></i> Votes: {story.vote_count || 0}
                                                </span>
                                                <span className={styles.stat}>
                                                    <i className="bi bi-book"></i> Chapters: {story.chapter_count || 0}
                                                </span>
                                                <span className={styles.stat}>
                                                    <i className="bi bi-clock"></i> Time: &lt;5 mins
                                                </span>
                                            </div>

                                            <p className={styles.storyDescription}>
                                                {story.description || 'No description available'}
                                            </p>

                                            <div className={styles.storyAuthor}>
                                                by <Link to={`/profile/${story.user_id}`} className={styles.authorLink}>{story.author_name}</Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination */}
                            {stories.length > ITEMS_PER_PAGE && (
                                <div className="d-flex justify-content-center mt-4 mb-4">
                                    <Pagination>
                                        <Pagination.First 
                                            onClick={() => setCurrentPage(1)} 
                                            disabled={currentPage === 1}
                                        />
                                        <Pagination.Prev 
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                                            disabled={currentPage === 1}
                                        />
                                        
                                        {[...Array(Math.ceil(stories.length / ITEMS_PER_PAGE))].map((_, index) => {
                                            const pageNum = index + 1
                                            // Show first, last, current, and adjacent pages
                                            const totalPages = Math.ceil(stories.length / ITEMS_PER_PAGE)
                                            if (
                                                pageNum === 1 || 
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <Pagination.Item
                                                        key={pageNum}
                                                        active={pageNum === currentPage}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Pagination.Item>
                                                )
                                            } else if (
                                                pageNum === currentPage - 2 || 
                                                pageNum === currentPage + 2
                                            ) {
                                                return <Pagination.Ellipsis key={pageNum} disabled />
                                            }
                                            return null
                                        })}
                                        
                                        <Pagination.Next 
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(stories.length / ITEMS_PER_PAGE), prev + 1))} 
                                            disabled={currentPage === Math.ceil(stories.length / ITEMS_PER_PAGE)}
                                        />
                                        <Pagination.Last 
                                            onClick={() => setCurrentPage(Math.ceil(stories.length / ITEMS_PER_PAGE))} 
                                            disabled={currentPage === Math.ceil(stories.length / ITEMS_PER_PAGE)}
                                        />
                                    </Pagination>
                                </div>
                            )}
                        </>
                        ) : (
                            <div className={styles.emptyState}>
                                <i className="bi bi-search"></i>
                                <h4>No stories found</h4>
                                <p>Try adjusting your filters or search query</p>
                            </div>
                        )
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default SearchPage
