"use client";
import { ListGroup, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import { createChapter } from "../../../services/api";
import ChapterListItem from "./ChapterListItem";
import { toast } from "sonner";
import Loading from "../../../components/Loading";
import { useState } from "react";

const StoryChaptersTab = ({
  storyId,
  chapters,
  onDeleteChapter,
  onChapterUpdate,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddChapter = async () => {
    try {
      setIsLoading(true);
      const response = await createChapter(storyId, {
        title: "Untitled",
        content: "Empty",
      });
      const newChapter = response.data;

      // Navigate to create chapter page
      navigate(`/work/story/${storyId}/chapter/${newChapter.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Cannot create new chapter yet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!chapters || chapters.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <i
            className="bi bi-file-earmark-text"
            style={{ fontSize: "2rem" }}
          ></i>
          <p className="mt-3 text-muted">No chapters written yet.</p>
          <Button variant="primary" onClick={handleAddChapter}>
            <i className="bi bi-plus me-1"></i>
            Add First Chapter
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-3">
        <Button variant="primary" onClick={handleAddChapter}>
          <i className="bi bi-plus me-1"></i>
          Add Chapter
        </Button>
      </div>

      <ListGroup>
        {chapters.map((chapter, index) => (
          <ChapterListItem
            storyId={storyId}
            key={chapter.id}
            chapter={chapter}
            chapterOrder={index + 1}
            onDelete={onDeleteChapter}
            onUpdate={onChapterUpdate}
          />
        ))}
      </ListGroup>
    </>
  );
};

export default StoryChaptersTab;
