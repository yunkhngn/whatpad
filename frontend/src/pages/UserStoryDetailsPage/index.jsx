"use client";

import { useState, useEffect } from "react";
import { Container, Tab, Nav, Alert, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router";
import {
  getStoryById,
  getStoryChapters,
  getCurrentUser,
} from "../../services/api";
import StoryDetailHeader from "./components/StoryDetailHeader";
import StoryDetailsTab from "./components/StoryDetailsTab";
import StoryChaptersTab from "./components/StoryChaptersTab";

const UserStoryDetailPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
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
    <>
      <StoryDetailHeader title={story.title} />

      <Container className="my-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="pills" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="details">Story Details</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="chapters">Chapters</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="details">
              <StoryDetailsTab story={story} onUpdate={handleStoryUpdate} />
            </Tab.Pane>
            <Tab.Pane eventKey="chapters">
              <StoryChaptersTab
                storyId={storyId}
                chapters={chapters}
                onDeleteChapter={handleDeleteChapter}
                onChapterUpdate={handleStoryUpdate}
              />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </>
  );
};

export default UserStoryDetailPage;
