import React, { useState, useEffect, useCallback, useRef } from "react"
import { Container, Row, Col, Button, Alert, Spinner, Carousel, Badge } from "react-bootstrap"
import { getStories, getTags } from "../../services/api"
import styles from "./HomePage.module.css"
import GenreSection from "../../components/GenreSection"

const HomePage = () => {
    const [stories, setStories] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const genreScrollRef = useRef(null)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [tagsResponse, storiesResponse] = await Promise.all([
                getTags(),
                getStories({ page: 1, size: 50, sort: 'created_at', order: 'desc' })
            ])
            
            console.log('=== HOMEPAGE DATA DEBUG ===')
            console.log('Tags:', tagsResponse.tags)
            console.log('Stories:', storiesResponse.stories)
            console.log('First story tags:', storiesResponse.stories?.[0]?.tags)
            
            setTags(tagsResponse.tags || [])
            setStories(storiesResponse.stories || [])
            setError('')
        } catch (err) {
            console.error('Error fetching data:', err)
            setError('Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const groupStoriesByTag = () => {
        const grouped = []
        
        tags.forEach(tag => {
            const tagStories = stories.filter(story => 
                story.tags && story.tags.some(storyTag => storyTag.id === tag.id)
            )
            if (tagStories.length > 0) {
                grouped.push({
                    genre: tag.name,
                    tagId: tag.id,
                    stories: tagStories,
                    thumbnail: tagStories[0]?.cover_image || '/assests/icons/default-cover.png'
                })
            }
        })

        // Return max 3 genres for story sections
        return grouped.slice(0, 3)
    }

    const getGenreCardsForDisplay = () => {
        // Count stories for each tag and sort by story count (descending)
        const genreCards = tags.map(tag => {
            const storyCount = stories.filter(story => 
                story.tags && story.tags.some(storyTag => storyTag.id === tag.id)
            ).length

            return {
                id: tag.id,
                name: tag.name,
                thumbnail: '/assests/icons/default-cover.png',
                storyCount: storyCount
            }
        })
        
        // Sort: genres with stories first (by count desc), then genres without stories
        return genreCards.sort((a, b) => {
            if (a.storyCount === 0 && b.storyCount === 0) return 0
            if (a.storyCount === 0) return 1
            if (b.storyCount === 0) return -1
            return b.storyCount - a.storyCount
        })
    }

    const scrollGenres = (direction) => {
        if (genreScrollRef.current) {
            const container = genreScrollRef.current
            const itemWidth = container.querySelector('.col-lg-custom')?.offsetWidth || 200
            const gap = 16 // 1rem gap

            let itemsPerView = 5 
            if (window.innerWidth <= 576) {
                itemsPerView = 2 
            } else if (window.innerWidth <= 768) {
                itemsPerView = 3 
            }
            
            const scrollAmount = (itemWidth + gap) * itemsPerView
            
            const newScrollLeft = direction === "left" 
                ? container.scrollLeft - scrollAmount 
                : container.scrollLeft + scrollAmount
            
            container.scrollTo({
                left: newScrollLeft,
                behavior: "smooth",
            })
        }
    }

    const storiesByGenre = groupStoriesByTag()
    const genreCards = getGenreCardsForDisplay()

    return (
        <Container fluid className={styles.homePage}>
            {/* Error Display */}
            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}

            {/* Loading Spinner */}
            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            )}

            {!loading && (
                <>
                    {/* Carousel Section */}
                    <div className={styles.carouselSection}>
                        <Container>
                            <Carousel className={styles.mainCarousel}>
                                <Carousel.Item>
                                    <div className={styles.carouselPlaceholder}>
                                        <div className={styles.carouselContent}>
                                            <Badge bg="primary" className={styles.carouselBadge}>Featured</Badge>
                                            <h2>Discover Amazing Stories</h2>
                                            <p>Your next favorite story is waiting for you</p>
                                            <Button variant="light" size="lg">Explore Now</Button>
                                        </div>
                                    </div>
                                </Carousel.Item>
                                <Carousel.Item>
                                    <div className={styles.carouselPlaceholder}>
                                        <div className={styles.carouselContent}>
                                            <Badge bg="success" className={styles.carouselBadge}>Trending</Badge>
                                            <h2>Popular This Week</h2>
                                            <p>See what everyone is reading</p>
                                            <Button variant="light" size="lg">View Trending</Button>
                                        </div>
                                    </div>
                                </Carousel.Item>
                                <Carousel.Item>
                                    <div className={styles.carouselPlaceholder}>
                                        <div className={styles.carouselContent}>
                                            <Badge bg="warning" className={styles.carouselBadge}>New</Badge>
                                            <h2>Fresh Stories Daily</h2>
                                            <p>New stories added every day</p>
                                            <Button variant="light" size="lg">Browse New</Button>
                                        </div>
                                    </div>
                                </Carousel.Item>
                            </Carousel>
                        </Container>
                    </div>
                    {/* Genres Row */}
                    <div className={styles.genresRow}>
                        <Container>
                            <div className={styles.genresHeader}>
                                <div className={styles.titleWrapper}>
                                    <a href="/genres" className={styles.sectionTitleLink}>
                                        <h2 className={styles.sectionTitle}>Browse genres</h2>
                                    </a>
                                    <a href="/genres" className={styles.viewAllLink}>
                                        View all
                                    </a>
                                </div>
                                <div className={styles.genreNavButtons}>
                                    <button 
                                        className={styles.navButton} 
                                        onClick={() => scrollGenres("left")} 
                                        aria-label="Previous"
                                    >
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                    <button 
                                        className={styles.navButton} 
                                        onClick={() => scrollGenres("right")} 
                                        aria-label="Next"
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                            <div className={styles.genreCardsContainer} ref={genreScrollRef}>
                                <Row className="g-3">
                                    {genreCards.map(genre => (
                                        <Col key={genre.id} xs={6} sm={4} md={3} lg className="col-lg-custom">
                                            <div className={styles.genreCard}>
                                                <div 
                                                    className={styles.genreThumbnail}
                                                    style={{
                                                        backgroundImage: `url(${genre.thumbnail})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center'
                                                    }}
                                                >
                                                    <div className={styles.genreOverlay}></div>
                                                    <div className={styles.genreInfo}>
                                                        <h3 className={styles.genreName}>{genre.name}</h3>
                                                        <p className={styles.genreCount}>{genre.storyCount} stories</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </Container>
                    </div>

                    {/* Latest Stories Section */}
                    <div className={styles.latestStoriesSection}>
                        <Container>
                            <div className={styles.genresHeader}>
                                <h2 className={styles.sectionTitle}>Latest Stories</h2>
                                <Button variant="link" className={styles.viewAllLink}>
                                    View all &gt;
                                </Button>
                            </div>
                            <GenreSection 
                                title="" 
                                stories={stories.slice(0, 10)} 
                                showTitle={false}
                            />
                        </Container>
                    </div>

                    {/* Genre Sections (Max 3) */}
                    <Container className={styles.genreSections}>
                        {storiesByGenre.map(({ genre, stories: genreStories }) => (
                            <GenreSection key={genre} title={genre} stories={genreStories} />
                        ))}

                        {storiesByGenre.length === 0 && !loading && (
                            <div className="text-center my-5">
                                <p className="text-muted">No stories available at the moment.</p>
                            </div>
                        )}
                    </Container>
                </>
            )}
        </Container>
    )
}

export default HomePage
