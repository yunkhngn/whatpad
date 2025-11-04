import { Button, Modal } from "react-bootstrap";
import styles from './CancelModal.module.css'

export default function CancelModal({ show, onHide, onConfirm }) {
    return (
        <Modal show={show} onHide={onHide} centered className={styles.cancelModal}>
            <Modal.Header closeButton className={styles.modalHeader}>
                <Modal.Title className={styles.modalTitle}>Cancel Creation</Modal.Title>
            </Modal.Header>
            <Modal.Body className={styles.modalBody}>
                <p>Are you sure you want to cancel? Any unsaved progress will be lost.</p>
            </Modal.Body>
            <Modal.Footer className={styles.modalFooter}>
                <Button variant="light" onClick={onHide} className={styles.modalBtnNo}>
                    No
                </Button>
                <Button variant="danger" onClick={onConfirm} className={styles.modalBtnYes}>
                    Yes, Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    )
}