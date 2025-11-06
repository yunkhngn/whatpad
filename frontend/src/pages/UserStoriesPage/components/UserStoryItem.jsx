"use client";

import { useState } from "react";
import { ListGroup, Modal, Button, Badge } from "react-bootstrap";
import { toast } from "sonner";
import { deleteStory, toggleStoryPublish } from "../../../services/api";
import Loading from "../../../components/Loading";
import BookCoverPlaceHolder from "../../../assests/images/book-cover-placeholder.png";

const UserStoryItem = ({ story, onView, onRefresh }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
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

  const handlePublish = async () => {
    const isPublished = story.status === 'published';
    const newPublishStatus = !isPublished;
    const action = newPublishStatus ? "publish" : "unpublish";
    
    try {
      setIsLoading(true);
      setPublishing(true);
      await toggleStoryPublish(story.id, newPublishStatus);
      toast.success(`Story ${action}ed successfully. All chapters will be ${action}ed.`);
      setShowPublishModal(false);
      onRefresh();
    } catch (err) {
      console.error(`Error ${action}ing story:`, err);
      toast.error(`Failed to ${action} story`);
    } finally {
      setIsLoading(false);
      setPublishing(false);
      setShowPublishModal(false);
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
              {story.status !== 'published' && (
                <Badge bg="warning" className="ms-2">
                  Draft
                </Badge>
              )}
              {story.status === 'published' && (
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
                {story.read_count || 0} reads
              </span>
              <span>
                <i className="bi bi-heart me-1"></i>
                {story.vote_count || 0} votes
              </span>
              <span>
                <i className="bi bi-calendar me-1"></i>
                Updated: {new Date(story.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          <Button
            variant={story.status === 'published' ? "outline-warning" : "outline-success"}
            size="sm"
            onClick={() => setShowPublishModal(true)}
            className="ms-3"
          >
            <i className={`bi ${story.status === 'published' ? "bi-arrow-counterclockwise" : "bi-check-circle"}`}></i>
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
          <Modal.Title>{story.status === 'published' ? "Unpublish" : "Publish"} Story</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {story.status === 'published' ? (
            <>
              Are you sure you want to unpublish "{story.title}"? 
              <br /><br />
              <strong>All chapters will be unpublished and hidden from other users.</strong>
            </>
          ) : (
            <>
              Are you sure you want to publish "{story.title}"? 
              <br /><br />
              <strong>All chapters will be published and visible to other users.</strong>
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
            variant={story.status === 'published' ? "warning" : "success"} 
            onClick={handlePublish} 
            disabled={publishing}
          >
            {publishing ? "Processing..." : (story.status === 'published' ? "Unpublish" : "Publish")}
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
