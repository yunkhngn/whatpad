import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { getReadingHistory } from '../../services/api';
import { useNavigate } from 'react-router';
import './ContinueReading.css';

const ContinueReading = () => {
    const [readingHistory, setReadingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Check if user is logged in
    const isLoggedIn = () => {
        return !!localStorage.getItem('authToken');
    };

    useEffect(() => {
        const fetchReadingHistory = async () => {
            if (!isLoggedIn()) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await getReadingHistory();
                // Limit to 6 most recent items
                setReadingHistory(response.data?.slice(0, 6) || []);
                setError('');
            } catch (err) {
                console.error('Error fetching reading history:', err);
                setError('Failed to load reading history');
            } finally {
                setLoading(false);
            }
        };

        fetchReadingHistory();
    }, []);

    // Don't show section if not logged in or no history
    if (!isLoggedIn() || (!loading && readingHistory.length === 0)) {
        return null;
    }

    if (loading) {
        return (
            <div className="continue-reading-section">
                <Container>
                    <h2 className="section-title">Continue Reading</h2>
                    <div className="text-center my-4">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div className="continue-reading-section">
                <Container>
                    <h2 className="section-title">Continue Reading</h2>
                    <Alert variant="warning">{error}</Alert>
                </Container>
            </div>
        );
    }

    const handleCardClick = (item) => {
        navigate(`/read/${item.last_chapter_id}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="continue-reading-section">
            <Container>
                <div className="section-header">
                    <h2 className="section-title">Continue Reading</h2>
                </div>
                <Row className="g-3">
                    {readingHistory.map((item) => (
                        <Col key={item.id} xs={12} sm={6} md={4} lg={2}>
                            <Card 
                                className="continue-reading-card h-100" 
                                onClick={() => handleCardClick(item)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="card-image-wrapper">
                                    <img
                                        src={item.story_cover_url || '/assests/icons/default-cover.png'}
                                        alt={item.story_title}
                                        className="card-img-top"
                                        style={{ height: '200px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/assests/icons/default-cover.png';
                                        }}
                                    />
                                    <div className="reading-overlay">
                                        <Badge bg="primary" className="continue-badge">
                                            Continue
                                        </Badge>
                                    </div>
                                </div>
                                <Card.Body className="p-2">
                                    <Card.Title className="story-title text-truncate" title={item.story_title}>
                                        {item.story_title}
                                    </Card.Title>
                                    <Card.Text className="chapter-title text-muted text-truncate small" title={item.chapter_title}>
                                        {item.chapter_title}
                                    </Card.Text>
                                    <div className="text-muted small">
                                        {formatDate(item.updated_at)}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </div>
    );
};

export default ContinueReading;
