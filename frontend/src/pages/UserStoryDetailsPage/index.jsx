"use client";

import { useState, useEffect } from "react";
import { Container, Tab, Nav, Alert, Spinner, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router";
import {
  getStoryById,
  getStoryChapters,
  getCurrentUser,
} from "../../services/api";
import StoryDetailsTab from "./components/StoryDetailsTab";
import StoryChaptersTab from "./components/StoryChaptersTab";

const UserStoryDetailPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chapters");
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, [storyId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user
      const userResponse = await getCurrentUser();
      setCurrentUser(userResponse.data || userResponse);

      // Get story and chapters
      const [storyResponse, chaptersResponse] = await Promise.all([
        getStoryById(storyId),
        getStoryChapters(storyId),
      ]);

      setStory(storyResponse.story);
      setChapters(chaptersResponse.chapters || []);
    } catch (err) {
      setError("Failed to load story details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/my-stories");
  };

  const handleDeleteChapter = (chapterId) => {
    setChapters(chapters.filter((c) => c.id !== chapterId));
  };

  const handleStoryUpdate = () => {
    fetchData();
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

  // Check if current user is the story author
  const isAuthor =
    currentUser?.id === story.user_id || currentUser?.id === story.author_id;

  if (!isAuthor) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          You don't have permission to edit this story.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <Button
        variant="outline-secondary"
        className="d-flex align-items-center mb-4"
        onClick={handleGoBack}
      >
        <i className="bi bi-chevron-left me-2" />
        Back to My Stories
      </Button>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="underline" className="mb-4">
          <Nav.Item>
            <Nav.Link className="fs-4 fw-bold text-dark" eventKey="chapters">
              Chapters
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className="fs-4 fw-bold text-dark" eventKey="details">
              Story Details
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="details">
            <StoryDetailsTab
              story={story}
              setStory={setStory}
              onUpdate={handleStoryUpdate}
            />
          </Tab.Pane>
          <Tab.Pane eventKey="chapters">
            <StoryChaptersTab
              storyId={storyId}
              chapters={chapters}
              onDeleteChapter={handleDeleteChapter}
            />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default UserStoryDetailPage;
