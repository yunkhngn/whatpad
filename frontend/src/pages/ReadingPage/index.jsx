"use client";
import { useParams, useNavigate, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  getChapterById,
  getStoryById,
  getStoryChapters,
  getStories,
  getCommentsByChapterId,
  createComment,
  checkVote,
  voteChapter,
  unvoteChapter,
  updateReadingProgress,
} from "../../services/api";
import { Dropdown } from "react-bootstrap";
import styles from "./ReadingPage.module.css";

const ReadingPage = () => {
    const { chapterId } = useParams()
    const navigate = useNavigate()
    const [chapter, setChapter] = useState(null)
    const [story, setStory] = useState(null)
    const [chapters, setChapters] = useState([])
    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [readProgress, setReadProgress] = useState(0)
    const [commentText, setCommentText] = useState("")
    const [comments, setComments] = useState([])
    const [hasVoted, setHasVoted] = useState(false)
    const [votesCount, setVotesCount] = useState(0)
    
    // Library modal state
    const [showLibraryModal, setShowLibraryModal] = useState(false)
    const [readingLists, setReadingLists] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [listsContainingStory, setListsContainingStory] = useState(new Set())
    const [readingListThumbnails, setReadingListThumbnails] = useState({})

    // Check if user is logged in
    const isLoggedIn = () => {
        return !!localStorage.getItem('authToken')
    }

    // Handle actions that require authentication
    const handleAuthAction = (action) => {
        if (!isLoggedIn()) {
            if (window.confirm('You need to login to perform this action. Go to login page?')) {
                navigate('/auth')
            }
            return false
        }
        return true
    }

    useEffect(() => {
        const fetchChapterAndStory = async () => {
            try {
                setLoading(true)
                // Fetch chapter
                const chapterResponse = await getChapterById(chapterId)
                setChapter(chapterResponse.chapter)
                setVotesCount(chapterResponse.chapter?.votes || 0)

                // Check if user has voted (only if logged in)
                if (isLoggedIn()) {
                    try {
                        const voteStatus = await checkVote(chapterId)
                        setHasVoted(voteStatus.hasVoted || false)
                    } catch (err) {
                        console.error('Error checking vote status:', err)
                        setHasVoted(false)
                    }
                }

                // Fetch story details
                if (chapterResponse.chapter?.story_id) {
                    const storyResponse = await getStoryById(chapterResponse.chapter.story_id)
                    setStory(storyResponse.story)

          // Fetch all chapters of this story
          const chaptersResponse = await getStoryChapters(
            chapterResponse.chapter.story_id
          );
          setChapters(chaptersResponse.chapters || []);

                    // Fetch recommendations (stories with same tags)
                    if (storyResponse.story?.tags?.length > 0) {
                        const tag = storyResponse.story.tags[0].name
                        const recsResponse = await getStories({ tag, size: 6 })
                        setRecommendations(recsResponse.stories?.filter(s => s.id !== storyResponse.story.id) || [])
                    }
                }

                // Fetch comments for this chapter
                try {
                    const commentsResponse = await getCommentsByChapterId(chapterId)
                    setComments(commentsResponse.data || [])
                } catch (err) {
                    console.error('Error fetching comments:', err)
                    setComments([])
                }

                // Update reading progress (only if logged in)
                if (isLoggedIn() && chapterResponse.chapter?.story_id) {
                    try {
                        await updateReadingProgress(chapterResponse.chapter.story_id, chapterId)
                        console.log('Reading progress updated')
                        
                        // After a short delay, refetch story to get updated read_count
                        setTimeout(async () => {
                            try {
                                const updatedStory = await getStoryById(chapterResponse.chapter.story_id)
                                setStory(updatedStory.story)
                                console.log('Story data refreshed with updated read count')
                            } catch (err) {
                                console.error('Error refreshing story data:', err)
                            }
                        }, 500) // 500ms delay to ensure backend has processed the read
                    } catch (err) {
                        console.error('Error updating reading progress:', err)
                    }
                }

                setError(null)
            } catch (err) {
                console.error('Error fetching chapter:', err)
                setError('Chapter not found')
            } finally {
                setLoading(false)
            }
        }

        if (chapterId) {
            fetchChapterAndStory()
        }
        
        // Cleanup: notify when leaving reading page
        return () => {
            if (story?.id) {
                console.log('Leaving reading page, dispatching update event...');
                window.dispatchEvent(new CustomEvent('storyDataUpdated', { detail: { storyId: story.id } }));
            }
        };
    }, [chapterId, story?.id])

    // Restore scroll position when chapter loads
    useEffect(() => {
        if (!loading && chapter) {
            const savedProgress = localStorage.getItem(`chapter_${chapterId}_scroll`)
            if (savedProgress) {
                const scrollPosition = parseFloat(savedProgress)
                // Wait for content to render
                setTimeout(() => {
                    const documentHeight = document.documentElement.scrollHeight
                    const windowHeight = window.innerHeight
                    const scrollTo = (scrollPosition / 100) * (documentHeight - windowHeight)
                    window.scrollTo(0, scrollTo)
                }, 100)
            }
        }
    }, [loading, chapter, chapterId])

    // Calculate reading progress based on scroll and save to localStorage
    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight
            const scrollTop = window.scrollY
            const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100
            const progress = Math.min(100, Math.max(0, scrollPercentage))
            setReadProgress(progress)
            
            // Save scroll progress to localStorage
            if (chapterId) {
                localStorage.setItem(`chapter_${chapterId}_scroll`, progress.toString())
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [chapterId])

    // Handle vote toggle
    const handleVoteToggle = async () => {
        if (!handleAuthAction('vote')) return

        try {
            if (hasVoted) {
                // Unvote
                await unvoteChapter(chapterId)
                setHasVoted(false)
                setVotesCount(prev => Math.max(0, prev - 1))
            } else {
                // Vote
                await voteChapter(chapterId)
                setHasVoted(true)
                setVotesCount(prev => prev + 1)
            }
        } catch (err) {
            console.error('Error toggling vote:', err)
            alert('Failed to update vote. Please try again.')
        }
    }

    // Fetch reading lists when modal opens
    useEffect(() => {
        const fetchReadingLists = async () => {
            if (!showLibraryModal || !story?.id) return
            
            try {
                const token = localStorage.getItem('authToken')
                if (!token) return

                // Decode token to get user ID
                const payload = JSON.parse(atob(token.split('.')[1]))
                const userId = payload.id || payload.userId || payload.sub

                const response = await fetch(`http://localhost:4000/users/${userId}/reading-lists`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setReadingLists(data || [])
                    
                    // Fetch thumbnails for each list
                    const thumbnailsMap = {}
                    for (const list of data || []) {
                        try {
                            const thumbResponse = await fetch(`http://localhost:4000/reading-lists/${list.id}/thumbnails`, {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            })
                            if (thumbResponse.ok) {
                                const thumbnails = await thumbResponse.json()
                                thumbnailsMap[list.id] = Array.isArray(thumbnails) ? thumbnails : []
                            } else {
                                thumbnailsMap[list.id] = []
                            }
                        } catch (err) {
                            console.error(`Error fetching thumbnails for list ${list.id}:`, err)
                            thumbnailsMap[list.id] = []
                        }
                    }
                    setReadingListThumbnails(thumbnailsMap)
                    
                    // Check which lists already contain this story
                    const listsWithStory = new Set()
                    for (const list of data || []) {
                        try {
                            const storiesResponse = await fetch(`http://localhost:4000/reading-lists/${list.id}/stories`, {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            })
                            if (storiesResponse.ok) {
                                const stories = await storiesResponse.json()
                                const hasStory = stories.some(s => s.id === parseInt(story.id))
                                if (hasStory) {
                                    listsWithStory.add(list.id)
                                }
                            }
                        } catch (err) {
                            console.error(`Error checking list ${list.id}:`, err)
                        }
                    }
                    setListsContainingStory(listsWithStory)
                }
            } catch (err) {
                console.error('Error fetching reading lists:', err)
            }
        }

        fetchReadingLists()
    }, [showLibraryModal, story?.id])

    // Handle add/remove from library (follow/unfollow story)
    const handleLibraryToggle = async () => {
        if (!handleAuthAction('add to library')) return
        setShowLibraryModal(true)
    }

    const handleAddToList = async (listId) => {
        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch(`http://localhost:4000/reading-lists/${listId}/stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    story_id: parseInt(story.id)
                })
            })

            if (response.ok) {
                setListsContainingStory(prev => new Set([...prev, listId]))
                alert('Story added to reading list!')
            } else {
                const error = await response.json()
                if (error.errorCode === 'ALREADY_ADDED') {
                    alert('Story is already in this list')
                } else {
                    alert('Failed to add story to list')
                }
            }
        } catch (err) {
            console.error('Error adding story to list:', err)
            alert('Unable to add story to list')
        }
    }

    const handleChapterChange = (newChapterId) => {
        navigate(`/read/${newChapterId}`)
    }

    const currentChapterIndex = chapters.findIndex(ch => ch.id === parseInt(chapterId))
    const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null
    const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null

    // Handle navigation back to story with updated read count
    const handleBackToStory = async () => {
        if (story?.id) {
            // Give backend time to process the read, then navigate
            try {
                // Refetch story to get updated read count
                const updatedStory = await getStoryById(story.id)
                // Store updated story data in sessionStorage for the story page to use
                sessionStorage.setItem('storyData', JSON.stringify(updatedStory.story))
                // Dispatch custom event to notify story page to refetch
                window.dispatchEvent(new CustomEvent('storyDataUpdated', { detail: { storyId: story.id } }))
            } catch (err) {
                console.error('Error fetching updated story:', err)
            }
            // Navigate to story page
            navigate(`/story/${story.id}`)
        }
    }

    if (loading) {
        return (
            <div className="container">
                <div className="row justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                    <div className="col-md-6 text-center">
                        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading chapter...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !chapter) {
        return (
            <div className="container">
                <div className="row justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                    <div className="col-md-6 text-center">
                        <div className="alert alert-warning" role="alert">
                            <h2 className="alert-heading">Chapter not found</h2>
                            <p>Sorry, we couldn't find the chapter you're looking for.</p>
                            <hr />
                            <button 
                                className="btn btn-primary btn-lg" 
                                onClick={() => navigate(-1)}
                            >
                                Back to Previous Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.readingPage}>
            {/* Sticky Reading Header */}
            <div className={styles.stickyHeader}>
                <div className="container">
                    <div className={styles.headerTop}>
                        <button 
                            className={styles.closeButton} 
                            onClick={handleBackToStory}
                            title="Back to story"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <h1 className={styles.storyTitle}>{story?.title}</h1>
                        {(story?.author_name || story?.username) && (
                            <span className={styles.authorInfo}>by {story.author_name || story.username}</span>
                        )}
                        <Dropdown className={styles.chapterDropdown}>
                            <Dropdown.Toggle variant="link" id="chapter-dropdown">
                                <i className="bi bi-chevron-down"></i>
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {chapters.map((ch) => (
                                    <Dropdown.Item
                                        key={ch.id}
                                        active={ch.id === parseInt(chapterId)}
                                        onClick={() => handleChapterChange(ch.id)}
                                    >
                                        {ch.chapter_number}. {ch.title}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${readProgress}%` }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="container">
                {/* Chapter Content */}
                <section className={styles.contentSection}>
                    <h2 className={styles.chapterTitle}>{chapter.title}</h2>
                    <div className={styles.chapterMeta}>
                        <span><i className="bi bi-eye"></i> {chapter.views || 0} reads</span>
                        <span><i className="bi bi-star"></i> {votesCount} votes</span>
                        <span><i className="bi bi-chat"></i> {chapter.comments_count || 0} comments</span>
                    </div>

                    <div className={styles.chapterContent}>
                        {chapter.content && chapter.content.split("\n\n").map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className={styles.navigation}>
                        {prevChapter ? (
                            <button 
                                className={`${styles.navButton} ${styles.prevButton}`}
                                onClick={() => handleChapterChange(prevChapter.id)}
                            >
                                <i className="bi bi-arrow-left me-2"></i> Previous Chapter
                            </button>
                        ) : (
                            <div></div>
                        )}
                        {nextChapter && (
                            <button 
                                className={`${styles.navButton} ${styles.nextButton}`}
                                onClick={() => handleChapterChange(nextChapter.id)}
                            >
                                Next Chapter <i className="bi bi-arrow-right ms-2"></i>
                            </button>
                        )}
                    </div>
                </section>

                {/* Action Section */}
                <section className={styles.actionSection}>
                    <div className={styles.actionButtons}>
                        <button 
                            className={styles.actionButton}
                            onClick={handleLibraryToggle}
                            title="Add to library"
                        >
                            <i className="bi bi-plus-lg"></i> Add to library
                        </button>
                        <button 
                            className={`${styles.actionButton} ${hasVoted ? styles.voted : ''}`}
                            onClick={handleVoteToggle}
                            title={hasVoted ? 'Click to unvote' : 'Click to vote'}
                        >
                            <i className={`bi ${hasVoted ? 'bi-star-fill' : 'bi-star'}`}></i> 
                            {hasVoted ? 'Voted' : 'Vote'}
                        </button>
                    </div>
                </section>

                {/* Comments Section */}
                <section className={styles.commentsSection}>
                    <h3 className={styles.sectionTitle}>
                        <i className="bi bi-chat-dots me-2"></i>
                        Comments
                    </h3>
                    
                    {/* Comment Input */}
                    <div className={styles.commentInputSection}>
                        <textarea
                            className={styles.commentInput}
                            placeholder={isLoggedIn() ? "Share your thoughts..." : "Login to comment"}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onFocus={(e) => {
                                if (!isLoggedIn()) {
                                    e.target.blur()
                                    if (window.confirm('You need to login to comment. Go to login page?')) {
                                        navigate('/auth')
                                    }
                                }
                            }}
                            rows="3"
                        />
                        <div className={styles.commentActions}>
                            <button 
                                className={styles.postCommentBtn}
                                onClick={async () => {
                                    if (!isLoggedIn()) {
                                        if (window.confirm('You need to login to comment. Go to login page?')) {
                                            navigate('/auth')
                                        }
                                        return
                                    }
                                    if (commentText.trim()) {
                                        try {
                                            // Post comment to backend
                                            await createComment({
                                                chapter_id: chapterId,
                                                content: commentText.trim()
                                            })
                                            
                                            // Clear input
                                            setCommentText("")
                                            
                                            // Refresh comments list
                                            const commentsResponse = await getCommentsByChapterId(chapterId)
                                            setComments(commentsResponse.data || [])
                                        } catch (err) {
                                            console.error('Error posting comment:', err)
                                            alert('Failed to post comment. Please try again.')
                                        }
                                    }
                                }}
                                disabled={!commentText.trim()}
                            >
                                <i className="bi bi-send me-1"></i>
                                Post Comment
                            </button>
                        </div>
                    </div>

                    {/* Comments List */}
                    {comments.length > 0 ? (
                        <div className={styles.commentsList}>
                            {comments.map((comment) => (
                                <div key={comment.id} className={styles.commentItem}>
                                    <div className={styles.commentHeader}>
                                        <img 
                                            src={comment.avatar_url || '/default-avatar.png'} 
                                            alt={comment.username}
                                            className={styles.commentAvatar}
                                        />
                                        <div className={styles.commentMeta}>
                                            <span className={styles.commentAuthor}>{comment.username}</span>
                                            <span className={styles.commentTime}>
                                                {new Date(comment.created_at).toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <p className={styles.commentText}>{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.commentPlaceholder}>
                            <p>No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
                </section>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <section className={styles.recommendationsSection}>
                        <h3 className={styles.sectionTitle}>Recommendations</h3>
                        <div className={styles.recommendationGrid}>
                            {recommendations.map((rec) => (
                                <Link 
                                    key={rec.id} 
                                    to={`/story/${rec.id}`}
                                    className={styles.recCard}
                                >
                                    {rec.cover_url && (
                                        <img 
                                            src={rec.cover_url} 
                                            alt={rec.title}
                                            className={styles.recCover}
                                        />
                                    )}
                                    <div className={styles.recInfo}>
                                        <h4 className={styles.recTitle}>{rec.title}</h4>
                                        <p className={styles.recAuthor}>by {rec.author_name}</p>
                                        <div className={styles.recStats}>
                                            <span><i className="bi bi-eye"></i> 0</span>
                                            <span><i className="bi bi-star"></i> 0</span>
                                            <span><i className="bi bi-chat"></i> 0</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Add to Library Modal */}
            {showLibraryModal && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Add to Library</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowLibraryModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Search Bar */}
                                <div className="mb-3">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0"
                                            placeholder="Search your reading lists..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Reading Lists */}
                                <div 
                                    className="list-group list-group-flush" 
                                    style={{
                                        maxHeight: '400px', 
                                        overflowY: readingLists.length > 5 ? 'auto' : 'visible'
                                    }}
                                >
                                    {readingLists.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="bi bi-bookmark text-muted" style={{fontSize: '48px'}}></i>
                                            <p className="text-muted mt-3">No reading lists yet</p>
                                            <p className="small text-muted">Create a reading list from your profile</p>
                                        </div>
                                    ) : (
                                        readingLists
                                            .filter(list => 
                                                list.name.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((list) => {
                                                const isAdded = listsContainingStory.has(list.id)
                                                const thumbnails = readingListThumbnails[list.id] || []
                                                const storyCount = list.story_count || 0
                                                
                                                return (
                                                    <div 
                                                        key={list.id} 
                                                        className="list-group-item d-flex justify-content-between align-items-center py-3"
                                                    >
                                                        <div className="d-flex align-items-center gap-3">
                                                            {/* Thumbnail Display */}
                                                            <div className="d-flex gap-1">
                                                                {storyCount >= 3 && thumbnails.length >= 3 ? (
                                                                    // Show first thumbnail + 2 smaller thumbnails on the side
                                                                    <>
                                                                        <img 
                                                                            src={thumbnails[0].cover_url || '/assests/icons/default-cover.png'} 
                                                                            alt="Story 1"
                                                                            className="rounded object-fit-cover"
                                                                            style={{width: '40px', height: '60px'}}
                                                                            onError={(e) => {
                                                                                e.target.onerror = null
                                                                                e.target.src = '/assests/icons/default-cover.png'
                                                                            }}
                                                                        />
                                                                        <div className="d-flex flex-column gap-1">
                                                                            <img 
                                                                                src={thumbnails[1].cover_url || '/assests/icons/default-cover.png'} 
                                                                                alt="Story 2"
                                                                                className="rounded object-fit-cover"
                                                                                style={{width: '20px', height: '28px'}}
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null
                                                                                    e.target.src = '/assests/icons/default-cover.png'
                                                                                }}
                                                                            />
                                                                            <img 
                                                                                src={thumbnails[2].cover_url || '/assests/icons/default-cover.png'} 
                                                                                alt="Story 3"
                                                                                className="rounded object-fit-cover"
                                                                                style={{width: '20px', height: '28px'}}
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null
                                                                                    e.target.src = '/assests/icons/default-cover.png'
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
                                                                        style={{width: '40px', height: '60px'}}
                                                                        onError={(e) => {
                                                                            e.target.onerror = null
                                                                            e.target.src = '/assests/icons/default-cover.png'
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    // Default placeholder
                                                                    <div 
                                                                        className="d-flex align-items-center justify-content-center rounded"
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '60px',
                                                                            backgroundColor: '#E8E8E8'
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-book text-secondary"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{list.name}</h6>
                                                                <small className="text-muted">{storyCount} {storyCount === 1 ? 'story' : 'stories'}</small>
                                                            </div>
                                                        </div>
                                                        {!isAdded ? (
                                                            <button 
                                                                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                                                style={{
                                                                    width: '36px', 
                                                                    height: '36px',
                                                                    border: '2px solid #FF6B00',
                                                                    backgroundColor: 'transparent',
                                                                    color: '#FF6B00'
                                                                }}
                                                                onClick={() => handleAddToList(list.id)}
                                                            >
                                                                <i className="bi bi-plus-lg"></i>
                                                            </button>
                                                        ) : (
                                                            <div className="d-flex align-items-center gap-2">
                                                                <i className="bi bi-check-circle-fill text-success" style={{fontSize: '24px'}}></i>
                                                                <small className="text-success fw-semibold">Added</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer border-0 bg-light">
                                <button 
                                    type="button" 
                                    className="btn btn-link text-decoration-none"
                                    onClick={() => {
                                        setShowLibraryModal(false)
                                        navigate('/profile')
                                    }}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Create New List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReadingPage
