import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useParams, Link } from 'react-router';
import { getStoryById, getChaptersByStoryId, followUser, unfollowUser, getCommentsByStoryId } from '../../services/api';

const StoryDetailPage = () => {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        fetchStoryDetails();
    }, [id]);

    const fetchStoryDetails = async () => {
        try {
            setLoading(true);
            const [storyResponse, chaptersResponse, commentsResponse] = await Promise.all([
                getStoryById(id),
                getChaptersByStoryId(id),
                getCommentsByStoryId(id)
            ]);
            
            setStory(storyResponse.story);
            setChapters(chaptersResponse.chapters || []);
            setComments(commentsResponse.data || []);
        } catch (err) {
            setError('Failed to load story details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        try {
            if (following) {
                await unfollowUser(story.user_id);
                setFollowing(false);
            } else {
                await followUser(story.user_id);
                setFollowing(true);
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5">
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </Container>
        );
    }

    if (error || !story) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error || 'Story not found'}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row>
                <Col lg={8}>
                    {/* Story Header */}
                    <Card className="mb-4">
                        <Card.Body>
                            <div className="d-flex">
                                <div className="me-4">
                                    <img 
                                        src={story.cover_url || '/book-placeholder.png'} 
                                        alt={story.title}
                                        style={{ width: '150px', height: '200px', objectFit: 'cover' }}
                                        className="rounded"
                                    />
                                </div>
                                <div className="flex-grow-1">
                                    <h1 className="mb-2">{story.title}</h1>
                                    <p className="text-muted mb-2">
                                        by <Link to={`/user/${story.user_id}`} style={{ textDecoration: 'none' }}>
                                            <strong>{story.author_name || story.username}</strong>
                                        </Link>
                                    </p>
                                    
                                    {/* Tags */}
                                    <div className="mb-3">
                                        {story.tags && story.tags.map(tag => (
                                            <Badge key={tag.id} bg="secondary" className="me-1">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                    
                                    {/* Description */}
                                    <p className="mb-3">{story.description}</p>
                                    
                                    {/* Stats */}
                                    <div className="d-flex gap-3 mb-3 text-muted">
                                        <span><i className="bi bi-book me-1"></i>{chapters.length} chapters</span>
                                        <span><i className="bi bi-eye me-1"></i>{story.reads || 0} reads</span>
                                        <span><i className="bi bi-heart me-1"></i>{story.votes || 0} votes</span>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="d-flex gap-2">
                                        {chapters.length > 0 && (
                                            <Button 
                                                as={Link} 
                                                to={`/read/${chapters[0].id}`}
                                                variant="primary"
                                                size="lg"
                                            >
                                                <i className="bi bi-play-fill me-1"></i>
                                                Start Reading
                                            </Button>
                                        )}
                                        
                                        <Button 
                                            variant={following ? "success" : "outline-primary"}
                                            onClick={handleFollowToggle}
                                        >
                                            <i className={`bi ${following ? 'bi-check' : 'bi-plus'} me-1`}></i>
                                            {following ? 'Following' : 'Follow'}
                                        </Button>
                                        
                                        <Button variant="outline-secondary">
                                            <i className="bi bi-heart me-1"></i>
                                            Add to Favorites
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                    
                    {/* Chapters List */}
                    <Card>
                        <Card.Header>
                            <h4 className="mb-0">Chapters ({chapters.length})</h4>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <ListGroup variant="flush">
                                {chapters.map((chapter, index) => (
                                    <ListGroup.Item 
                                        key={chapter.id}
                                        as={Link}
                                        to={`/read/${chapter.id}`}
                                        className="d-flex justify-content-between align-items-center text-decoration-none"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div>
                                            <strong>Chapter {index + 1}: {chapter.title}</strong>
                                            {!chapter.is_published && (
                                                <Badge bg="warning" className="ms-2">Draft</Badge>
                                            )}
                                        </div>
                                        <small className="text-muted">
                                            {new Date(chapter.created_at).toLocaleDateString()}
                                        </small>
                                    </ListGroup.Item>
                                ))}
                                {chapters.length === 0 && (
                                    <ListGroup.Item className="text-center text-muted py-4">
                                        No chapters available yet.
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                    
                    {/* Comments Section */}
                    <Card className="mt-4">
                        <Card.Header>
                            <h4 className="mb-0">Recent Comments ({comments.length})</h4>
                        </Card.Header>
                        <Card.Body>
                            {comments.length > 0 ? (
                                <div>
                                    {comments.map(comment => (
                                        <div key={comment.id} className="mb-3 pb-3 border-bottom">
                                            <div className="d-flex align-items-start">
                                                <img 
                                                    src={comment.avatar_url || '/default-avatar.png'} 
                                                    alt={comment.username}
                                                    className="rounded-circle me-3"
                                                    style={{ width: '40px', height: '40px' }}
                                                />
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                        <div>
                                                            <strong>{comment.username}</strong>
                                                            {comment.chapter_title && (
                                                                <span className="text-muted ms-2">
                                                                    commented on{' '}
                                                                    <Link 
                                                                        to={`/read/${comment.chapter_id}`}
                                                                        className="text-decoration-none"
                                                                    >
                                                                        Chapter {comment.chapter_order}: {comment.chapter_title}
                                                                    </Link>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <small className="text-muted">
                                                            {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                                                        </small>
                                                    </div>
                                                    <p className="mb-0">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted mb-0">
                                    No comments yet. Be the first to comment!
                                </p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={4}>
                    {/* Author Info */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">About the Author</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <img 
                                    src={story.author_avatar || '/default-avatar.png'} 
                                    alt={story.author_name || story.username}
                                    className="rounded-circle me-3"
                                    style={{ width: '50px', height: '50px' }}
                                />
                                <div>
                                    <Link to={`/user/${story.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h6 className="mb-0">{story.author_name || story.username}</h6>
                                    </Link>
                                    <small className="text-muted">Author</small>
                                </div>
                            </div>
                            {story.author_bio && (
                                <p className="mb-0">{story.author_bio}</p>
                            )}
                        </Card.Body>
                    </Card>
                    
                    {/* More Stories by Author */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">More by this Author</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted">
                                Discover more stories by {story.author_name || story.username}
                            </p>
                            <Link to={`/user/${story.user_id}`}>
                                <Button variant="outline-primary" size="sm" className="w-100">
                                    View All Stories
                                </Button>
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StoryDetailPage;