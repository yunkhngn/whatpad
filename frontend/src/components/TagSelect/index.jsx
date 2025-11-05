import { Badge } from "react-bootstrap";
import { getTags } from "../../services/api";
import { useEffect, useState } from "react";
import styles from "./TagSelect.module.css";

export default function TagSelect({ story, setStory }) {
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

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
    // Clear search and hide dropdown
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveTag = (tagId) => {
    setStory({
      ...story,
      tags: story.tags.filter((t) => t.id !== tagId),
    });
  };

  // Filter tags based on search term
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.tagSelectContainer}>
      <div className={styles.tagsSection}>
        <div className={styles.tagDropdownWrapper}>
          <div className={styles.searchInputWrapper}>
            <i className="bi bi-search me-2"></i>
            <input
              type="text"
              className={styles.tagSearchInput}
              placeholder="Search for tags..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(e.target.value.length > 0);
              }}
              onFocus={() => setShowDropdown(searchTerm.length > 0)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
          </div>
          {showDropdown && filteredTags.length > 0 && (
            <div className={styles.tagDropdownMenu}>
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={styles.tagDropdownItem}
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag.name}
                </div>
              ))}
            </div>
          )}
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
