"use client";

import { Container, Row, Col, Form } from "react-bootstrap";
import styles from "./ChapterEditor.module.css";

function ChapterEditor({ fetchedChapter, chapterEdit, setChapterEdit }) {
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
    </Container>
  );
}

export default ChapterEditor;
