import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Alert,
  Spinner,
  Carousel,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router";
import { getStories, getTags, getReadingHistory } from "../../services/api";
import styles from "./HomePage.module.css";
import GenreSection from "../../components/GenreSection";
import ContinueReading from "../../components/ContinueReading";

const HomePage = () => {
  const [stories, setStories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [continueReading, setContinueReading] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const genreScrollRef = useRef(null);
  const navigate = useNavigate();

  // Check if user is logged in and listen for auth events
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("authToken");
      const isUserLoggedIn = !!token;
      setIsLoggedIn(isUserLoggedIn);
    };

    // Check initially
    checkLoginStatus();

    // Listen for logout events
    const handleLogout = () => {
      checkLoginStatus();
    };

    // Listen for login events
    const handleLogin = () => {
      checkLoginStatus();
    };

    window.addEventListener("userLogout", handleLogout);
    window.addEventListener("userLogin", handleLogin);

    // Cleanup
    return () => {
      window.removeEventListener("userLogout", handleLogout);
      window.removeEventListener("userLogin", handleLogin);
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tagsResponse, storiesResponse] = await Promise.all([
        getTags(),
        // Get most recently published/updated stories
        getStories({ page: 1, size: 50, sort: "updated_at", order: "desc" }),
      ]);

      setTags(tagsResponse.tags || []);
      setStories(storiesResponse.stories || []);
      setLastRefresh(new Date());
      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reading history for logged in users
  const fetchReadingHistory = useCallback(async () => {
    if (!isLoggedIn) {
      setContinueReading([]);
      return;
    }

    try {
      const response = await getReadingHistory();
      // Limit to 6 most recent
      const limitedData = (response.data || []).slice(0, 6);
      setContinueReading(limitedData);
    } catch (err) {
      // Silently fail - Continue Reading is optional
      // Just log the error for debugging
      console.error("Could not fetch reading history:", err.message);
      setContinueReading([]);

      // If it's a token issue, don't force logout
      // Let user continue using the site
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 minutes (1800000 milliseconds)
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing latest stories (30 min interval)...');
      fetchData();
    }, 30 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [fetchData]);

  // Fetch reading history when login status changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchReadingHistory();
    } else {
      setContinueReading([]);
    }
  }, [isLoggedIn, fetchReadingHistory]);

  // Refetch data when page becomes visible (user returns from reading)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible again, refetching stories...');
        fetchData();
        if (isLoggedIn) {
          fetchReadingHistory();
        }
      }
    };

    // Also listen for navigation back from reading page
    const handleStoryDataUpdated = () => {
      console.log('Story data updated, refetching homepage stories...');
      fetchData();
      if (isLoggedIn) {
        fetchReadingHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storyDataUpdated', handleStoryDataUpdated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storyDataUpdated', handleStoryDataUpdated);
    };
  }, [fetchData, fetchReadingHistory, isLoggedIn]);

  const groupStoriesByTag = () => {
    const grouped = [];

    tags.forEach((tag) => {
      const tagStories = stories.filter(
        (story) =>
          story.tags && story.tags.some((storyTag) => storyTag.id === tag.id)
      );
      if (tagStories.length > 0) {
        grouped.push({
          genre: tag.name,
          tagId: tag.id,
          stories: tagStories,
          thumbnail:
            tagStories[0]?.cover_image || "/assests/icons/default-cover.png",
        });
      }
    });

    // Return max 3 genres for story sections
    return grouped.slice(0, 3);
  };

  const getGenreCardsForDisplay = () => {
    // Get 5 stories for each tag
    const genreCards = tags.map((tag) => {
      const tagStories = stories.filter(
        (story) =>
          story.tags && story.tags.some((storyTag) => storyTag.id === tag.id)
      );

      return {
        id: tag.id,
        name: tag.name,
        stories: tagStories.slice(0, 5), // Get up to 5 stories
        storyCount: tagStories.length,
      };
    });

    // Sort: genres with stories first (by count desc), then genres without stories
    return genreCards.sort((a, b) => {
      if (a.storyCount === 0 && b.storyCount === 0) return 0;
      if (a.storyCount === 0) return 1;
      if (b.storyCount === 0) return -1;
      return b.storyCount - a.storyCount;
    });
  };

  const scrollGenres = (direction) => {
    if (genreScrollRef.current) {
      const container = genreScrollRef.current;
      const itemWidth = 116; // Fixed genre card width
      const gap = 12; // 0.75rem gap

      let itemsPerView = 8; // Show more items on desktop with smaller cards
      if (window.innerWidth <= 576) {
        itemsPerView = 3;
      } else if (window.innerWidth <= 768) {
        itemsPerView = 5;
      } else if (window.innerWidth <= 992) {
        itemsPerView = 6;
      }

      const scrollAmount = (itemWidth + gap) * itemsPerView;

      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const storiesByGenre = groupStoriesByTag();
  const genreCards = getGenreCardsForDisplay();
  const visibleGenreCards = genreCards.filter((genre) => genre.storyCount > 0);

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
          {/* Continue Reading Section - Only for logged in users */}
          {isLoggedIn && continueReading.length > 0 && (
            <ContinueReading stories={continueReading} />
          )}

          {/* Carousel Section */}
          <div className={styles.carouselSection}>
            <Container>
              <Carousel className={styles.mainCarousel}>
                <Carousel.Item>
                  <div className={styles.carouselPlaceholder}>
                    <div className={styles.carouselContent}>
                      <Badge bg="primary" className={styles.carouselBadge}>
                        Featured
                      </Badge>
                      <h2>Discover Amazing Stories</h2>
                      <p>Your next favorite story is waiting for you</p>
                      <Button variant="light" size="lg">
                        Explore Now
                      </Button>
                    </div>
                  </div>
                </Carousel.Item>
                <Carousel.Item>
                  <div className={styles.carouselPlaceholder}>
                    <div className={styles.carouselContent}>
                      <Badge bg="success" className={styles.carouselBadge}>
                        Trending
                      </Badge>
                      <h2>Popular This Week</h2>
                      <p>See what everyone is reading</p>
                      <Button variant="light" size="lg">
                        View Trending
                      </Button>
                    </div>
                  </div>
                </Carousel.Item>
                <Carousel.Item>
                  <div className={styles.carouselPlaceholder}>
                    <div className={styles.carouselContent}>
                      <Badge bg="warning" className={styles.carouselBadge}>
                        New
                      </Badge>
                      <h2>Fresh Stories Daily</h2>
                      <p>New stories added every day</p>
                      <Button variant="light" size="lg">
                        Browse New
                      </Button>
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
                {visibleGenreCards.length >= 5 && (
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
                )}
              </div>
              <div className={styles.genreCardsContainer} ref={genreScrollRef}>
                <Row className="g-3">
                  {genreCards
                    .filter((genre) => genre.storyCount > 0) // Only show genres with stories
                    .map((genre) => (
                    <Col
                      key={genre.id}
                      xs={6}
                      sm={4}
                      md={3}
                      lg
                      className="col-lg-custom"
                    >
                      <div 
                        className={styles.genreCard}
                        onClick={() => navigate(`/search?tag=${encodeURIComponent(genre.name)}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.genreThumbnailGrid}>
                          {/* Large thumbnail (1st story) */}
                          {genre.stories[0] && (
                            <div className={styles.largeThumbnail}>
                              <img
                                src={genre.stories[0].cover_url || "/assests/icons/default-cover.png"}
                                alt={genre.stories[0].title}
                                onError={(e) => {
                                  e.target.src = "/assests/icons/default-cover.png";
                                }}
                              />
                            </div>
                          )}
                          {/* Small thumbnails (stories 2-5) - only show if there are more than 1 story */}
                          {genre.stories.length > 1 && (
                            <div className={styles.smallThumbnailsGrid}>
                              {genre.stories.slice(1, 5).map((story, idx) => (
                                <div key={idx} className={styles.smallThumbnail}>
                                  <img
                                    src={story.cover_url || "/assests/icons/default-cover.png"}
                                    alt={story.title}
                                    onError={(e) => {
                                      e.target.src = "/assests/icons/default-cover.png";
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Genre tag at bottom right */}
                        <div className={styles.genreTag}>
                          {genre.name}
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
                <div>
                  <h2 className={styles.sectionTitle}>Latest Stories</h2>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {lastRefresh.toLocaleTimeString()}
                  </small>
                </div>
                <div className={styles.headerRightSection}>
                  <Button 
                    variant="link" 
                    className={styles.viewAllLink}
                    onClick={() => navigate('/search?q=%23allStories')}
                  >
                    View all &gt;
                  </Button>
                  {stories.length > 5 && (
                    <div className={styles.genreNavButtons}>
                      <button
                        className={styles.navButton}
                        onClick={() => {
                          const container = document.querySelector('.latestStoriesContainer .genre-scroll-container');
                          if (container) {
                            container.scrollBy({ left: -600, behavior: 'smooth' });
                          }
                        }}
                        aria-label="Previous"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <button
                        className={styles.navButton}
                        onClick={() => {
                          const container = document.querySelector('.latestStoriesContainer .genre-scroll-container');
                          if (container) {
                            container.scrollBy({ left: 600, behavior: 'smooth' });
                          }
                        }}
                        aria-label="Next"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="latestStoriesContainer">
                <GenreSection
                  title=""
                  stories={stories.slice(0, 10)}
                  showTitle={false}
                />
              </div>
            </Container>
          </div>

          {/* Genre Sections (Max 3) */}
          <Container className={styles.genreSections}>
            {storiesByGenre.map(({ genre, stories: genreStories }) => (
              <GenreSection key={genre} title={genre} stories={genreStories} />
            ))}

            {storiesByGenre.length === 0 && !loading && (
              <div className="text-center my-5">
                <p className="text-muted">
                  No stories available at the moment.
                </p>
              </div>
            )}
          </Container>
        </>
      )}
    </Container>
  );
};

export default HomePage;
