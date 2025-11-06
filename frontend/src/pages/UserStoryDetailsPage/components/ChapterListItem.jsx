"use client";

import { useState } from "react";
import { ListGroup, Badge, Modal, Button } from "react-bootstrap";
import { deleteChapter } from "../../../services/api";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const ChapterListItem = ({ chapter, chapterOrder, onDelete, storyId }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
            variant="outline-danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="bi bi-trash"></i>
          </Button>
        </div>
      </ListGroup.Item>

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
