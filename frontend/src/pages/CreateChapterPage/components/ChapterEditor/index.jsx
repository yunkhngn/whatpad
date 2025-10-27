"use client"

import { Container, Row, Col, Form } from "react-bootstrap"
import styles from "./ChapterEditor.module.css"

function ChapterEditor({ title, setTitle, content, setContent }) {
    return (
        <Container className={styles.chapterEditorContainer}>
            <Row>
                <Col className="mx-auto">
                    <Form className={styles.chapterEditorForm}>
                        <Form.Control
                            type="text"
                            placeholder="Chapter Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={styles.chapterTitleInput}
                        />
                        <Form.Control
                            as="textarea"
                            placeholder="Start writing your chapter..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className={styles.chapterContentInput}
                        />
                    </Form>
                </Col>
            </Row>
        </Container>
    )
}

export default ChapterEditor
