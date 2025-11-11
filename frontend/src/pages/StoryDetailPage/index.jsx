import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
  ListGroup,
} from "react-bootstrap";
import { useParams, Link } from "react-router";
import {
  getStoryById,
  getStoryChapters,
  followStory,
  unfollowStory,
  checkIfFollowingStory,
  getCommentsByStoryId,
} from "../../services/api";

const StoryDetailPage = () => {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  
  // Library modal state
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [readingLists, setReadingLists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [listsContainingStory, setListsContainingStory] = useState(new Set());
  
  // Create Reading List modal state
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListPrivacy, setNewListPrivacy] = useState(true);

  // Fetch reading lists when modal opens
  useEffect(() => {
    const fetchReadingLists = async () => {
      if (!showLibraryModal) return;
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found');
          return;
        }

        // Decode token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id || payload.userId || payload.sub;

        console.log('Fetching reading lists for user:', userId);
        const response = await fetch(`http://localhost:4000/users/${userId}/reading-lists`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Reading lists received:', data);
          setReadingLists(data || []);
          
          // Check which lists already contain this story
          const listsWithStory = new Set();
          for (const list of data || []) {
            try {
              const storiesResponse = await fetch(`http://localhost:4000/reading-lists/${list.id}/stories`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              if (storiesResponse.ok) {
                const stories = await storiesResponse.json();
                const hasStory = stories.some(story => story.id === parseInt(id));
                if (hasStory) {
                  listsWithStory.add(list.id);
                }
              }
            } catch (err) {
              console.error(`Error checking list ${list.id}:`, err);
            }
          }
          setListsContainingStory(listsWithStory);
        } else {
          console.error('Failed to fetch reading lists:', response.status);
        }
      } catch (err) {
        console.error('Error fetching reading lists:', err);
      }
    };

    fetchReadingLists();
  }, [showLibraryModal, id]);

  useEffect(() => {
    const fetchStoryDetails = async () => {
      try {
        setLoading(true);
        
        // Check if we have updated story data in sessionStorage
        const cachedStoryData = sessionStorage.getItem('storyData');
        if (cachedStoryData) {
          const parsedStory = JSON.parse(cachedStoryData);
          if (parsedStory.id === parseInt(id)) {
            // Use cached data first for instant update
            setStory(parsedStory);
            // Clear the cache
            sessionStorage.removeItem('storyData');
          }
        }
        
        const [storyResponse, chaptersResponse, commentsResponse] =
          await Promise.all([
            getStoryById(id),
            getStoryChapters(id),
            getCommentsByStoryId(id),
          ]);

        setStory(storyResponse.story);
        setChapters(chaptersResponse.chapters || []);
        setComments(commentsResponse.data || []);
        
        // Check if the current user is following this story
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const followCheck = await checkIfFollowingStory(id);
            setFollowing(followCheck.isFollowing || false);
          }
        } catch (err) {
          console.log('Not logged in or error checking follow status');
        }
      } catch (err) {
        setError("Failed to load story details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryDetails();
    
    // Listen for story data updates (when returning from reading page)
    const handleStoryDataUpdated = (event) => {
      if (event.detail?.storyId === parseInt(id)) {
        console.log('Story data updated event received, refetching...');
        fetchStoryDetails();
      }
    };
    
    window.addEventListener('storyDataUpdated', handleStoryDataUpdated);
    
    // Refetch story when user returns to this page (from reading chapter)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is visible again, refetch story data
        fetchStoryDetails();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storyDataUpdated', handleStoryDataUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const handleFollowToggle = async () => {
    try {
      if (following) {
        await unfollowStory(id);
        setFollowing(false);
      } else {
        await followStory(id);
        setFollowing(true);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      setError("Failed to update follow status. Please try again.");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:4000/reading-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
          is_public: newListPrivacy
        })
      });

      if (response.ok) {
        const newList = await response.json();
        setReadingLists([...readingLists, newList]);
        setShowCreateListModal(false);
        setNewListName('');
        setNewListDescription('');
        setNewListPrivacy(true);
      } else {
        alert('Failed to create reading list');
      }
    } catch (err) {
      console.error('Error creating reading list:', err);
      alert('Unable to create reading list');
    }
  };

  const handleAddToList = async (listId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:4000/reading-lists/${listId}/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          story_id: parseInt(id)
        })
      });

      if (response.ok) {
        // Add this list to the set of lists containing the story
        setListsContainingStory(prev => new Set([...prev, listId]));
        alert('Story added to reading list!');
      } else {
        const error = await response.json();
        if (error.errorCode === 'ALREADY_ADDED') {
          alert('Story is already in this list');
        } else {
          alert('Failed to add story to list');
        }
      }
    } catch (err) {
      console.error('Error adding story to list:', err);
      alert('Unable to add story to list');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <Spinner animation="border">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error || !story) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error || "Story not found"}</Alert>
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
                    src={story.cover_url || "/book-placeholder.png"}
                    alt={story.title}
                    style={{
                      width: "150px",
                      height: "200px",
                      objectFit: "cover",
                    }}
                    className="rounded"
                  />
                </div>
                <div className="flex-grow-1">
                  <h1 className="mb-2">{story.title}</h1>
                  <p className="text-muted mb-2">
                    by <strong>{story.author_name || story.username}</strong>
                  </p>

                  {/* Tags */}
                  <div className="mb-3">
                    {story?.tags &&
                      story?.tags.map((tag) => (
                        <Badge key={tag?.id} bg="secondary" className="me-1">
                          {tag?.name}
                        </Badge>
                      ))}
                  </div>

                  {/* Description */}
                  <p className="mb-3">{story.description}</p>

                  {/* Stats */}
                  <div className="d-flex gap-3 mb-3 text-muted">
                    <span>
                      <i className="bi bi-book me-1"></i>
                      {chapters.length} chapters
                    </span>
                    <span>
                      <i className="bi bi-eye me-1"></i>
                      {story.read_count || 0} reads
                    </span>
                    <span>
                      <i className="bi bi-heart me-1"></i>
                      {story.vote_count || 0} votes
                    </span>
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
                      <i
                        className={`bi ${
                          following ? "bi-check" : "bi-plus"
                        } me-1`}
                      ></i>
                      {following ? "Following" : "Follow"}
                    </Button>

                    <Button variant="outline-secondary" onClick={() => setShowLibraryModal(true)}>
                      <i className="bi bi-book me-1"></i>
                      Add to Library
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
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <strong>
                        Chapter {index + 1}: {chapter.title}
                      </strong>
                      {!chapter.is_published && (
                        <Badge bg="warning" className="ms-2">
                          Draft
                        </Badge>
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
                  {comments.map((comment) => (
                    <div key={comment.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <img
                          src={comment.avatar_url || "/default-avatar.png"}
                          alt={comment.username}
                          className="rounded-circle me-3"
                          style={{ width: "40px", height: "40px" }}
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <strong>{comment.username}</strong>
                              {comment.chapter_title && (
                                <span className="text-muted ms-2">
                                  commented on{" "}
                                  <Link
                                    to={`/read/${comment.chapter_id}`}
                                    className="text-decoration-none"
                                  >
                                    Chapter {comment.chapter_order}:{" "}
                                    {comment.chapter_title}
                                  </Link>
                                </span>
                              )}
                            </div>
                            <small className="text-muted">
                              {new Date(comment.created_at).toLocaleDateString(
                                "vi-VN"
                              )}
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
                  src={story.author_avatar || "/default-avatar.png"}
                  alt={story.author_name || story.username}
                  className="rounded-circle me-3"
                  style={{ width: "50px", height: "50px" }}
                />
                <div>
                  <h6 className="mb-0">
                    {story.author_name || story.username}
                  </h6>
                  <small className="text-muted">Author</small>
                </div>
              </div>
              {story.author_bio && <p className="mb-0">{story.author_bio}</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                        const isAdded = listsContainingStory.has(list.id);
                        return (
                          <div 
                            key={list.id} 
                            className="list-group-item d-flex justify-content-between align-items-center py-3"
                          >
                            <div className="d-flex align-items-center gap-3">
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
                              <div>
                                <h6 className="mb-0">{list.name}</h6>
                                <small className="text-muted">{list.story_count || 0} stories</small>
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
                        );
                      })
                  )}
                </div>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button 
                  type="button" 
                  className="btn btn-link text-decoration-none"
                  onClick={() => {
                    setShowLibraryModal(false);
                    setShowCreateListModal(true);
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

      {/* Create Reading List Modal */}
      {showCreateListModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Create a new reading list</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCreateListModal(false);
                    setNewListName('');
                    setNewListDescription('');
                    setNewListPrivacy(true);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">List Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="hello"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description (optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="What's this list about?"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Privacy</label>
                  <select 
                    className="form-select"
                    value={newListPrivacy ? 'public' : 'private'}
                    onChange={(e) => setNewListPrivacy(e.target.value === 'public')}
                  >
                    <option value="public">Public - Anyone can see this list</option>
                    <option value="private">Private - Only you can see this list</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => {
                    setShowCreateListModal(false);
                    setNewListName('');
                    setNewListDescription('');
                    setNewListPrivacy(true);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn rounded-pill px-4"
                  style={{backgroundColor: '#FFC107', color: 'white'}}
                  onClick={handleCreateList}
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default StoryDetailPage;
