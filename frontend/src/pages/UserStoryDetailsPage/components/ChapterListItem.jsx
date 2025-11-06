"use client";

import { useState } from "react";
import { ListGroup, Badge, Modal, Button } from "react-bootstrap";
import { deleteChapter, toggleChapterPublish } from "../../../services/api";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const ChapterListItem = ({ chapter, chapterOrder, onDelete, onUpdate, storyId }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteChapter(storyId, chapter.id);
      toast.success("Chapter deleted successfully");
      setShowDeleteModal(false);
      onDelete(chapter.id);
    } catch (err) {
      console.error("Error deleting chapter:", err);
      toast.error("Failed to delete chapter");
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async () => {
    const newPublishStatus = !chapter.is_published;
    const action = newPublishStatus ? "publish" : "unpublish";
    
    try {
      setPublishing(true);
      await toggleChapterPublish(storyId, chapter.id, newPublishStatus);
      toast.success(`Chapter ${action}ed successfully${newPublishStatus ? ". Story will be published too." : ""}`);
      setShowPublishModal(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(`Error ${action}ing chapter:`, err);
      toast.error(`Failed to ${action} chapter`);
    } finally {
      setPublishing(false);
      setShowPublishModal(false);
    }
  };

  const handleEdit = () => {
    navigate(`/work/story/${storyId}/chapter/${chapter.id}`);
  };

  return (
    <>
      <ListGroup.Item className="d-flex justify-content-between align-items-center p-3">
        <div
          className="flex-grow-1"
          style={{ cursor: "pointer" }}
          onClick={handleEdit}
        >
          <div className="mb-1">
            <strong>
              Chapter {chapterOrder}: {chapter.title}
            </strong>
            {chapter.is_published ? (
              <Badge bg="success" className="ms-2">
                Published
              </Badge>
            ) : (
              <Badge bg="warning" className="ms-2">
                Draft
              </Badge>
            )}
          </div>
          <small className="text-muted">
            Updated: {new Date(chapter.updated_at).toLocaleDateString()}
          </small>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant={chapter.is_published ? "outline-warning" : "outline-success"}
            size="sm"
            onClick={() => setShowPublishModal(true)}
          >
            <i className={`bi ${chapter.is_published ? "bi-arrow-counterclockwise" : "bi-check-circle"}`}></i>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="bi bi-trash"></i>
          </Button>
        </div>
      </ListGroup.Item>

      {/* Publish Confirmation Modal */}
      <Modal
        show={showPublishModal}
        onHide={() => setShowPublishModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{chapter.is_published ? "Unpublish" : "Publish"} Chapter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {chapter.is_published ? (
            <>
              Are you sure you want to unpublish "Chapter {chapterOrder}: {chapter.title}"?
              <br /><br />
              <strong>This chapter will be hidden from other users.</strong>
            </>
          ) : (
            <>
              Are you sure you want to publish "Chapter {chapterOrder}: {chapter.title}"?
              <br /><br />
              <strong>This chapter and the story will be visible to other users.</strong>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPublishModal(false)}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button 
            variant={chapter.is_published ? "warning" : "success"} 
            onClick={handlePublish} 
            disabled={publishing}
          >
            {publishing ? "Processing..." : (chapter.is_published ? "Unpublish" : "Publish")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Chapter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "Chapter {chapterOrder}:{" "}
          {chapter.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ChapterListItem;
