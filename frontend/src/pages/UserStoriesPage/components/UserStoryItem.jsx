"use client";

import { useState } from "react";
import { ListGroup, Modal, Button, Badge } from "react-bootstrap";
import { toast } from "sonner";
import { deleteStory } from "../../../services/api";
import Loading from "../../../components/Loading";
import BookCoverPlaceHolder from "../../../assests/images/book-cover-placeholder.png";

const UserStoryItem = ({ story, onView, onRefresh }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setDeleting(true);
      await deleteStory(story.id);
      toast.success("Story deleted successfully");
      setShowDeleteModal(false);
      onRefresh();
    } catch (err) {
      console.error("Error deleting story:", err);
      toast.error("Failed to delete story");
    } finally {
      setIsLoading(false);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      {isLoading && <Loading />}

      <ListGroup.Item
        className="d-flex justify-content-between align-items-center p-3"
        style={{ height: "160px" }}
      >
        <div
          className="flex-grow-1 d-flex align-items-center h-100"
          style={{ cursor: "pointer" }}
          onClick={() => onView(story.id)}
        >
          {/* Story Cover */}
          <img
            src={story.cover_url || BookCoverPlaceHolder}
            alt={story.title}
            style={{
              width: "80px",
              height: "100%",
              objectFit: "cover",
              marginRight: "26px",
              borderRadius: "4px",
            }}
          />

          {/* Story Info */}
          <div className="flex-grow-1">
            <div className="mb-1">
              <strong style={{ fontSize: "1.1rem" }}>{story.title}</strong>
              {!story.is_published && (
                <Badge bg="warning" className="ms-2">
                  Draft
                </Badge>
              )}
              {story.is_published && (
                <Badge bg="success" className="ms-2">
                  Published
                </Badge>
              )}
            </div>
            <p className="mb-1 text-muted" style={{ fontSize: "0.9rem" }}>
              {story.description
                ? story.description.substring(0, 100) + "..."
                : "No description"}
            </p>
            <div
              className="d-flex gap-3"
              style={{ fontSize: "0.85rem", color: "#6c757d" }}
            >
              <span>
                <i className="bi bi-book me-1"></i>
                {story.chapter_count || 0} chapters
              </span>
              <span>
                <i className="bi bi-eye me-1"></i>
                {story.reads || 0} reads
              </span>
              <span>
                <i className="bi bi-heart me-1"></i>
                {story.votes || 0} votes
              </span>
              <span>
                <i className="bi bi-calendar me-1"></i>
                Updated: {new Date(story.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="ms-3"
        >
          <i className="bi bi-trash"></i>
        </Button>
      </ListGroup.Item>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Story</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete story "{story.title}"? This action
          cannot be undone.
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

export default UserStoryItem;
