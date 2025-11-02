"use client";

import { useState, useEffect } from "react";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router";
import { getCurrentUser, getStoriesByUserId } from "../../services/api";
import UserStoryList from "./components/UserStoryList";
import Loading from "../../components/Loading";

const UserStoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stories, setStories] = useState([]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      // Get current user
      const userResponse = await getCurrentUser();
      const user = userResponse.data || userResponse;

      // Fetch user's stories
      if (user.id) {
        const storiesResponse = await getStoriesByUserId(user.id);
        setStories(storiesResponse.stories || []);
      }
    } catch (err) {
      setError("Failed to load your stories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewStory = () => {
    navigate("/create-story");
  };

  const handleViewStory = (storyId) => {
    navigate(`/my-stories/story/${storyId}`);
  };

  const handleRefreshList = () => {
    fetchStories();
  };

  return (
    <Container className="mt-5">
      {loading && <Loading />}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Stories</h2>
        <Button variant="primary" onClick={handleNewStory}>
          <i className="bi bi-plus me-1"></i>
          New Story
        </Button>
      </div>

      {/* Stories List */}
      <UserStoryList
        stories={stories}
        onViewStory={handleViewStory}
        onRefresh={handleRefreshList}
      />
    </Container>
  );
};

export default UserStoryPage;
