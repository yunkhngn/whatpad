import React, { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Button, Alert, Spinner, Carousel, Badge } from "react-bootstrap"
import { storiesAPI, tagsAPI } from "../../services/api"
import styles from "./HomePage.module.css"
import GenreSection from "../../components/GenreSection"

const HomePage = () => {
    const [stories, setStories] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [tagsResponse, storiesResponse] = await Promise.all([
                tagsAPI.getAll(),
                storiesAPI.getAll({ page: 1, size: 50, sort: 'created_at', order: 'desc' })
            ])
            
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
        // Just return first 5 tags as genre cards
        console.log('Tags:', tags);
        
        const genreCards = tags.slice(0, 5).map(tag => ({
            id: tag.id,
            name: tag.name,
            thumbnail: '/assests/icons/default-cover.png', // Use placeholder for now
            storyCount: 0 // We'll update this later if needed
        }));
        
        console.log('Genre cards:', genreCards);
        return genreCards;
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
                                <h2 className={styles.sectionTitle}>Browse genres</h2>
                                <Button variant="link" className={styles.viewAllLink}>
                                    View all &gt;
                                </Button>
                            </div>
                            <div className={styles.genreCardsContainer}>
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
