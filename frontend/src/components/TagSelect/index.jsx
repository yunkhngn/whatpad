import { Badge } from "react-bootstrap";
import { getTags } from "../../services/api";
import { useEffect, useState } from "react";
import styles from "./TagSelect.module.css";

export default function TagSelect({ story, setStory }) {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    getAllTags();
  }, []);

  async function getAllTags() {
    const response = await getTags();
    setTags(response.tags);
  }

  const handleTagSelect = (tag) => {
    // Prevent duplicates
    if (!story.tags.find((t) => t.id === tag.id)) {
      setStory({
        ...story,
        tags: [...story.tags, tag],
      });
    }
  };

  const handleRemoveTag = (tagId) => {
    setStory({
      ...story,
      tags: story.tags.filter((t) => t.id !== tagId),
    });
  };

  return (
    <div className={styles.tagSelectContainer}>
      <div className={styles.tagsSection}>
        <div className={styles.tagDropdownWrapper}>
          <button
            type="button"
            className={styles.tagDropdownBtn}
            onClick={(e) => {
              e.preventDefault();
              const menu = e.currentTarget.nextElementSibling;
              menu.style.display =
                menu.style.display === "none" ? "block" : "none";
            }}
          >
            <i className="bi bi-plus me-2"></i>
            Add a tag
          </button>
          <div className={styles.tagDropdownMenu}>
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={styles.tagDropdownItem}
                onClick={() => {
                  handleTagSelect(tag);
                  const menu = document.querySelector(
                    `.${styles.tagDropdownMenu}`
                  );
                  if (menu) menu.style.display = "none";
                }}
              >
                {tag.name}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Tags Display */}
        <div className={styles.selectedTags}>
          {story.tags.map((tag) => (
            <Badge key={tag.id} className={styles.selectedTag}>
              {tag.name}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => handleRemoveTag(tag.id)}
              >
                <i className="bi bi-x"></i>
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
