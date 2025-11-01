"use client";

import { Button } from "react-bootstrap";
import styles from "./CreateChapterHeader.module.css";

function CreateChapterHeader({ storyTitle, onCancel, onSave }) {
  return (
    <header className={styles.createChapterHeader}>
      <div className={styles.headerLeft}>
        <h2 className={styles.storyTitle}>{storyTitle}</h2>
      </div>
      <div className={styles.headerRight}>
        <Button variant="light" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={onSave} className={styles.saveBtn}>
          Save
        </Button>
        <Button variant="primary" onClick={onSave} className={styles.saveBtn}>
          Next chapter
        </Button>
      </div>
    </header>
  );
}

export default CreateChapterHeader;
