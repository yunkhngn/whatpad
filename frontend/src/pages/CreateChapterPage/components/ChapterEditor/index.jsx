"use client";

import { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import ImportModal from "../ImportModal";
import styles from "./ChapterEditor.module.css";

function ChapterEditor({ chapterEdit, setChapterEdit }) {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImport = (text) => {
    // Preserve the formatting: line breaks, spacing, and case
    setChapterEdit({ ...chapterEdit, content: text });
  };

  return (
    <Container className={styles.chapterEditorContainer}>
      <Row>
        <Col className="mx-auto">
          <Form className={styles.chapterEditorForm}>
            <Form.Control
              type="text"
              placeholder="Chapter Title"
              value={chapterEdit.title}
              onChange={(e) =>
                setChapterEdit({ ...chapterEdit, title: e.target.value })
              }
              className={styles.chapterTitleInput}
            />
            
            {/* Import Button */}
            <div className={styles.importButtonContainer}>
              <Button
                variant="outline-primary"
                onClick={() => setShowImportModal(true)}
                className={styles.importButton}
              >
                <i className="bi bi-file-earmark-arrow-up me-2"></i>
                Import Document
              </Button>
            </div>

            <Form.Control
              as="textarea"
              placeholder="Start writing your chapter..."
              value={chapterEdit.content}
              onChange={(e) =>
                setChapterEdit({ ...chapterEdit, content: e.target.value })
              }
              className={styles.chapterContentInput}
            />
          </Form>
        </Col>
      </Row>

      <ImportModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </Container>
  );
}

export default ChapterEditor;
