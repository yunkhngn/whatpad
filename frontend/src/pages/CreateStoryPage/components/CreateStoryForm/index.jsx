"use client"

import { Form, Container, Row, Col, Badge } from "react-bootstrap"
import styles from "./CreateStoryForm.module.css"
import { toast } from "sonner"

export default function CreateStoryForm({
    storyDetails,
    setStoryDetails,
    allTags,
    previewUrl,
    setPreviewUrl,
    titleEmpty,
    setTitleEmpty,
}) {
    const handleTitleChange = (e) => {
        if (e.target.value.length === 0) {
            setTitleEmpty(true)
        } else {
            setTitleEmpty(false)
        }

        setStoryDetails({
            ...storyDetails,
            title: e.target.value,
        })
    }

    const handleDescriptionChange = (e) => {
        setStoryDetails({
            ...storyDetails,
            description: e.target.value,
        })
    }

    const handleCoverUpload = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setStoryDetails({
                ...storyDetails,
                cover: file,
            })
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleCoverClick = () => {
        document.getElementById("cover-input").click()
    }

    const handleTagSelect = (tag) => {
        // Prevent duplicates
        if (!storyDetails.tags.find((t) => t.id === tag.id)) {
            setStoryDetails({
                ...storyDetails,
                tags: [...storyDetails.tags, tag],
            })
        }
    }

    const handleRemoveTag = (tagId) => {
        setStoryDetails({
            ...storyDetails,
            tags: storyDetails.tags.filter((t) => t.id !== tagId),
        })
    }

    return (
        <Container className={styles.storyDetailsFormContainer}>
            <div className={styles.mainContent}>
                <Row className={styles.formRow}>
                    {/* Cover Upload Section */}
                    <Col lg={4} md={12} className={styles.coverCol}>
                        <Form.Group className={styles.formGroup}>
                            <Form.Label className={styles.formLabel}>Story Cover</Form.Label>
                            <div className={styles.coverUploadFrame} onClick={handleCoverClick}>
                                {previewUrl ? (
                                    <img src={previewUrl || "/placeholder.svg"} alt="Story cover preview" className={styles.coverPreview} />
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
                                    <Form.Label className={styles.formLabel}>Story Title</Form.Label>
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
                                    <Form.Label className={styles.formLabel}>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={6}
                                        placeholder="Write a brief description of your story"
                                        value={storyDetails.description}
                                        onChange={handleDescriptionChange}
                                        className={styles.formControlCustom}
                                    />
                                </Form.Group>

                                {/* Tags Field */}
                                <Form.Group className={styles.formGroup}>
                                    <Form.Label className={styles.formLabel}>Tags</Form.Label>
                                    <div className={styles.tagsSection}>
                                        <div className={styles.tagDropdownWrapper}>
                                            <button
                                                type="button"
                                                className={styles.tagDropdownBtn}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    const menu = e.currentTarget.nextElementSibling
                                                    menu.style.display = menu.style.display === "none" ? "block" : "none"
                                                }}
                                            >
                                                <i className="bi bi-plus me-2"></i>
                                                Add a tag
                                            </button>
                                            <div className={styles.tagDropdownMenu}>
                                                {allTags.map((tag) => (
                                                    <div
                                                        key={tag.id}
                                                        className={styles.tagDropdownItem}
                                                        onClick={() => {
                                                            handleTagSelect(tag)
                                                            const menu = document.querySelector(`.${styles.tagDropdownMenu}`)
                                                            if (menu) menu.style.display = "none"
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Selected Tags Display */}
                                        <div className={styles.selectedTags}>
                                            {storyDetails.tags.map((tag) => (
                                                <Badge key={tag.id} className={styles.selectedTag} bg="primary">
                                                    {tag.name}
                                                    <button type="button" className={styles.tagRemoveBtn} onClick={() => handleRemoveTag(tag.id)}>
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </Form.Group>
                            </Form>
                        </Col>
                    </Col>
                </Row>
            </div>
        </Container>
    )
}