"use client";

import { Button } from "react-bootstrap";
import styles from "./CreateChapterHeader.module.css";
import bookCoverPlaceHolder from "../../../../assests/images/book-cover-placeholder.png";

function CreateChapterHeader({
  storyTitle,
  onCancel,
  onSave,
  onNextChapter,
  storyCover,
}) {
  return (
    <header className={styles.createChapterHeader}>
      <div className={styles.headerLeft}>
        <img
          src={storyCover || bookCoverPlaceHolder}
          alt="story cover"
          className={styles.storyCover}
        />
        <h2 className={styles.storyTitle}>{storyTitle}</h2>
      </div>
      <div className={styles.headerRight}>
        <Button variant="light" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={onSave} className={styles.saveBtn}>
          Save
        </Button>
        <Button
          variant="primary"
          onClick={onNextChapter}
          className={styles.saveBtn}
        >
          Next chapter
        </Button>
      </div>
    </header>
  );
}

export default CreateChapterHeader;
