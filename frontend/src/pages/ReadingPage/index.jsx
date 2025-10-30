"use client"
import { useParams, useNavigate } from "react-router"
import { useState, useEffect } from "react"
import { getChapterById, getStoryById, getChaptersByStoryId, getStories, getCommentsByChapterId, createComment, checkVoteStatus, voteChapter, unvoteChapter } from "../../services/api"
import { Link } from "react-router"
import { Dropdown } from "react-bootstrap"
import styles from "./ReadingPage.module.css"

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
                        const voteStatus = await checkVoteStatus(chapterId)
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
                    const chaptersResponse = await getChaptersByStoryId(chapterResponse.chapter.story_id)
                    setChapters(chaptersResponse.chapters || [])

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
    }, [chapterId])

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

    const handleChapterChange = (newChapterId) => {
        navigate(`/read/${newChapterId}`)
    }

    const currentChapterIndex = chapters.findIndex(ch => ch.id === parseInt(chapterId))
    const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null
    const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null

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
                            onClick={() => navigate(`/story/${story?.id}`)}
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
                            onClick={() => {
                                if (handleAuthAction('add to library')) {
                                    // TODO: Implement add to library functionality
                                    console.log('Add to library')
                                }
                            }}
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
                    <div className={styles.shareSection}>
                        <button className={styles.shareButton}>
                            <i className="bi bi-share"></i> Share
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
                                            await createComment(chapterId, {
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
        </div>
    )
}

export default ReadingPage
