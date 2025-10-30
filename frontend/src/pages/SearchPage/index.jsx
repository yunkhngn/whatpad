import React, { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Form, Spinner, Badge } from "react-bootstrap"
import { useSearchParams, Link } from "react-router"
import { getStories, getTags } from "../../services/api"
import styles from "./SearchPage.module.css"

const SearchPage = () => {
    const [searchParams] = useSearchParams()
    const [stories, setStories] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [resultCount, setResultCount] = useState(0)
    
    // Filter states
    const [selectedLengths, setSelectedLengths] = useState([])
    const [selectedUpdates, setSelectedUpdates] = useState(['anytime'])
    const [selectedTags, setSelectedTags] = useState([])
    const [tagSearchInput, setTagSearchInput] = useState('')
    const [activeTab, setActiveTab] = useState('stories')

    const query = searchParams.get('q') || ''
    const tagFilter = searchParams.get('tag') || ''

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
            
            if (query) params.q = query
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
        } catch (err) {
            console.error('Error fetching stories:', err)
            setStories([])
        } finally {
            setLoading(false)
        }
    }, [query, tagFilter, selectedLengths, selectedUpdates, selectedTags])

    useEffect(() => {
        fetchStories()
    }, [fetchStories])

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

    const handleTagSearch = (e) => {
        e.preventDefault()
        if (tagSearchInput.trim()) {
            handleTagSelect(tagSearchInput.trim())
            setTagSearchInput('')
        }
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
                            <h5 className={styles.filterTitle}>"{query || 'All Stories'}"</h5>
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
                                        <Form.Control
                                            type="text"
                                            placeholder="Add a tag to refine by"
                                            value={tagSearchInput}
                                            onChange={(e) => setTagSearchInput(e.target.value)}
                                            className={styles.tagSearchInput}
                                        />
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
                        </div>
                    </Col>

                    {/* Main Content */}
                    <Col md={9} lg={10} className={styles.mainContent}>
                        {loading ? (
                            <div className={styles.loadingContainer}>
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3">Loading stories...</p>
                            </div>
                        ) : stories.length > 0 ? (
                            <div className={styles.resultsContainer}>
                                {stories.map((story) => (
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
                                                    <i className="bi bi-eye"></i> Reads: 0
                                                </span>
                                                <span className={styles.stat}>
                                                    <i className="bi bi-star"></i> Votes: 0
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
                                                by <Link to={`/user/${story.user_id}`}>{story.author_name}</Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <i className="bi bi-search"></i>
                                <h4>No stories found</h4>
                                <p>Try adjusting your filters or search query</p>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default SearchPage
