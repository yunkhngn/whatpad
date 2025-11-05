"use client";

import { useEffect, useState } from "react";
import { Card, Button, Modal, Form } from "react-bootstrap";
import { updateStory, uploadImage, getTags } from "../../../services/api";
import { toast } from "sonner";
import BookCoverPlaceholder from "../../../assests/images/book-cover-placeholder.png";
import TagSelect from "../../../components/TagSelect";

const StoryDetailsTab = ({ story, setStory, onUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    title: story?.title || "",
    description: story?.description || "",
    cover_url: story?.cover_url || "",
  });
  const [previewUrl, setPreviewUrl] = useState(story?.cover_url || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllTags();
  }, []);

  async function getAllTags() {
    await getTags();
  }

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
    <div className="w-100 d-flex justify-content-center align-items-center flex-column">
      <Card
        className="w-75 position-relative py-5 px-2"
        style={{ minWidth: "400px" }}
      >
        <Button
          variant="light"
          onClick={handleEditClick}
          className="position-absolute"
          style={{ width: "150px", top: "8px", right: "8px" }}
        >
          <i className="bi bi-pencil me-1"></i>
          Edit Details
        </Button>

        <Card.Body>
          <div className="d-flex gap-5">
            {/* Cover Image */}
            <img
              src={story.cover_url || BookCoverPlaceholder}
              alt={story?.title}
              style={{
                width: "190px",
                height: "300px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />

            {/* Story Details */}
            <div className="flex-grow-1">
              <h3 className="mb-3 fs-4">{story?.title}</h3>
              <div className="mb-3">
                <div className="d-flex gap-3 mb-3">
                  <span>
                    <i className="bi bi-eye me-1"></i>
                    {story?.read_count || 0} reads
                  </span>
                  <span>
                    <i className="bi bi-heart me-1"></i>
                    {story?.vote_count || 0} votes
                  </span>
                </div>
                <div>
                  <h5 className="fw-semibold">Description</h5>
                  {story.description ? (
                    <p className="text-muted mb-3">{story?.description}</p>
                  ) : (
                    <p className="text-secondary">Empty</p>
                  )}
                </div>
                <div>
                  <h5 className="fw-semibold">Tags</h5>
                  {story.tags || story.tags.length === 0 ? (
                    <p className="text-secondary">Empty</p>
                  ) : (
                    story.tags.map((tag) => <div>{tag.name}</div>)
                  )}
                </div>
              </div>
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
          <Form className="d-flex gap-3">
            {/* Cover Upload */}
            <Form.Group className="mb-3">
              <Form.Label>Story Cover</Form.Label>
              <div
                className="border rounded-2 overflow-hidden text-center d-flex align-items-center"
                style={{
                  cursor: "pointer",
                  backgroundColor: "#f8f9fa",
                  height: "300px",
                  width: "180px",
                }}
                onClick={() =>
                  document.getElementById("edit-cover-input").click()
                }
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      height: "100%",
                      width: "100%",
                      objectFit: "cover",
                    }}
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

            <div className="w-100">
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

              <Form.Group>
                <Form.Label>Tags</Form.Label>
                <TagSelect story={story} setStory={setStory} />
              </Form.Group>
            </div>
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
    </div>
  );
};

export default StoryDetailsTab;
