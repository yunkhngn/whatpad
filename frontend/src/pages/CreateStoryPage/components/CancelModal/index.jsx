import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const CancelModal = ({ show, onHide, onConfirm }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cancel Story Creation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to cancel? All unsaved changes will be lost.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Continue Editing
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Yes, Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CancelModal;
