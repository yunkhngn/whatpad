"use client";
import { ListGroup, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import ChapterListItem from "./ChapterListItem";

const StoryChaptersTab = ({
  storyId,
  chapters,
  onDeleteChapter,
  onChapterUpdate,
}) => {
  const navigate = useNavigate();

  const handleAddChapter = () => {
    // Navigate to create chapter page
    navigate(`/`);
    // navigate(`/stories/${storyId}/chapters/new`);
  };

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
