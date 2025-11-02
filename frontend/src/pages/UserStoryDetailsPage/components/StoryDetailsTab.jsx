"use client";

import { useState } from "react";
import { Card, Button, Modal, Form } from "react-bootstrap";
import { updateStory, uploadImage } from "../../../services/api";
import { toast } from "sonner";

const StoryDetailsTab = ({ story, onUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    title: story?.title || "",
    description: story?.description || "",
    cover_url: story?.cover_url || "",
  });
  const [previewUrl, setPreviewUrl] = useState(story?.cover_url || null);
  const [saving, setSaving] = useState(false);

  const handleEditClick = () => {
    setEditData({
      title: story?.title || "",
      description: story?.description || "",
      cover_url: story?.cover_url || "",
    });
    setPreviewUrl(story?.cover_url || null);
    setShowEditModal(true);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setEditData({ ...editData, cover_file: file });
    }
  };

  const handleSave = async () => {
    if (!editData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setSaving(true);
      let imageUrl = editData.cover_url;

      // Upload new cover if provided
      if (editData.cover_file) {
        const uploadResponse = await uploadImage(editData.cover_file);
        imageUrl = uploadResponse.data?.image_url || uploadResponse.data?.url;
      }

      // Update story
      await updateStory(story.id, {
        title: editData.title,
        description: editData.description,
        cover_url: imageUrl,
      });

      toast.success("Story updated successfully");
      setShowEditModal(false);
      onUpdate();
    } catch (err) {
      console.error("Error updating story:", err);
      toast.error("Failed to update story");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <Card.Body>
          <div className="d-flex gap-4">
            {/* Cover Image */}
            {story?.cover_url && (
              <img
                src={story.cover_url || "/placeholder.svg"}
                alt={story?.title}
                style={{
                  width: "150px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            )}

            {/* Story Details */}
            <div className="flex-grow-1">
              <h3 className="mb-3">{story?.title}</h3>
              <p className="text-muted mb-3">{story?.description}</p>

              <div className="mb-3">
                <h6>Story Stats</h6>
                <div className="d-flex gap-3">
                  <span>
                    <i className="bi bi-eye me-1"></i>
                    {story?.reads || 0} reads
                  </span>
                  <span>
                    <i className="bi bi-heart me-1"></i>
                    {story?.votes || 0} votes
                  </span>
                </div>
              </div>

              <Button variant="primary" onClick={handleEditClick}>
                <i className="bi bi-pencil me-1"></i>
                Edit Details
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Story Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Cover Upload */}
            <Form.Group className="mb-3">
              <Form.Label>Story Cover</Form.Label>
              <div
                className="border rounded p-3 text-center"
                style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}
                onClick={() =>
                  document.getElementById("edit-cover-input").click()
                }
              >
                {previewUrl ? (
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    style={{ maxHeight: "200px", maxWidth: "100%" }}
                  />
                ) : (
                  <div>
                    <i className="bi bi-image" style={{ fontSize: "2rem" }}></i>
                    <p className="mt-2 mb-0">Click to upload cover image</p>
                  </div>
                )}
              </div>
              <input
                id="edit-cover-input"
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                style={{ display: "none" }}
              />
            </Form.Group>

            {/* Title */}
            <Form.Group className="mb-3">
              <Form.Label>Story Title</Form.Label>
              <Form.Control
                type="text"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                placeholder="Enter story title"
              />
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                placeholder="Enter story description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StoryDetailsTab;
