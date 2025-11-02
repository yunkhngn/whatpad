"use client";

import { Form, Container, Row, Col, Badge } from "react-bootstrap";
import styles from "./CreateStoryForm.module.css";
import { toast } from "sonner";
import TagSelect from "../../../../components/TagSelect";

export default function CreateStoryForm({
  storyDetails,
  setStoryDetails,
  previewUrl,
  setPreviewUrl,
  titleEmpty,
  setTitleEmpty,
}) {
  const handleTitleChange = (e) => {
    if (e.target.value.length === 0) {
      setTitleEmpty(true);
    } else {
      setTitleEmpty(false);
    }

    setStoryDetails({
      ...storyDetails,
      title: e.target.value,
    });
  };

  const handleDescriptionChange = (e) => {
    setStoryDetails({
      ...storyDetails,
      description: e.target.value,
    });
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoryDetails({
        ...storyDetails,
        cover: file,
      });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCoverClick = () => {
    document.getElementById("cover-input").click();
  };

  return (
    <Container className={styles.storyDetailsFormContainer}>
      <div className={styles.mainContent}>
        <Row className={styles.formRow}>
          {/* Cover Upload Section */}
          <Col lg={4} md={12} className={styles.coverCol}>
            <Form.Group className={styles.formGroup}>
              <Form.Label className={styles.formLabel}>Story Cover</Form.Label>
              <div
                className={styles.coverUploadFrame}
                onClick={handleCoverClick}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Story cover preview"
                    className={styles.coverPreview}
                  />
                ) : (
                  <div className={styles.coverPlaceholder}>
                    <i className="bi bi-image"></i>
                    <p>Click to upload cover image</p>
                  </div>
                )}
              </div>
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                style={{ display: "none" }}
              />
            </Form.Group>
          </Col>
          <Col className={styles.formCol}>
            <Col lg={8} md={12} className={styles.formCol}>
              <Form className={styles.storyDetailsForm}>
                {/* Title Field */}
                <Form.Group className={styles.formGroup}>
                  <Form.Label className={styles.formLabel}>
                    Story Title
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your story title"
                    value={storyDetails.title}
                    onChange={handleTitleChange}
                    className={styles.formControlCustom}
                  />
                  {titleEmpty && (
                    <p className={styles.titleNoti}>* Title is required</p>
                  )}
                </Form.Group>

                {/* Description Field */}
                <Form.Group className={styles.formGroup}>
                  <Form.Label className={styles.formLabel}>
                    Description
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    placeholder="Write a brief description of your story"
                    value={storyDetails.description}
                    onChange={handleDescriptionChange}
                    className={styles.formControlCustom}
                  />
                </Form.Group>

                {/* Tag Select Field */}
                <Form.Group>
                  <TagSelect story={storyDetails} setStory={setStoryDetails} />
                </Form.Group>
              </Form>
            </Col>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
