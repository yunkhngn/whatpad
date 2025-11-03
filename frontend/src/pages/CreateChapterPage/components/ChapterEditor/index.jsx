import React from 'react';
import { Form } from 'react-bootstrap';

const ChapterEditor = ({ chapter, onChange }) => {
  const handleTitleChange = (e) => {
    onChange({
      ...chapter,
      title: e.target.value,
    });
  };

  const handleContentChange = (e) => {
    onChange({
      ...chapter,
      content: e.target.value,
    });
  };

  return (
    <div className="chapter-editor">
      <Form>
        <Form.Group className="mb-4">
          <Form.Label>Chapter Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter chapter title..."
            value={chapter.title || ''}
            onChange={handleTitleChange}
            size="lg"
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Chapter Content</Form.Label>
          <Form.Control
            as="textarea"
            placeholder="Write your chapter here..."
            value={chapter.content || ''}
            onChange={handleContentChange}
            rows={20}
            style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', lineHeight: '1.8' }}
          />
        </Form.Group>
      </Form>
    </div>
  );
};

export default ChapterEditor;
